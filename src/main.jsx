import {createRoot} from 'react-dom/client';
import Consulta from './Consulta.jsx';
import Escenarios from './Escenarios.jsx';
import Banco from './Banco.jsx';
import Resultado from './Resultado.jsx';

const screens = {'/': Escenarios, '/pruebas.html': Escenarios, '/index.html': Consulta,
  '/banco.html': Banco, '/retorno.html': Resultado, '/retorno-3ds.html': Resultado};
if (location.pathname === '/pago.html') {
  const query = new URLSearchParams(location.search);
  query.set('resumen','1');
  if (!query.has('producto')) query.set('producto','VID-7812-334');
  location.replace('index.html?' + query);
} else {
  const Screen = screens[location.pathname] || Consulta;
  createRoot(document.getElementById('root')).render(<Screen />);
}
