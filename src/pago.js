import { avisarRedireccion } from "./aviso-3ds.js";
export function iniciar() {
  const products = {
    'VID-7812-334': ['Vida Grupo · Salva Factura', 'Trimestral'],
    'GRD-7812-334': ['Hogar Transversal', 'Mensual'],
    'AUT-7812-323': ['Autos · Élite', 'Trimestral']
  };
  const dialog = document.getElementById('pago-modal');
  const requested = new URLSearchParams(location.search).get('producto');
  if (Object.hasOwn(products, requested)) openPayment(requested);

  function openPayment(product) {
    const selected = JSON.parse(sessionStorage.getItem('escenario-alfa') || 'null');
    const scenario = selected && selected.id === new URLSearchParams(location.search).get('escenario') ? selected : null;
    const close = () => location.replace('index.html?resumen=1' + (scenario ? '&escenario=' + scenario.id : ''));
    dialog.querySelector('.cerrar-modal').onclick = close;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom)) close();
    });
    dialog.showModal();
    const $ = id => document.getElementById(id);
    $('producto').textContent = products[product][0] + ' · ' + product;
    $('frecuencia').textContent = products[product][1];
    const consulta = JSON.parse(sessionStorage.getItem('consulta-demo') || '{}');
    const documento = scenario?.documento || consulta.value || '12';
    const tipo = scenario?.documento ? 'C.C' : (consulta.code || 'C.C');
    const key = 'co-cop-' + tipo + '-' + documento + '-intento-' + product + '-' + (scenario?.id || 'directo');
    let attempt = sessionStorage.getItem(key);
    const previous = JSON.parse(sessionStorage.getItem('flujo-' + attempt) || 'null');
    if (!attempt || previous?.finalizado) attempt = crypto.randomUUID();
    sessionStorage.setItem(key, attempt);
    const base = {product, documento, tipo, escenario:scenario?.id};
    const save = data => sessionStorage.setItem('flujo-' + attempt, JSON.stringify({...base,attempt,...data}));
    const next = page => location.assign(page + '?intento=' + encodeURIComponent(attempt));
    let loading = false;
    let active = false;
    let embedded3ds = false;
    const loader = $('carga-formulario');
    const container = $('rapyd-checkout');
    let frameTimer;
    function finishLoading() {
      clearTimeout(frameTimer);
      loader.hidden = true;
      container.inert = false;
      $('rapyd-checkout').removeEventListener('load', frameLoaded, true);
    }
    function frameLoaded(event) {
      if (event.target.tagName === 'IFRAME' && event.target.getAttribute('src')?.startsWith('https://')) finishLoading();
    }
    window.addEventListener('onLoading', event => {
      if (active && event.detail?.loading === false && container.querySelector('iframe')) finishLoading();
    });
    async function mount(id) {
      if (!/^checkout_[A-Za-z0-9]+$/.test(id)) throw Error('Ingresa un identificador checkout_ válido.');
      if (!window.RapydCheckoutToolkit) {
        await new Promise((resolve,reject) => {
          const sdk = document.createElement('script');
          sdk.src = 'https://sandboxcheckouttoolkit.rapyd.net';
          sdk.onload = resolve;
          sdk.onerror = () => reject(Error('No se pudo cargar el formulario de Rapyd. Revisa la conexión.'));
          document.head.append(sdk);
        });
      }
      const field = {base:{borderColor:'#d9dfdd',borderRadius:'6px',color:'#193c30'},active:{borderColor:'#009b76'}};
      const checkout = new RapydCheckoutToolkit({id, pay_button_color:'#009B76',pay_button_text:'Pagar',page_type:'collection',
        wait_on_payment_redirect:embedded3ds, wait_on_payment_confirmation:false, close_on_complete:true,
        style:{input:field,dropdown:field,submit:{base:{backgroundColor:'#009b76',borderRadius:'14px'},hover:{backgroundColor:'#008e6a'}}}});
      save({mode:'sandbox', checkout:id});
      active = true;
      $('rapyd-checkout').addEventListener('load', frameLoaded, true);
      await checkout.displayCheckout();
      $('inicio').hidden = true;
      $('mensaje').textContent = '';
    }
    async function start(existing) {
      if (loading) return;
      loading = true;
      loader.hidden = false;
      container.inert = true;
      frameTimer = setTimeout(() => {
        finishLoading();
        $('mensaje').textContent = 'El formulario está tardando en cargar. Si no aparece, cierra esta ventana y vuelve a intentarlo.';
      }, 15000);
      loader.querySelector('span').textContent = 'Procesando…';
      $('mensaje').textContent = '';
      try {
        let id = $('existente').value.trim();
        embedded3ds = existing;
        if (!existing) {
          // También reconoce intentos cerrados antes de que el demo guardara el resultado en la pestaña.
          if (previous?.checkout && previous.attempt === attempt) {
            const params = new URLSearchParams({producto:product, checkout:previous.checkout});
            const statusResponse = await fetch('/api/resultado?intento=' + attempt + '&' + params);
            if (!statusResponse.ok) throw Error('No pudimos verificar el intento anterior. Actualiza la página para volver a consultarlo.');
            const status = await statusResponse.json();
            if (['Aprobado', 'Rechazado', 'Cancelado', 'Vencido', 'Sesión vencida'].includes(status.pago)) {
              attempt = crypto.randomUUID();
              sessionStorage.setItem(key, attempt);
            }
          }
          const response = await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...base, attempt, solicitar3ds: Boolean(scenario?.tres)})});
          if (response.status === 404) throw Error('Revisa el servidor del demo para habilitar la prueba de Colombia en COP.');
          if (!response.headers.get('content-type')?.includes('application/json')) throw Error('Inicia el servidor local indicado en el LEEME o usa un Checkout de Postman.');
          const data = await response.json();
          if (!response.ok) throw Error(data.error || 'El servidor no pudo crear el Checkout.');
          if (scenario?.documento && data.identidadAplicada !== true) throw Error('Revisa el servidor del demo para usar el documento configurado en esta prueba.');
          id = data.id;
          embedded3ds = !data.retornoConfigurado;
          if (embedded3ds) {
            $('retorno-info').hidden = false;
            $('consultar-resultado').href = 'retorno.html?intento=' + encodeURIComponent(attempt);
          }
        }
        await mount(id);
      } catch (error) { finishLoading(); active=false; $('inicio').hidden=false; $('mensaje').textContent = 'No pudimos abrir el formulario de pago. ' + error.message; }
      finally { loading=false; }
    }

    $('usar').onclick = () => start(true);
    for (const name of ['Success','Failure','Pending','Expired']) {
      window.addEventListener('onCheckoutPayment'+name, event => {
        if (!active) return;
        finishLoading();
        const p = event.detail || {};
        if (p.status === 'ACT' && p.redirect_url) {
          if (embedded3ds) {
            $('mensaje').textContent = 'Completa la verificación bancaria en el formulario de Rapyd.';
            return;
          }
          const redirect = new URL(p.redirect_url);
          if (redirect.protocol === 'https:') {
            active = false;
            avisarRedireccion(redirect.href);
          }
          return;
        }
        active = false;
        next('retorno.html');
      });
    }

    $('simular').href = 'pruebas.html?producto=' + encodeURIComponent(product);
    if (scenario?.mode === 'simulacion') {
      $('instruccion-tarjeta').textContent = 'Simulación local con una tarjeta de prueba.';
      const existente = scenario.inicial === 'inscrita';
      const check = document.createElement('input');
      check.type = 'checkbox';
      if (existente) {
        $('instruccion-tarjeta').textContent = 'Se usará la tarjeta de prueba inscrita para este documento.';
      } else {
        const label = document.createElement('label');
        label.className = 'check';
        label.append(check, 'Guardar esta tarjeta para próximos pagos');
        $('rapyd-checkout').append(label);
      }
      const pay = document.createElement('button');
      pay.textContent = 'Pagar con tarjeta de prueba';
      pay.onclick = () => {
        pay.disabled = true;
        save({mode:'simulacion', pago:scenario.pago, tarjeta:existente ? 'Inscrita' : (check.checked ? scenario.tarjeta : 'Sin inscripción'), existente});
        if (scenario.tres) avisarRedireccion('banco.html?intento=' + attempt);
        else next('retorno.html');
      };
      $('rapyd-checkout').append(pay);
    } else {
      start(false);
    }
  }

  const legalDialog = document.getElementById('legal-modal');
  document.getElementById('saber-mas').onclick = () => legalDialog.showModal();
  legalDialog.querySelector('.cerrar-legal').onclick = () => legalDialog.close();
  legalDialog.addEventListener('click', event => {
    const box = legalDialog.getBoundingClientRect();
    if (event.target === legalDialog && (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom)) legalDialog.close();
  });

}
