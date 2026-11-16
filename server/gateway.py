"""Adaptador local de pruebas. Python 3, sin dependencias externas."""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PRODUCTS = {"VID-7812-334": "VIDA", "GRD-7812-334": "GENERALES", "AUT-7812-323": "GENERALES"}
from server.storage import Store
customers = Store("customers")
attempts = Store("attempts")


def public_origin():
    deployment = os.getenv("VERCEL_URL")
    return os.getenv("MAGICLINK_PUBLIC_URL") or ("https://" + deployment if deployment else "")


def cargar_cuenta_personal():
    archivo = Path("/tmp") / f"magiclink-personal-{os.getuid()}" / "sandbox.json"
    if not archivo.exists():
        return
    for ruta in (archivo.parent, archivo):
        if ruta.is_symlink() or ruta.stat().st_uid != os.getuid() or ruta.stat().st_mode & 0o077:
            raise RuntimeError("Verifica los permisos privados del perfil de prueba.")
    perfil = json.loads(archivo.read_text())
    for cuenta in set(PRODUCTS.values()):
        acceso, secreto = "RAPYD_ACCESS_KEY_" + cuenta, "RAPYD_SECRET_KEY_" + cuenta
        if not os.getenv(acceso) and not os.getenv(secreto):
            os.environ[acceso], os.environ[secreto] = perfil["access"], perfil["secret"]


class SolicitudRechazada(ValueError):
    """Rapyd rechazó la solicitud antes de crear el recurso."""

    def __init__(self, code, operation_id=None):
        self.code = code
        message = f"Rapyd respondió {code}."
        if operation_id:
            message += f" Referencia de soporte: {operation_id}."
        super().__init__(message)


def rapyd(path, payload, account, reference):
    access = os.environ["RAPYD_ACCESS_KEY_" + account]
    secret = os.environ["RAPYD_SECRET_KEY_" + account]
    reading = payload is None
    body = "" if reading else json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    salt, timestamp = secrets.token_hex(8), str(int(time.time()))
    signed = (("get" if reading else "post") + path + salt + timestamp + access + secret + body).encode()
    digest = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest().encode()
    headers = {"Content-Type": "application/json", "access_key": access, "salt": salt,
               "timestamp": timestamp, "signature": base64.b64encode(digest).decode()}
    if not reading:
        headers["idempotency"] = reference
    request = Request("https://sandboxapi.rapyd.net" + path, data=None if reading else body.encode(), headers=headers)
    try:
        with urlopen(request, timeout=20) as result:
            data = json.load(result)
    except HTTPError as error:
        operation_id = None
        try:
            status = json.load(error)["status"]
            code = status["error_code"]
            operation_id = status.get("operation_id")
        except (ValueError, KeyError, TypeError):
            code = "HTTP " + str(error.code)
        if error.code in (400, 401, 403, 422):
            raise SolicitudRechazada(code, operation_id) from None
        raise ValueError("Rapyd respondió " + str(code)) from None
    if data.get("status", {}).get("status") != "SUCCESS":
        status = data.get("status", {})
        if status.get("error_code") == "ERROR_HOSTED_PAGE_COUNTRY_CURRENCY_MISMATCH":
            raise SolicitudRechazada(status["error_code"], status.get("operation_id"))
        raise ValueError("Rapyd respondió " + str(status.get("error_code")))
    return data["data"] if reading else data["data"]["id"]


def inscripcion(product, documento, tipo):
    # Datos de prueba que aportaría el backend de MagicLink al abrir la póliza.
    account = PRODUCTS[product]
    return {"correo_electronico": "cliente.prueba@example.com", "identificador_producto": product,
            "tipo_producto": account, "fecha_inicio_recaudo": "2026-11-16",
            "periodicidad_pago": "MENSUAL" if product.startswith("GRD") else "TRIMESTRAL",
            "valor_pago_recurrente": 125000, "modulo": "DEBITO_AUTOMATICO", "cuenta_pasarela": account,
            "nombre_titular": "Cliente Prueba Alfa", "tipo_documento": tipo,
            "numero_documento": documento, "telefono_titular": "+573000000000"}


def checkout(product, attempt, solicitar_3ds=False, documento="12", tipo="C.C"):
    if not isinstance(documento, str) or not re.fullmatch(r"[A-Za-z0-9]{1,24}", documento) or not isinstance(tipo, str) or not re.fullmatch(r"[A-Za-z.]{1,8}", tipo):
        raise ValueError("Revisa el tipo y número de documento de prueba.")
    record = inscripcion(product, documento, tipo)
    account = record["cuenta_pasarela"]
    if not all(os.getenv(prefix + account) for prefix in ("RAPYD_ACCESS_KEY_", "RAPYD_SECRET_KEY_")):
        raise ValueError("Configura las llaves Sandbox de " + account + " o usa un Checkout creado en Postman.")
    origin = public_origin().rstrip("/")
    if origin and (urlsplit(origin).scheme != "https" or not urlsplit(origin).netloc):
        raise ValueError("Configura MAGICLINK_PUBLIC_URL con la URL HTTPS donde está el demo para el retorno 3DS.")
    identity = hmac.new(os.environ["RAPYD_SECRET_KEY_" + account].encode(), "\x00".join((account, tipo, documento)).encode(), hashlib.sha256).hexdigest()
    if attempt in attempts:
        prior_product, prior_identity, session, expires = attempts[attempt]
        if identity != prior_identity or product != prior_product or not session or time.time() >= expires:
            raise ValueError("El intento requiere revisión antes de abrir otra sesión.")
        return session
    if customers.reserve(identity, None):
        customers[identity] = os.getenv("RAPYD_CUSTOMER_" + account) if documento == "12" and tipo == "C.C" else None
        if not customers[identity]:
            try:
                customers[identity] = rapyd("/v1/customers", {"name": record["nombre_titular"],
                "email": record["correo_electronico"], "phone_number": record["telefono_titular"],
                "metadata": {"enrollment_attempt_id": attempt}}, account, "cus-" + attempt)
            except SolicitudRechazada:
                del customers[identity]
                raise
    if not customers[identity]:
        raise ValueError("Verifica el alta anterior del cliente en Rapyd para este documento.")
    expires = int(time.time()) + 1800
    if not attempts.reserve(attempt, [product, identity, None, expires]):
        raise ValueError("Ya hay una solicitud para este intento. Consulta su resultado.")
    back = origin + "/retorno-3ds.html?intento=" + attempt
    payload = {"customer": customers[identity], "country": "CO", "currency": "COP", "amount": record["valor_pago_recurrente"],
               "capture": True, "language": "es", "merchant_reference_id": attempt,
               "payment_method_type_categories": ["card"], "max_payment_retries_attempt": 0,
               "recurrence_type": "recurring", "save_payment_method": True,
               "custom_elements": {"save_card_default": False, "hide_save_card": False},
               "page_expiration": expires}
    if solicitar_3ds:
        payload["payment_method_options"] = {"3d_required": True}
    if origin:
        payload.update(complete_payment_url=back, error_payment_url=back,
                       complete_checkout_url=back, cancel_checkout_url=back)
    try:
        session = rapyd("/v1/checkout", payload, account, "chk-" + attempt)
    except SolicitudRechazada as error:
        del attempts[attempt]
        if error.code != "ERROR_HOSTED_PAGE_COUNTRY_CURRENCY_MISMATCH":
            raise
        try:
            methods = rapyd("/v1/payment_methods/countries/CO?currency=COP", None, account, None)
            cards = [m["type"] for m in methods if m.get("category") == "card"]
            if cards:
                detail = ("El catálogo CO/COP lista estas tarjetas: " + ", ".join(cards)
                          + ". Rapyd rechazó su uso en este Checkout. Consulta con soporte la habilitación para pagos recurrentes.")
            else:
                detail = "El catálogo de esta cuenta de prueba no devolvió tarjetas para Colombia en COP."
        except (OSError, ValueError, KeyError, TypeError):
            detail = "No se pudo consultar el catálogo de tarjetas CO/COP de esta cuenta."
        raise ValueError(f"{error} {detail}") from None
    attempts[attempt] = product, identity, session, expires
    return session


def resultado(attempt, product=None, session=None):
    recovered = attempt not in attempts
    if recovered:
        if product not in PRODUCTS or not re.fullmatch(r"checkout_[a-zA-Z0-9]+", session or ""):
            raise KeyError(attempt)
        customer_id = None
    else:
        product, identity, session, _ = attempts[attempt]
        customer_id = customers[identity]
    account = PRODUCTS[product]
    pending = "Pendiente de confirmación"
    result = {"pago": pending, "tarjeta": pending}
    if not session:
        result["detalle"] = "El demo todavía no tiene un Checkout confirmado para este intento."
        return result
    def retrieve(path):
        return rapyd(path, None, account, None)
    page = retrieve("/v1/checkout/" + session)
    payment_ref = page.get("payment")
    payment_id = payment_ref.get("id") if isinstance(payment_ref, dict) else payment_ref
    if not payment_id:
        result["detalle"] = "Rapyd todavía no informa un pago asociado a este Checkout. Si ya enviaste el formulario, consulta de nuevo este mismo intento."
        if page.get("status") == "EXP":
            result["detalle"] = "El Checkout venció sin informar un identificador de pago."
            result["pago"] = "Sesión vencida"
        return result
    payment = retrieve("/v1/payments/" + payment_id)
    if recovered:
        if payment.get("merchant_reference_id") != attempt:
            raise KeyError(attempt)
        customer_id = payment.get("customer_token")
    result["comprobante"] = {"producto": product, "transaccion": payment_id,
                             "valor": payment.get("amount"), "moneda": payment.get("currency"),
                             "fecha": payment.get("created_at")}
    status = payment.get("status")
    if status == "CLO" and payment.get("paid") is True:
        result["pago"] = "Aprobado"
    else:
        result["pago"] = {"ERR": "Rechazado", "CAN": "Cancelado", "EXP": "Vencido"}.get(status, pending)
    if status == "ACT":
        result["detalle"] = ("Rapyd mantiene el pago activo y solicita una validación. Completa ese paso en la pestaña del pago."
                             if payment.get("redirect_url") else "Rapyd mantiene el pago activo. Puedes consultar de nuevo este intento.")
    candidate = (payment.get("payment_method_data") or {}).get("id") or payment.get("payment_method")
    if customer_id and isinstance(candidate, str) and candidate.startswith("card_"):
        try:
            cards = retrieve("/v1/customers/" + customer_id + "/payment_methods?category=card&limit=100")
        except (ValueError, OSError):
            result["detalle"] = result.get("detalle", "") + " No pudimos consultar las tarjetas del cliente en Rapyd."
            return result
        rows = cards if isinstance(cards, list) else cards.get("data", [])
        for card in rows:
            if card.get("id") == candidate and card.get("recurrence_type") == "recurring":
                result["tarjeta"] = "Inscrita"
                result["payment_method_id"] = candidate
                result["payment_method"] = card
                break
    if result["tarjeta"] == pending and payment.get("save_payment_method") is False and status == "CLO":
        result["tarjeta"] = "Sin inscripción"
    return result


class Handler(BaseHTTPRequestHandler):
    def send(self, status, content, kind):
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        if urlsplit(self.path).path == "/api/resultado":
            try:
                url = urlsplit(self.path)
                params = parse_qs(url.query)
                attempt = str(uuid.UUID(params["intento"][0]))
                data = resultado(attempt, params.get("producto", [None])[0], params.get("checkout", [None])[0])
                status = 200
            except KeyError:
                data, status = {"error": "El servidor del demo no conserva este intento. Comprueba su referencia en Rapyd Sandbox."}, 404
            except (ValueError, OSError):
                data, status = {"error": "No pudimos consultar Rapyd Sandbox. Vuelve a actualizar este resultado."}, 502
            return self.send(status, json.dumps(data).encode(), "application/json")
        self.send_error(404)

    def do_POST(self):
        if self.path != "/api/checkout":
            return self.send_error(404)
        if self.headers.get("Content-Type") != "application/json" or self.headers.get("Sec-Fetch-Site") == "cross-site":
            return self.send_error(403)
        try:
            length = int(self.headers.get("Content-Length", 0))
            if not 0 < length < 2048:
                raise ValueError("Solicitud inválida.")
            data = json.loads(self.rfile.read(length))
            attempt = str(uuid.UUID(data["attempt"]))
            result = {"id": checkout(data["product"], attempt, data.get("solicitar3ds") is True,
                                     data.get("documento", "12"), data.get("tipo", "C.C")),
                      "identidadAplicada": True,
                      "retornoConfigurado": bool(public_origin())}
            status = 200
        except (KeyError, TypeError, ValueError) as error:
            result, status = {"error": str(error)}, 400
        except (TimeoutError, URLError, OSError):
            result, status = {"error": "Respuesta incierta. Consulta el intento en Sandbox antes de repetir."}, 502
        self.send(status, json.dumps(result).encode(), "application/json")


