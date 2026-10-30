const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5700;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  let safePath = path.normalize(decodeURIComponent(req.url.split('?')[0]));
  if (safePath === '/' || safePath === '\\' || safePath === '') {
    safePath = '/index.html';
  }

  let filePath = path.join(DIST_DIR, safePath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || stats.isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const isHtml = ext === '.html';
      const cacheControl = isHtml
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*',
      });

      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(content);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log(` CREDiT Digital Twin - Frontend Web Server Running`);
  console.log(` Listening on: http://0.0.0.0:${PORT}`);
  console.log(` Serving directory: ${DIST_DIR}`);
  console.log('================================================================');
});

