"""Exercise the actual Nginx config without Docker; optional browser smoke test."""
import argparse
import base64
import http.client
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent


def run(browser=False):
    binary = os.environ.get('NGINX_BIN') or shutil.which('nginx')
    if not binary:
        raise SystemExit('Install nginx or set NGINX_BIN. No container runtime is required.')
    with tempfile.TemporaryDirectory(prefix='ncaa-edge-') as directory:
        tmp = Path(directory)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
        password = 'local-smoke-test-only'
        hashed = subprocess.check_output(['openssl', 'passwd', '-apr1', '-stdin'], input=password.encode()).decode().strip()
        auth = tmp / 'users.htpasswd'
        auth.write_text(f'test:{hashed}\n')
        config = (ROOT / 'nginx.conf').read_text().replace('listen 80;', f'listen 127.0.0.1:{port};')
        config = config.replace('/usr/share/nginx/html', str(ROOT / 'dist'))
        config = config.replace('/usr/share/nginx/private-edge', str(ROOT / 'dist-edge'))
        config = config.replace('/etc/nginx/edge-auth/users.htpasswd', str(auth))
        config = f'user root root;\npid {tmp}/nginx.pid;\nerror_log {tmp}/error.log;\nmaster_process off;\ndaemon off;\nevents {{}}\nhttp {{\nclient_body_temp_path {tmp}/body;\nproxy_temp_path {tmp}/proxy;\nfastcgi_temp_path {tmp}/fastcgi;\nuwsgi_temp_path {tmp}/uwsgi;\nscgi_temp_path {tmp}/scgi;\naccess_log off;\ntypes {{text/html html; application/javascript js; text/css css; image/svg+xml svg;}}\n{config}\n}}'
        conf = tmp / 'nginx.conf'; conf.write_text(config)
        proc = subprocess.Popen([binary, '-p', str(tmp) + '/', '-c', str(conf)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        def request(path, credentials=None):
            conn = http.client.HTTPConnection('127.0.0.1', port, timeout=10)
            headers = {} if credentials is None else {'Authorization': 'Basic ' + base64.b64encode(credentials.encode()).decode()}
            conn.request('GET', path, headers=headers)
            res = conn.getresponse(); body = res.read(); headers = dict(res.getheaders()); conn.close()
            return res.status, body, headers
        try:
            for _ in range(100):
                if proc.poll() is not None: raise RuntimeError(proc.communicate()[1].decode())
                try:
                    if request('/')[0] == 200: break
                except OSError: time.sleep(.05)
            else: raise RuntimeError('Nginx did not become ready')
            html = (ROOT / 'dist-edge/edge/index.html').read_text()
            assets = re.findall(r'(?:src|href)="(/edge/[^\"]+)"', html)
            for path in ['/edge/', '/edge/edge/index.html', *assets]:
                assert request(path)[0] == 401, (path, 'unauthenticated access')
                assert request(path, 'test:wrong')[0] == 401
                status, body, headers = request(path, f'test:{password}')
                assert status == 200 and body, (path, status)
                assert headers.get('Cache-Control') == 'no-store'
                assert headers.get('X-Robots-Tag') == 'noindex, nofollow'
            for path in assets:
                assert request(path.replace('/edge/', '/'))[0] == 404, 'Private asset leaked via public root'
            assert request('/')[0] == 200
            auth.rename(tmp / 'saved.htpasswd')
            assert request('/edge/', f'test:{password}')[0] in (401, 403, 500)
            assert request('/')[0] == 200
            (tmp / 'saved.htpasswd').rename(auth)
            print('PASS: public app accessible; private HTML/JS/CSS require auth; wrong/missing credentials fail closed; no public asset alias.', flush=True)
            if browser:
                env = dict(os.environ, EDGE_TEST_URL=f'http://127.0.0.1:{port}', EDGE_TEST_PASSWORD=password)
                subprocess.run(['node', 'tests/browser.mjs'], cwd=ROOT, env=env, check=True)
        finally:
            proc.terminate()
            try: proc.wait(timeout=5)
            except subprocess.TimeoutExpired: proc.kill(); proc.wait()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--browser', action='store_true')
    run(parser.parse_args().browser)
