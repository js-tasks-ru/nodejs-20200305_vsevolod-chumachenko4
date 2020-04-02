const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const LimitSizeStream = require('./LimitSizeStream');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  if (pathname.includes('/')) {
    res.statusCode = 400;
    res.end('Вложенность папок недопустима');
    return;
  }

  const filepath = path.join(__dirname, 'files', pathname);

  if (req.method === 'POST') {
    if (req.headers['content-length'] && req.headers['content-length'] > 1e6) {
      res.statusCode = 413;
      res.end('payload too large');
      return;
    }

    const writeFile = fs.createWriteStream(filepath, {flags: 'wx'});
    const limitSizeStream = new LimitSizeStream({limit: 1e6});

    writeFile.on('error', (err) => {
      if (err.code === 'EEXIST') {
        res.statusCode = 409;
        res.statusMessage = 'Conflict';
        res.end('Файл уже существует', 'utf-8');
        return;
      }

      console.log(err);
      res.statusCode = 500;
      res.end('Server error');
    });

    req.on('aborted', () => {
      fs.unlink(filepath, () => {
      });
    });

    limitSizeStream.on('error', (err) => {
      if (err.code === 'LIMIT_EXCEEDED') {
        res.statusCode = 413;
        res.end('file is too big');

        fs.unlink(filepath, () => {});
        return;
      }

      console.log(err);
      res.statusCode = 500;
      res.end('Server Error');
    });

    req.pipe(limitSizeStream).pipe(writeFile);

    writeFile.on('close', () => {
      res.statusCode = 201;
      res.statusMessage = 'Created';
      res.end('File is uploaded');
    });
  } else {
    res.statusCode = 501;
    res.end('Not implemented');
  }
});

module.exports = server;
