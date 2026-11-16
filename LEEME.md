# MagicLink · Fase 3 en React

Demo de Recaudo para tarjetas de Colombia en COP. La página inicial es `/pruebas.html`. El recorrido conserva los textos, estilos y pantallas de la fase 2. Se fijaron React y React DOM en 19.2.8. Las historias consultadas no especifican una versión.

## Probar en el equipo

Necesitas Node.js 22 o posterior, npm y Python 3. Desde esta carpeta ejecuta:

```sh
npm ci
npm run dev
```

Abre http://127.0.0.1:8788/pruebas.html. Para revisar las pantallas sin conectarte a Rapyd, elige **Simulación local con resultados elegidos**, configura el documento y el escenario y pulsa **Probar escenario**. Consulta las pólizas y pulsa **Pagar**. Con 3DS, el demo muestra el aviso durante cinco segundos y abre el banco ficticio. Autorizar o cancelar devuelve al comprobante de Alfa. Sin 3DS, el flujo pasa directamente al resultado. El comprobante distingue el pago de la inscripción.

## Probar con el formulario de Rapyd

En **Formulario de Rapyd Sandbox**, el navegador carga el Checkout Toolkit oficial. El servidor crea el cliente o recupera su referencia en la cuenta correspondiente y solicita el Checkout en español por COP 125.000. Usa documentos y tarjetas de prueba. El resultado se obtiene consultando el Checkout, el pago y, cuando corresponde, los medios guardados del cliente. El navegador imprime en consola el objeto del método inscrito que coincide con el del pago. El banco y Rapyd determinan la autenticación y el resultado reales.

Configura en el servidor las variables `RAPYD_ACCESS_KEY_GENERALES`, `RAPYD_SECRET_KEY_GENERALES`, `RAPYD_ACCESS_KEY_VIDA` y `RAPYD_SECRET_KEY_VIDA` según las pólizas que quieras probar. En local también se reconoce el perfil privado de pruebas que utilizaba la fase 2. El demo guarda las referencias en `.demo.sqlite3` en local. Las llaves sólo se utilizan del lado del servidor.

## Desplegar en Vercel

1. Importa el repositorio y selecciona **esta carpeta** como Root Directory. Si subes únicamente su contenido, usa la raíz. Elige el preset **Other**. El archivo `vercel.json` configura la instalación, la compilación, la salida `dist` y las funciones Python.
2. Para la simulación visual puedes desplegar directamente. Para probar el Checkout oficial agrega las llaves de Rapyd Sandbox al entorno del despliegue. Conecta una base Redis compatible con la API REST de Upstash y configura `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. Allí se conservan las referencias de clientes e intentos para recuperarlas desde distintas instancias.
3. Para que la redirección bancaria vuelva al mismo origen donde iniciaste el pago, configura `MAGICLINK_PUBLIC_URL` con la dirección HTTPS que abrirás en el navegador. Por defecto las funciones utilizan la URL del despliegue que proporciona Vercel. El retorno al demo requiere que el navegador pueda acceder a esa URL. Tras cambiar variables, despliega de nuevo.
4. Abre `/pruebas.html`. Prueba primero un resultado simulado y luego el formulario oficial. Una ruta HTTPS de retorno habilita el recorrido de redirección. En localhost sin esa URL, el Toolkit conserva la verificación dentro de su formulario cuando Rapyd lo permite.

Las rutas de consulta de pólizas, banco ficticio y comprobante conservan sus nombres de fase 2. Las dos rutas de servidor son `POST /api/checkout` y `GET /api/resultado?intento=…`. La pasarela está fijada al entorno de pruebas de Rapyd.
