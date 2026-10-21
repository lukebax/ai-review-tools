#!/usr/bin/env python3
"""Serve the local site, presentation and map on this computer; never publishes anything."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent

class Preview(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def allowed_path(self):
        if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}':
            self.send_error(403)
            return False
        path = unquote(urlsplit(self.path).path)
        if any(part.startswith('.') for part in Path(path).parts if part not in ('/', '')):
            self.send_error(404)
            return False
        resolved = (ROOT / path.lstrip('/')).resolve()
        if not resolved.is_relative_to(ROOT):
            self.send_error(404)
            return False
        return True

    def do_GET(self):
        if self.allowed_path():
            super().do_GET()

    def do_HEAD(self):
        if self.allowed_path():
            super().do_HEAD()

    def list_directory(self, path):
        self.send_error(404)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    with ThreadingHTTPServer(('127.0.0.1', 0), Preview) as server:
        base = f'http://127.0.0.1:{server.server_port}'
        print(f'Presentation: {base}/presentation/', flush=True)
        print(f'Map: {base}/map/', flush=True)
        print(f'Home: {base}/', flush=True)
        print('Local preview only. Press Ctrl+C to stop.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
