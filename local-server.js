const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const HOST = '127.0.0.1';
let activePort = PORT;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && activePort < PORT + 10) {
    activePort += 1;
    server.listen(activePort, HOST);
    return;
  }
  console.error(`Cannot start server: ${err.message}`);
  process.exitCode = 1;
});

server.on('listening', () => {
  const url = `http://${HOST}:${activePort}/`;
  console.log(`Server running at ${url}`);
  console.log('Keep this window open. Press Ctrl+C to stop.');
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const browser = require('child_process').spawn('cmd.exe', ['/d', '/c', 'start', '', url], {
      windowsHide: true,
      stdio: 'ignore',
    });
    browser.on('error', () => console.log(`Open this address in your browser: ${url}`));
    browser.unref();
  }
});

server.listen(activePort, HOST);
