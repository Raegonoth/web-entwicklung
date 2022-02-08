const listmaker = require('./listmaker');

const fetch = require('cross-fetch');
const sessionstorage = require('sessionstorage');

const params = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop) });

function fetchVorstellungen () {
  fetch('/getVorstellung', { method: 'GET' })
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error('Request failed.');
    })
    .then((vorstellungen) => {
      fetch('/getKinosaal', { method: 'GET' })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error('Request failed.');
        })
        .then((kinosaele) => {
          for (let i = 0; i < vorstellungen.length; i++) {
            for (let j = 0; j < kinosaele.length; j++) {
              if (kinosaele[j]._id === vorstellungen[i].saal) {
                vorstellungen[i].saal = kinosaele[j].name;
                break;
              }
            }
          }
        })
        .then(() => {
          listmaker.makeVorstellungList(vorstellungen);
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
}

function fetchSitzplaetze () {
  const vorstellungString = sessionstorage.getItem('vorstellung');
  const temp = vorstellungString.split('.');
  const vorstellung = { _id: temp[0], date: temp[1], time: temp[2], saal: temp[3], name: temp[4] };

  fetch('/getKinosaal', { method: 'GET' })
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error('Request failed.');
    })
    .then((kinosaele) => {
      fetch('/getReservierung', { method: 'GET' })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error('Request failed.');
        })
        .then((reservierungen) => {
          listmaker.makeSitzList(vorstellung, reservierungen, kinosaele);
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
}

function fetchReservierungen () {
  fetch('/getReservierung', { method: 'GET' })
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error('Request failed.');
    })
    .then((reservierungen) => {
      const qrString = params.qr;
      for (let i = 0; i < reservierungen.length; i++) {
        if (reservierungen[i].qr === qrString) return reservierungen[i];
      }
    })
    .then((reservierung) => {
      fetch('/getVorstellung', { method: 'GET' })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error('Request failed.');
        })
        .then((vorstellungen) => {
          for (let i = 0; i < vorstellungen.length; i++) {
            if (vorstellungen[i]._id === reservierung.vorstellung) {
              return vorstellungen[i];
            }
          }
        })
        .then((vorstellung) => {
          reservierung.vorstellung = vorstellung.name;
          reservierung.date = vorstellung.date;
          reservierung.time = vorstellung.time;
          fetch('/getKinosaal', { method: 'GET' })
            .then((response) => {
              if (response.ok) return response.json();
              throw new Error('Request failed.');
            })
            .then((kinosaele) => {
              for (let i = 0; i < kinosaele.length; i++) {
                if (kinosaele[i]._id === vorstellung.saal) {
                  return kinosaele[i];
                }
              }
            })
            .then((kinosaal) => {
              reservierung.saal = kinosaal.name;
              listmaker.makeReservierungTable(reservierung);
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
}

function fetchKinosaele () {
  const saalSelect = document.getElementById('saal');
  fetch('/getKinosaal', { method: 'GET' })
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error('Request failed.');
    })
    .then((kinosaele) => {
      for (let i = 0; i < kinosaele.length; i++) {
        const option = document.createElement('option');
        option.setAttribute('value', kinosaele[i]._id);
        option.innerHTML = kinosaele[i].name;
        saalSelect.appendChild(option);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = { fetchVorstellungen, fetchSitzplaetze, fetchReservierungen, fetchKinosaele };
