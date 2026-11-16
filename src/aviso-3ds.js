// Un diálogo modal nativo deja inactivos los controles de la pantalla de pago.
export function avisarRedireccion(destino) {
  if (document.getElementById('aviso-banco')) return;
  const aviso = document.createElement('dialog');
  aviso.id = 'aviso-banco';
  aviso.setAttribute('aria-labelledby', 'titulo-aviso');
  aviso.innerHTML = '<h2 id="titulo-aviso">Tu banco necesita verificar tu identidad</h2><p>En cinco segundos te llevaremos a tu banco para completar una validación adicional. Después volverás a Seguros Alfa para consultar el resultado.</p>';
  aviso.addEventListener('cancel', evento => evento.preventDefault());
  document.body.append(aviso);
  aviso.showModal();
  window.setTimeout(() => location.assign(destino), 5000);
}
