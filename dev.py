"""Ejecuta la compilación estática y la API bajo el mismo origen local."""
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
from server.gateway import Handler, cargar_cuenta_personal


class Demo(Handler, SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path.startswith('/api/'):
            return Handler.do_GET(self)
        if self.path == '/':
            self.path = '/pruebas.html'
        SimpleHTTPRequestHandler.do_GET(self)


if __name__ == '__main__':
    cargar_cuenta_personal()
    print('Abre http://127.0.0.1:8788/pruebas.html', flush=True)
    HTTPServer(('127.0.0.1', 8788), partial(Demo, directory=str(Path(__file__).parent / 'dist'))).serve_forever()
