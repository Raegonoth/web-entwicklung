const express = require('express');
const path = require('browserify');

const MongoClient = require('mongodb').MongoClient;
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

MongoClient.connect(url, (err, client) => {
  if (err) {
    return console.log(err);
  }
  db = client.db('kino');

  server.listen(port, () => {
    console.log('listening on ' + port);
  });
});

server.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/../../build/index.html'));
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
    if (err) {
      return console.log(err);
    }
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
  // console.log(vorstellung);

  db.collection('kinosaal').findOne({ name: { $eq: vorstellung.saal } })
    .then((response) => {
      // console.log(response);
      vorstellung.saal = response._id;

      // console.log(vorstellung);
      db.collection('vorstellung').insertOne(vorstellung, (err, result) => {
        if (err) {
          return console.log(err);
        }
        res.redirect(req.get('referer'));
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

server.get('/getVorstellung', (req, res) => {
  db.collection('vorstellung').find().toArray((err, result) => {
    if (err) return console.log(err);

    const promises = [];
    for (let i = 0; i < result.length; i++) {
      promises.push(db.collection('kinosaal').findOne({ _id: { $eq: result[i].saal } })
        .then((response) => {
          // console.log(response);
          result[i].saal = response.name;

          // console.log(result[i]);
        })
        .catch((error) => {
          console.log(error);
        })
      );
    }
    Promise.allSettled(promises).then(() => {
      res.send(result);
    });
  });
});

// Reservierungen

server.post('/addReservierung', (req, res) => {
  const reservierung = {
    vorstellung: req.body.vorstellung,
    sitze: req.body.sitze,
    name: req.body.name
  };

  console.log(reservierung);

  db.collection('vorstellung').findOne({ name: { $eq: reservierung.vorstellung } })
    .then((response) => {
      console.log(response);
      reservierung.vorstellung = response._id;

      console.log(reservierung);

      db.collection('reservierung').insertOne(reservierung, (err, result) => {
        if (err) {
          return console.log(err);
        }
        res.redirect(req.get('referer'));
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

server.get('/getReservierung', (req, res) => {
  db.collection('reservierung').find().toArray((err, result) => {
    if (err) return console.log(err);

    const promises = [];
    for (let i = 0; i < result.length; i++) {
      promises.push(db.collection('vorstellung').findOne({ _id: { $eq: result[i].vorstellung } })
        .then((response) => {
          if (response !== null) {
            console.log(response);
            result[i].vorstellung = response.vorstellung.name;
          }
          console.log(result[i]);
        })
        .catch((error) => {
          console.log(error);
        })
      );
    }
    Promise.allSettled(promises).then(() => {
      res.send(result);
    });
  });
});
