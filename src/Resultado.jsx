import {useEffect} from 'react';
import {iniciar} from './retorno.js';
export default function Resultado() {
  useEffect(() => { iniciar(); }, []);
  return <>

    <header>
      <img src="assets/alfa.png" alt="Seguros Alfa" />
    </header>
    <main>
      <div className="brand"><svg className="icon icon-lock-keyhole" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg> Pago seguro con <img src="https://www.rapyd.net/wp-content/uploads/2022/07/rapyd-logo.svg" alt="Rapyd" />
      </div>
      <article className="receipt" id="recibo" hidden>
        <div className="banner" id="banner">
          <span className="symbol" id="icon-aprobado" hidden><svg className="icon icon-circle-check" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span>
          <span className="symbol" id="icon-pendiente" hidden><svg className="icon icon-clock" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
          <span className="symbol" id="icon-rechazado" hidden><svg className="icon icon-triangle-alert" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>
          <h2 id="titulo"></h2><p id="descripcion"></p>
        </div>
        <div className="details">
          <small id="origen"></small>
          <dl>
              <div><dt>Empresa</dt><dd>Seguros de Vida Alfa S.A.</dd></div>
              <div><dt>NIT</dt><dd>860503617-3</dd></div>
              <div><dt>Fecha</dt><dd id="fecha">—</dd></div>
              <div><dt>Estado del pago</dt><dd id="pago">—</dd></div>
              <div><dt>Inscripción para pagos recurrentes</dt><dd id="tarjeta">—</dd></div>
              <div><dt>Póliza</dt><dd id="producto">—</dd></div>
              <div><dt>Referencia del intento</dt><dd id="referencia">—</dd></div>
              <div><dt>Referencia de transacción</dt><dd id="transaccion">—</dd></div>
              <div><dt>Valor</dt><dd id="valor">—</dd></div>
              <div><dt>Moneda</dt><dd id="moneda">—</dd></div>
          </dl>
          <aside id="aviso" className="notice warn" hidden>Mientras validamos el pago, puedes volver al resumen. Evita iniciar otro pago para la misma póliza.</aside>
          <p id="detalle" role="status"></p>
          <div className="actions">
            <button id="descargar" hidden>Descargar comprobante</button>
            <a className="btn" id="reintentar" hidden>Reintentar pago</a>
            <a className="btn outline" id="cambiar" hidden>Cambiar medio de pago</a>
            <button className="outline" id="actualizar" hidden>Actualizar resultado</button>
            <a className="btn outline" id="resumen" href="index.html?resumen=1">Volver al resumen de pólizas</a>
          </div>
        </div>
      </article>
    </main>
    <footer>
      <span>Canales de atención</span>
      <span>Privacidad del sitio web</span>
      <p>© 2026 SEGUROS ALFA</p>
    <div className="restart-demo"><a className="btn outline" href="/pruebas.html">Reiniciar demo</a></div></footer>
  <dialog id="procesando" className="loader" aria-label="Procesando"><img src="assets/procesando.gif" width="58" height="58" alt="" /><p role="status">Procesando…</p></dialog>
  
  </>;
}
