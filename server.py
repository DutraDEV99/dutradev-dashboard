"""Servidor local do DutraDEV. Sem dependências externas: python server.py."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='DutraDEV — servidor de demonstração local')
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parent))
    print(f'DutraDEV disponível em http://127.0.0.1:{args.port}', flush=True)
    try:
        ThreadingHTTPServer(('127.0.0.1', args.port), handler).serve_forever()
    except KeyboardInterrupt:
        print('\nServidor encerrado.')
