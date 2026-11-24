import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const unityRoot = path.resolve(process.env.POC_UNITY_ROOT || 'C:/Dev/playable/8-bitty');
const parentPort = Number(process.env.POC_PARENT_PORT || 43180);
const gamePort = parentPort + 1;
const mime = file => file.endsWith('.html') ? 'text/html; charset=utf-8'
  : /\.js(?:\.br)?$/.test(file) ? 'application/javascript'
  : /\.wasm(?:\.br)?$/.test(file) ? 'application/wasm'
  : file.endsWith('.png') ? 'image/png'
  : file.endsWith('.css') ? 'text/css' : 'application/octet-stream';

async function respond(request, response, parent) {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let file;
    if (parent && ['/', '/harness.html'].includes(pathname)) file = path.join(here, 'harness.html');
    if (!parent && pathname === '/poc/bloomancer.html') file = path.join(here, 'bloomancer.html');
    if (!parent && pathname === '/original/index.html') file = path.join(unityRoot, 'index.html');
    if (!parent) {
      const asset = /^\/(?:poc|original)\/(Build|TemplateData|StreamingAssets)\/(.+)$/.exec(pathname);
      if (asset) {
        const candidate = path.resolve(unityRoot, asset[1], asset[2]);
        const allowedRoot = path.resolve(unityRoot, asset[1]) + path.sep;
        if (!candidate.startsWith(allowedRoot)) { response.writeHead(403).end(); return; }
        file = candidate;
      }
    }
    if (!file || !(await stat(file)).isFile()) { response.writeHead(404).end(); return; }
    const headers = {'Content-Type': mime(file), 'Cache-Control': 'no-store'};
    if (file.endsWith('.br')) headers['Content-Encoding'] = 'br';
    response.writeHead(200, headers);
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
}

const servers = [
  http.createServer((request, response) => { void respond(request, response, true); }),
  http.createServer((request, response) => { void respond(request, response, false); }),
];
servers[0].listen(parentPort, '127.0.0.1', () => console.log('Harness: http://127.0.0.1:' + parentPort + '/?variant=poc'));
servers[1].listen(gamePort, '127.0.0.1', () => console.log('Game origin: http://127.0.0.1:' + gamePort + '; assets read from ' + unityRoot));
for (const server of servers) server.on('error', error => { console.error(error); process.exitCode = 1; for (const active of servers) active.close(); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { for (const server of servers) server.close(); });
