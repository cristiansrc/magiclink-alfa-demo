import {useState} from 'react';

export default function Escenarios() {
  const [local, setLocal] = useState(false);
  const [resultado, setResultado] = useState('Aprobado');
  const [tres, setTres] = useState(false);
  const importe = resultado === 'Pendiente' ? 2020 : tres ? 1000 : 500;
  const tarjeta = resultado === 'Rechazado' ? '4111 1111 1111 1105' : '4111 1111 1111 1111';

  function probar(event) {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const escenario = {
      id: crypto.randomUUID(), mode: datos.get('modo'), tres,
      documento: datos.get('documento'), inicial: datos.get('inicial'),
      pago: datos.get('pago'), tarjeta: datos.get('tarjeta'),
      resultadoSandbox: resultado, importe: local ? 125000 : importe
    };
    sessionStorage.setItem('escenario-alfa', JSON.stringify(escenario));
    location.assign('index.html?escenario=' + escenario.id);
  }

  return <>
    <header><img src="assets/alfa.png" alt="Seguros Alfa" /></header>
    <main className="flow"><article className="panel">
      <h1>Simular el resultado del pago</h1>
      <p>Tarjetas de Colombia · Importe de prueba: COP { (local ? 125000 : importe).toLocaleString('es-CO') }</p>
      <form id="escenario" onSubmit={probar}>
        <label>Número de cédula de prueba<input name="documento" required inputMode="numeric" pattern="[0-9]{1,20}" maxLength="20" defaultValue="12" /></label>
        <label>Cómo quieres probar el pago<select name="modo" onChange={event => setLocal(event.target.value === 'simulacion')}><option value="sandbox">Formulario de Rapyd Sandbox</option><option value="simulacion">Simulación local con resultados elegidos</option></select></label>
        {local ? <>
          <p>Elige los resultados que quieres ver. Para 3DS se usará el banco ficticio del demo.</p>
          <fieldset><legend>Escenario simulado</legend>
            <label>Tarjeta al iniciar<select name="inicial"><option value="nueva">Sin tarjeta inscrita</option><option value="inscrita">Con tarjeta inscrita</option></select></label>
            <label>Resultado del primer pago<select name="pago"><option>Aprobado</option><option>Rechazado</option><option>Pendiente</option></select></label>
            <label>Resultado si autorizas guardar una tarjeta nueva<select name="tarjeta"><option>Inscrita</option><option>Sin inscripción</option><option>Pendiente de confirmación</option></select></label>
          </fieldset>
        </> : <>
          <label>Resultado que deseas probar<select value={resultado} onChange={event => setResultado(event.target.value)}><option>Aprobado</option><option>Rechazado</option><option>Pendiente</option></select></label>
          <p>En el formulario de Rapyd usa la tarjeta de prueba <strong>{tarjeta}</strong>, una fecha futura y cualquier CVV de tres dígitos.</p>
          <p>El importe y la tarjeta preparan el escenario. Rapyd determina el resultado y puede solicitar 3DS aunque no lo selecciones. El importe de COP 2.020 permite probar una liquidación pendiente.</p>
        </>}
        <label className="check"><input type="checkbox" name="tres" checked={tres} onChange={event => setTres(event.target.checked)} />Verificar con el banco (3DS)</label>
        <button>Probar escenario</button>
      </form>
      <section className="test-cards" aria-labelledby="test-cards-title">
        <h2 id="test-cards-title">Tarjetas de prueba de Rapyd Sandbox</h2>
        <p>Usa una fecha de vencimiento futura y cualquier CVV de tres dígitos.</p>
        <div className="test-cards-scroll">
          <table>
            <thead><tr><th scope="col">Tarjeta</th><th scope="col">Resultado esperado</th></tr></thead>
            <tbody>
              <tr><td>4111 1111 1111 1111</td><td>Pago aprobado</td></tr>
              <tr><td>4111 1111 1111 1105</td><td>Rechazado por el emisor</td></tr>
              <tr><td>4111 1111 1111 1143</td><td>Rechazado por tarjeta reportada como robada</td></tr>
              <tr><td>4111 1111 1111 1151</td><td>Rechazado por fondos insuficientes</td></tr>
            </tbody>
          </table>
        </div>
        <p>Para probar una liquidación pendiente, selecciona «Pendiente» y usa la tarjeta de pago aprobado. El demo enviará COP 2.020 a Rapyd.</p>
        <p>Al finalizar un pago aprobado con la tarjeta inscrita, abre la consola del navegador para ver el objeto «Método de pago inscrito en Rapyd». El campo <code>id</code> contiene el identificador de la tarjeta, que comienza por <code>card_</code> y se utiliza para los pagos posteriores.</p>
      </section>
    </article></main>
    <footer>Seguros Alfa · Ambiente de pruebas</footer>
  </>;
}
