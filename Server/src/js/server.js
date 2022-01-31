const express = require('express');
const path = require('browserify');

const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const server = express();

const bodyParser = require('body-parser');
server.use(bodyParser.urlencoded({ extended: true }));

server.use(express.static('build'));

const url = 'mongodb://localhost';
let db;

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

const usedQrs = [];

MongoClient.connect(url, (err, client) => {
  if (err) {
    return console.log(err);
  }
  db = client.db('kino');

  server.listen(port, () => {
    console.log('listening on ' + port);

    db.collection('reservierung').find().toArray((err, result) => {
      if (err) return console.log(err);
      for (let i = 0; i < result.length; i++) {
        usedQrs.push(result[i].qr);
      }
    });
  });
});

server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/../../build/index.html'));
});

server.post('/clearDatabase', (req, res) => { // wirft error 'ns not found' wenn bereits alles geloescht ist
  db.collection('kinosaal').drop();
  db.collection('vorstellung').drop();
  db.collection('reservierung').drop();

  res.redirect(req.get('referer'));
});

// Kinosaal

server.post('/addKinosaal', (req, res) => {
  const kinosaal = {
    name: req.body.name,
    sitzreihen: req.body.sitzreihen,
    sitze: req.body.sitze
  };
  // console.log(kinosaal);

  db.collection('kinosaal').insertOne(kinosaal, (err, result) => {
    if (err) return console.log(err);
    res.redirect(req.get('referer'));
  });
});

server.get('/getKinosaal', (req, res) => {
  db.collection('kinosaal').find().toArray((err, result) => {
    if (err) return console.log(err);
    res.send(result);
  });
});

// Vorstellung

server.post('/addVorstellung', (req, res) => {
  const vorstellung = {
    date: req.body.date,
    time: req.body.time,
    saal: req.body.saal,
    name: req.body.name
  };
  vorstellung.saal = mongo.ObjectId(vorstellung.saal);

  db.collection('vorstellung').insertOne(vorstellung, (err, result) => {
    if (err) return console.log(err);
    res.redirect(req.get('referer'));
  });
});

server.get('/getVorstellung', (req, res) => {
  db.collection('vorstellung').find().toArray((err, result) => {
    if (err) return console.log(err);
    res.send(result);
  });
});

// Reservierungen

server.post('/addReservierung', (req, res) => {
  const reservierung = {
    vorstellung: req.body.vorstellung,
    sitze: req.body.sitze,
    name: req.body.name
  };
  reservierung.qr = generateQr();

  db.collection('vorstellung').findOne({ name: { $eq: reservierung.vorstellung } })
    .then((response) => {
      reservierung.vorstellung = response._id;

      db.collection('reservierung').insertOne(reservierung, (err, result) => {
        if (err) return console.log(err);
        res.redirect(req.get('origin') + '/bestaetigung.html?qr=' + reservierung.qr);
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

server.get('/getReservierung', (req, res) => {
  db.collection('reservierung').find().toArray((err, result) => {
    if (err) return console.log(err);
    res.send(result);
  });
});

function generateQr () {
  const qrLength = 32;
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
  let qrString;
  do {
    qrString = '';
    for (let i = 0; i < qrLength; i++) {
      qrString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  }
  while (usedQrs.includes(qrString));
  return qrString;
}
