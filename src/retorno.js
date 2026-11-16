export function iniciar() {
  const $ = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('intento');
  const attempt = JSON.parse(sessionStorage.getItem('flujo-' + id) || 'null');
  const sim = attempt?.mode === 'simulacion';
  const terminal = ['Aprobado', 'Rechazado', 'Cancelado', 'Verificación cancelada', 'Vencido', 'Sesión vencida'];
  const states = {
    aprobado: ['Pago aprobado', 'Tu pago fue procesado correctamente. Puedes descargar el comprobante.'],
    pendiente: ['Estamos validando tu pago', 'Vuelve a consultar tu póliza en unos minutos para ver el estado actualizado.'],
    rechazado: ['No pudimos completar tu pago', 'Puedes volver al formulario para reintentar el pago o elegir otro medio.']
  };
  let timer;
  let remaining = 6;
  let lastResult;
  $('origen').textContent = sim ? 'SIMULACIÓN' : 'RAPYD SANDBOX';
  $('referencia').textContent = id || '—';
  const summary = new URL($('resumen').href);
  if (attempt?.escenario) summary.searchParams.set('escenario', attempt.escenario);
  $('resumen').href = summary;
  $('procesando').oncancel = e => e.preventDefault();

  function render(result) {
    const info = result.comprobante || {};
    const product = info.producto || attempt?.product;
    const view = result.pago === 'Aprobado' ? 'aprobado' : terminal.includes(result.pago) ? 'rechazado' : 'pendiente';
    for (const key of Object.keys(states)) $('icon-' + key).hidden = key !== view;
    $('banner').className = 'banner ' + ({pendiente:'pending', rechazado:'failed'}[view] || '');
    const unknown = result.pago === 'Sin verificar';
    $('titulo').textContent = unknown ? 'Aún no pudimos verificar tu pago' : states[view][0];
    document.title = $('titulo').textContent + ' | Seguros Alfa';
    $('descripcion').textContent = unknown ? 'Consulta de nuevo este intento para conocer el resultado.' : states[view][1];
    $('pago').textContent = result.pago;
    $('tarjeta').textContent = result.tarjeta;
    $('detalle').textContent = result.detalle || '';
    $('producto').textContent = product || '—';
    $('fecha').textContent = info.fecha ? new Date(info.fecha * 1000).toLocaleString('es-CO', {timeZone:'America/Bogota'}) : '—';
    $('transaccion').textContent = info.transaccion || '—';
    $('valor').textContent = info.valor != null ? Number(info.valor).toLocaleString('es-CO') : '—';
    $('moneda').textContent = info.moneda || '—';
    $('aviso').hidden = view !== 'pendiente' || unknown;
    $('descargar').hidden = view !== 'aprobado';
    for (const action of ['reintentar', 'cambiar']) {
      $(action).hidden = view !== 'rechazado' || !product;
      if (product) {
        const url = new URL(summary);
        url.searchParams.set('producto', product);
        $(action).href = url;
      }
    }
    $('recibo').hidden = false;
  }
  $('descargar').onclick = () => {
    const rows = [...document.querySelectorAll('.details dl div')].map(row =>
      row.querySelector('dt').textContent + ': ' + row.querySelector('dd').textContent);
    const url = URL.createObjectURL(new Blob([['Seguros Alfa · ' + $('origen').textContent, ...rows].join('\n')], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comprobante-' + id + '.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  async function verificar(foreground = true) {
    clearTimeout(timer);
    $('actualizar').disabled = true;
    if (foreground) $('procesando').showModal();
    try {
      if (!id) throw Error('Falta la referencia del intento.');
      const url = new URL('/api/resultado?intento=' + encodeURIComponent(id), location.origin);
      if (attempt?.checkout && attempt.product) {
        url.searchParams.set('checkout', attempt.checkout);
        url.searchParams.set('producto', attempt.product);
      }
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      render(result);
      lastResult = result;
      if (attempt && terminal.includes(result.pago)) {
        sessionStorage.setItem('flujo-' + id, JSON.stringify({...attempt, finalizado:true}));
      }
      if (result.payment_method) console.log('Método de pago inscrito en Rapyd', result.payment_method);
      if ([result.pago,result.tarjeta].includes('Pendiente de confirmación') && remaining > 0) {
        remaining--;
        timer = setTimeout(() => verificar(false), 5000);
      }
    } catch (error) {
      render({...lastResult, pago:lastResult?.pago || 'Sin verificar', tarjeta:lastResult?.tarjeta || 'Sin verificar',
        detalle:error.message || 'No pudimos consultar este intento.'});
    } finally {
      $('procesando').close();
      $('actualizar').disabled = false;
    }
  }
  if (sim) {
    render({...attempt, comprobante:{valor:125000, moneda:'COP'}});
  } else {
    $('actualizar').hidden = false;
    $('actualizar').onclick = () => verificar();
    verificar();
  }

}
