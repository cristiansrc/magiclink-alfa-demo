import {useEffect, useState} from 'react';
import {iniciar as documentos} from './documentos.js';
import {iniciar as pago} from './pago.js';
export default function Consulta() {
  const query = new URLSearchParams(location.search);
  const escenario = query.get('escenario');
  const config = JSON.parse(sessionStorage.getItem('escenario-alfa') || 'null');
  const documento = config?.id === escenario ? config.documento : '';
  const resumen = query.has('resumen');
  const anterior = JSON.parse(sessionStorage.getItem('consulta-demo') || '{}');
  const [resultado, mostrar] = useState(resumen ? 'encontrado' : '');
  const enlace = producto => {
    const parametros = new URLSearchParams({resumen:'1', producto});
    if (escenario) parametros.set('escenario', escenario);
    return 'index.html?' + parametros;
  };
  function consultar(event) {
    event.preventDefault();
    const value = event.currentTarget.elements.numero.value.trim();
    const code = document.getElementById('doc-code').textContent;
    sessionStorage.setItem('consulta-demo', JSON.stringify({value, code}));
    mostrar((documento ? value === documento && code === 'C.C' : Boolean(value)) ? 'encontrado' : 'vacio');
  }
  useEffect(() => {
    documentos();
    if (resumen && !documento && anterior.code) {
      [...document.querySelectorAll('.doc-options button')].find(b => b.dataset.code === anterior.code)?.click();
    }
    pago();
  }, []);
  return <>

    <header>
      <img src="assets/alfa.png" alt="Seguros Alfa" />
    </header>
    <main>
      <section className="box">
        <h1>Consulta y paga tus pólizas</h1>
        <p>Selecciona el tipo de documento, ingresa tu número y presiona Consultar para ver tus seguros.</p>
        <form id="consulta" onSubmit={consultar}>
          <strong id="doc-label">Tipo de documento</strong>
          <div className="search">
            <details className="doc-picker"><summary id="doc" aria-labelledby="doc-label doc-code"><span id="doc-code">C.C</span></summary><div className="doc-options" role="group" aria-labelledby="doc-label">
              <button type="button" data-code="C.C" aria-pressed="true">C.C (Cédula de ciudadanía)</button>
              <button type="button" data-code="C.E" aria-pressed="false">C.E (Cédula de extranjería)</button>
              <button type="button" data-code="NIT" aria-pressed="false">NIT (Número de identificación tributaria)</button>
              <button type="button" data-code="TI" aria-pressed="false">TI (Tarjeta de identidad)</button>
              <button type="button" data-code="P.P" aria-pressed="false">P.P (Pasaporte)</button>
              <button type="button" data-code="RC" aria-pressed="false">RC (Registro civil de nacimiento)</button>
              <button type="button" data-code="D.E" aria-pressed="false">D.E (Documento de identificación extranjero)</button>
</div></details>
            <input id="numero" name="numero" defaultValue={documento || (resumen ? anterior.value || "12" : "")} required inputMode="numeric" aria-label="Número de documento" placeholder="Ejemplo: 1000298267" />
            <button>Consultar pólizas　 <svg className="icon icon-arrow-right" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
          </div>
        </form>
        <small><svg className="icon icon-lock-keyhole" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>　Consulta protegida. Este es un canal oficial de Seguros Alfa.</small>
      </section>
      <section className="rows" hidden={resultado !== "encontrado"}>
        <div className="rowhead">
          <h2>Resumen de Seguros</h2>
          <span>5 pólizas encontradas</span>
        </div>
        <article className="policy ">
          <div className="policy-grid">
            <div>
              <b>Hogar Transversal</b>
              <small>GRD-7812-334 · Vence 25 ago 2024</small>
            </div>
            <div>
              <small>Periodicidad</small>
              <b>Mensual</b>
            </div>
            <div>
              <small>Estado de póliza</small>
              <b className="positive">Activo</b>
            </div>
            <span>COP 125.000</span>
            <span className="badge warn"><svg className="icon icon-dot" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12.1" cy="12.1" r="1"/></svg> Pendiente</span>
            <a className="btn" href={enlace('GRD-7812-334')}>Pagar</a>
          </div>
        </article>
        <article className="policy ">
          <div className="policy-grid">
            <div>
              <b>Hogar Transversal</b>
              <small>GRD-7812-324 · Vence 25 ago 2024</small>
            </div>
            <div>
              <small>Periodicidad</small>
              <b>Mensual</b>
            </div>
            <div>
              <small>Estado de póliza</small>
              <b className="positive">Activo</b>
            </div>
            <span>COP 125.000</span>
            <span className="badge info"><svg className="icon icon-dot" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12.1" cy="12.1" r="1"/></svg> En proceso</span>
            <button disabled>Pagar</button>
          </div>
        </article>
        <article className="policy late">
          <div className="policy-grid">
            <div>
              <b>Vida Grupo - Salva Factura</b>
              <small>VID-7812-334 · Vence 24 ago 2024</small>
            </div>
            <div>
              <small>Periodicidad</small>
              <b>Trimestral</b>
            </div>
            <div>
              <small>Estado de póliza</small>
              <b className="negative">Mora</b>
            </div>
            <span>COP 125.000</span>
            <span className="badge bad"><svg className="icon icon-dot" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12.1" cy="12.1" r="1"/></svg> Rechazada</span>
            <a className="btn" href={enlace('VID-7812-334')}>Pagar</a>
          </div>
        </article>
        <article className="policy late">
          <div className="policy-grid">
            <div>
              <b>Autos - Élite</b>
              <small>AUT-7812-323 · Vence 24 ago 2024</small>
            </div>
            <div>
              <small>Periodicidad</small>
              <b>Trimestral</b>
            </div>
            <div>
              <small>Estado de póliza</small>
              <b className="negative">Mora</b>
            </div>
            <span>COP 125.000</span>
            <span className="badge bad"><svg className="icon icon-dot" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12.1" cy="12.1" r="1"/></svg> Rechazada</span>
            <a className="btn" href={enlace('AUT-7812-323')}>Reintentar</a>
          </div>
        </article>
        <article className="policy ">
          <div className="policy-grid">
            <div>
              <b>Autos - Élite</b>
              <small>AUT-7812-434 · Vence 23 ago 2024</small>
            </div>
            <div>
              <small>Periodicidad</small>
              <b>Mensual</b>
            </div>
            <div>
              <small>Estado de póliza</small>
              <b className="positive">Activo</b>
            </div>
            <span>COP 125.000</span>
            <span className="badge good"><svg className="icon icon-dot" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12.1" cy="12.1" r="1"/></svg> Pagada</span>
            <button disabled>Pagada</button>
          </div>
        </article>
        <small>Mostrando 5 de 5 registros</small>
        <nav className="pages"><svg className="icon icon-chevron-left" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>　Anterior　 <b>1</b>　 Siguiente　<svg className="icon icon-chevron-right" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></nav>
      </section>
    <aside id="sin" className="notice bad" hidden={resultado !== "vacio"}>No encontramos pólizas con esos datos.</aside></main>
    <footer>
      <span>Canales de atención</span>
      <span>Privacidad del sitio web</span>
      <img src="assets/vigilado.png" alt="Vigilado por la Superintendencia Financiera de Colombia" />
    </footer>
  <dialog id="pago-modal" aria-labelledby="titulo-pago">
  <div className="brand">Pago seguro con <img src="https://www.rapyd.net/wp-content/uploads/2022/07/rapyd-logo.svg" alt="Rapyd" width="84" /></div>
  <button className="cerrar-modal" type="button" aria-label="Cerrar">×</button>
  <h2 id="titulo-pago">Completa tu pago</h2>
  <p id="instruccion-tarjeta">Ingresa los datos de tu tarjeta en el formulario seguro de Rapyd.</p>
  <div className="summary spread"><div><strong id="producto"></strong><small id="frecuencia"></small></div><b>COP 125.000</b></div>
  <p>Si Rapyd te ofrece guardar la tarjeta, puedes autorizar los próximos cobros de esta póliza. Al finalizar podrás consultar por separado el resultado del pago y el de la inscripción. <button type="button" className="legal-link" id="saber-mas">Saber más</button></p>
  <p id="mensaje" role="status"></p>
  <div className="checkout-area">
    <div id="rapyd-checkout"></div>
    <div id="carga-formulario" role="status" hidden>
      <img src="assets/procesando.gif" width="58" height="58" alt="" />
      <span>Procesando…</span>
    </div>
  </div>
  <p id="retorno-info" hidden>La validación bancaria se gestiona desde el formulario de Rapyd. También puedes <a id="consultar-resultado" target="_blank" rel="noopener">abrir el resultado de Alfa en otra pestaña</a> y actualizarlo después de la verificación.</p>
  <details id="inicio" hidden><summary>Opciones de prueba</summary>
    <label>Checkout de esta póliza creado en Sandbox<input id="existente" placeholder="checkout_…" autoComplete="off" /></label>
    <button id="usar" type="button">Mostrar formulario</button>
    <a id="simular" href="pruebas.html">Revisar escenarios de prueba</a>
  </details>
</dialog>
    <dialog id="legal-modal" className="legal" aria-labelledby="legal-title">
      <button type="button" aria-label="Cerrar" className="cerrar-legal">×</button>
      <h3 id="legal-title">Saber más</h3><hr />
      <div className="terms">
          <p>Términos y Condiciones del Pagador</p>
          <p>Seguros de Vida Alfa S.A. ha celebrado un mandato de gestión de pagos con el proveedor de sistema de pagos Rapyd Colombia S.A.S. para habilitar el cobro y recaudo de las primas de seguros.</p>
          <p>En el proceso de compra de seguros a través de los canales digitales de Seguros de Vida Alfa, el pagador (tomador del seguro) conoce y acepta los siguientes términos y condiciones del servicio de cobro y recaudo de primas de seguros:</p>
          <p>Que el pagador utiliza el sistema de pago por su cuenta y riesgo.</p>
          <p>Que el proveedor del sistema de pago no garantiza la disponibilidad o las demoras de la plataforma procesando las transacciones.</p>
          <p>Que el proveedor del sistema de pago no garantiza la seguridad de la plataforma, y en particular la no ocurrencia de fraudes con la información del tarjetahabiente.</p>
          <p>Que el proveedor del sistema de pago no garantiza el correcto ni oportuno procesamiento de las transacciones a través de la plataforma.</p>
          <p>Que el proveedor del sistema de pago se exime de responsabilidad en relación con los bienes y/o servicios ofrecidos, su calidad, seguridad, idoneidad y tiempo de entrega.</p>
          <p>Que el proveedor del sistema de pago no se hace responsable por el pago de los tributos que se causen como consecuencia de la relación contractual entre el Comercio y el Pagador.</p>
          <p>Que el proveedor del sistema de pago se exime de responsabilidad por el incumplimiento del Comercio de sus obligaciones relacionadas con el manejo de datos personales.</p>
          <p>Que el pagador autoriza al proveedor del sistema de pago para utilizar sus datos personales a fin de mitigar el riesgo de suplantación de identidad de los tarjetahabientes, enviarles información promocional y publicitaria Rapyd, de los comercios registrados en la Plataforma Rapyd y de terceros que incluyan promociones para la compra de bienes o servicios a través de la Plataforma Rapyd, enviar cupones de descuento, afiliar a programas de lealtad, crear perfiles de consumo del pagador, entre otros materiales promocionales y publicitarios que puedan llegar a ser de interés del pagador.</p>
          <p>Que el pagador podrá solicitar al proveedor del sistema de pago, en cualquier momento, que no se le envíe información promocional o publicitaria, o que se le envíe sólo cierta información que sea de su interés.</p>
        </div>
    </dialog>
    
  </>;
}
