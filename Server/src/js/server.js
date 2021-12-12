console.log('Server-side code running');

const express = require('express');
const path = require('browserify');

const server = express();

// serve files from the public directory
server.use(express.static('build'));

let port = 8080;

for (let i = 0; i < process.argv.length; i++) {
  const argument = process.argv[i];
  if (argument.includes('port') && i === process.argv.length - 1) {
    const maybePort = parseInt(argument.replace(/[^0-9]/g, ''));
    if (!isNaN(maybePort)) {
      port = maybePort;
    }
  } else if (argument.includes('port')) {
    const nextArgument = process.argv[i + 1];
    const maybePort = parseInt(nextArgument);
    if (!isNaN(maybePort)) {
      port = maybePort;
    }
  }
}

server.listen(port, () => {
  console.log('listening on ' + port);
});

server.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/../../build/index.html'));
});
