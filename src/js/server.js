console.log('Server-side code running');

const express = require('express');
const path = require('browserify');

const server = express();

// serve files from the public directory
server.use(express.static('build'));

let port = 8080;

for (const argument of process.argv) {
  const maybePort = parseInt(argument.replace(/[^0-9]/g, ''));
  if (!isNaN(maybePort)) {
    port = maybePort;
  }
}
// start the express web server listening on 8080
server.listen(port, () => {
  console.log('listening on ' + port);
});

// serve the homepage
server.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/../../build/index.html'));
});
