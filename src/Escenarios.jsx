import {useState} from 'react';
export default function Escenarios() {
  const [local, setLocal] = useState(false);
  function probar(event) {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const escenario = {id: crypto.randomUUID(), mode: datos.get('modo'), tres: datos.has('tres'),
      documento: datos.get('documento'), inicial: datos.get('inicial'), pago: datos.get('pago'), tarjeta: datos.get('tarjeta')};
    sessionStorage.setItem('escenario-alfa', JSON.stringify(escenario));
    location.assign('index.html?escenario=' + escenario.id);
  }
  return <>
<header><img src="assets/alfa.png" alt="Seguros Alfa" /></header><main className="flow"><article className="panel"><h1>Simular el resultado del pago</h1><p>Tarjetas de Colombia · Importe de prueba: COP 125.000</p><form id="escenario" onSubmit={probar}><label>Número de cédula de prueba<input name="documento" required inputMode="numeric" pattern="[0-9]{1,20}" maxLength="20" defaultValue="12" /></label><label>Cómo quieres probar el pago<select name="modo" onChange={event => setLocal(event.target.value === "simulacion")}><option value="sandbox">Formulario de Rapyd Sandbox</option><option value="simulacion">Simulación local con resultados elegidos</option></select></label><p id="ayuda">{local ? 'Elige los resultados que quieres ver. Para 3DS se usará el banco ficticio del demo.' : 'Usa una cédula ficticia nueva para comenzar sin tarjetas. Repite la cédula en la misma cuenta para usar las tarjetas que hayas guardado. Puedes solicitar 3DS. El banco también puede exigirlo.'}</p><fieldset id="resultados" hidden={!local} disabled={!local}><legend>Escenario simulado</legend><label>Tarjeta al iniciar<select name="inicial"><option value="nueva">Sin tarjeta inscrita</option><option value="inscrita">Con tarjeta inscrita</option></select></label><label>Resultado del primer pago<select name="pago"><option>Aprobado</option><option>Rechazado</option><option>Pendiente</option></select></label>
<label>Resultado si autorizas guardar una tarjeta nueva<select name="tarjeta"><option>Inscrita</option><option>Sin inscripción</option><option>Pendiente de confirmación</option></select></label></fieldset>
<label className="check"><input type="checkbox" name="tres" />Verificar con el banco (3DS)</label><button>Probar escenario</button></form></article></main>
<footer>Seguros Alfa · Ambiente de pruebas</footer>
  </>;
}
