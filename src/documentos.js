export function iniciar() {
  const picker = document.querySelector('.doc-picker');
  const summary = picker.querySelector('summary');
  const options = Array.from(picker.querySelectorAll('button'));

  function closePicker() {
    picker.open = false;
    summary.focus();
  }

  picker.addEventListener('click', event => {
    const choice = event.target.closest('button[data-code]');
    if (!choice) return;
    for (const option of options) {
      option.setAttribute('aria-pressed', String(option === choice));
    }
    summary.querySelector('span').textContent = choice.dataset.code;
    closePicker();
  });

  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape' && picker.open) {
      event.preventDefault();
      closePicker();
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    picker.open = true;
    const index = options.indexOf(document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = index < 0 ? options.find(o => o.getAttribute('aria-pressed') === 'true')
      : options[(index + step + options.length) % options.length];
    next.focus();
  });

  document.addEventListener('pointerdown', event => {
    if (!picker.contains(event.target)) picker.open = false;
  });
  picker.addEventListener('focusout', event => {
    if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false;
  });

}
