import {useEffect} from 'react';
export default function Banco() {
  const id = new URLSearchParams(location.search).get('intento');
  const key = 'flujo-' + id;
  const intento = JSON.parse(sessionStorage.getItem(key) || 'null');
  useEffect(() => { if (intento?.mode !== 'simulacion') location.replace('index.html'); }, []);
  function terminar(cancelado) {
    if (cancelado) sessionStorage.setItem(key, JSON.stringify({...intento, pago:'Verificación cancelada', tarjeta:intento.existente ? 'Inscrita' : 'Sin inscripción'}));
    location.assign('retorno-3ds.html?intento=' + encodeURIComponent(id));
  }
  return <>
<header><img src="assets/alfa.png" alt="Seguros Alfa" /></header><main className="flow"><article className="panel"><small>SIMULACIÓN · BANCO DE PRUEBA</small><h1>Autoriza tu compra</h1><p>Confirma la operación de Seguros Alfa por COP 125.000 con tu tarjeta de prueba.</p><button id="autorizar" onClick={() => terminar(false)}>Autorizar</button> <button id="cancelar" onClick={() => terminar(true)} className="outline">Cancelar verificación</button></article></main>
<footer>Seguros Alfa · Ambiente de pruebas<div className="restart-demo"><a className="btn outline" href="/pruebas.html">Reiniciar demo</a></div></footer>
  </>;
}
