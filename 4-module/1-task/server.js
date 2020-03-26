const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  if (pathname.includes('/')) {
    res.statusCode = 400;
    res.end('Вложенность папок недопустима');
    return;
  }

  const filepath = path.join(__dirname, 'files', pathname);

  function giveFile() {
    const readFileStream = fs.createReadStream(filepath);

    readFileStream.on('error', (error) => {
      if (error.code === 'ENOENT') {
        res.statusCode = 404;
        res.statusMessage = 'Not Found';
        res.end('Файл не найден');
        return;
      }
      res.statusCode = 500;
      res.statusMessage = 'Server Error';
      res.end('Серверная ошибка');
    });
    readFileStream.pipe(res);
  }

  if (req.method === 'GET') {
    giveFile();
  } else {
    res.statusCode = 501;
    res.end('Not implemented');
  }
});

module.exports = server;
