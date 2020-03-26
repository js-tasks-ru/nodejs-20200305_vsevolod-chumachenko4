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

  function writeFile() {
    fs.open(filepath, 'wx', (err) => {
      if (err) {
        if (err.code === 'EEXIST') {
          res.statusCode = 409;
          res.statusMessage = 'Conflict';
          return res.end('Файл уже существует', 'utf-8');
        }

        res.statusCode = 500;
        res.statusMessage = 'ServerError';
        return res.error('Упс! Произошла ошибка', 'utf8');
      }

      const limitSizeStream = new LimitSizeStream({limit: 1024*1024});
      const writeFile = fs.createWriteStream(filepath);

      writeFile.on('finish', () => {
        res.statusCode = 201;
        res.statusMessage = 'Created';
        res.end('Тело загружено', 'utf8');
      });

      try {
        req.on('abort', (err) => {
          fs.unlink(filepath, (err) => {
            if (!err) return;

            throw err;
          });
        });

        limitSizeStream.on('error', (err) => {
          if (err.code === 'LIMIT_EXCEEDED') {
            res.statusCode = 413;
            res.statusMessage = 'Payload Too Large';
            res.end('Размер тела слишком большой', 'utf8');
            return;
          }

          throw err;
        });

        req.pipe(limitSizeStream).pipe(writeFile);
      } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'ServerError';
        return res.error('Упс! Произошла ошибка', 'utf8');
      }
    });
  }

  if (req.method === 'POST') {
    writeFile();
  } else {
    res.statusCode = 501;
    res.end('Not implemented');
  }
});

module.exports = server;
