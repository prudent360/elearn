import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const files = ['index.html', 'styles.css', 'data.js', 'app.js', 'catalog.js'];
const types = ['text/html', 'text/css', 'text/javascript', 'text/javascript', 'text/javascript'];
const assets = Object.fromEntries(files.map((file, i) => ['/' + file, { body: readFileSync(file, 'utf8'), type: types[i] }]));
mkdirSync('dist/server', { recursive: true });
writeFileSync('dist/server/index.js', `const assets = ${JSON.stringify(assets)};\nexport default {async fetch(request) { const path = new URL(request.url).pathname; const asset = assets[path === '/' ? '/index.html' : path]; if (!asset) return new Response('Not found', {status:404}); return new Response(request.method === 'HEAD' ? null : asset.body, {headers:{'Content-Type':asset.type + '; charset=utf-8','X-Content-Type-Options':'nosniff'}}); }};\n`);
console.log('Built static LMS preview.');
