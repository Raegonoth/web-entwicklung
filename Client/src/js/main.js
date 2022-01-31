const fetch = require('cross-fetch');
const sessionstorage = require('sessionstorage');
const params = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop) });

window.addEventListener('load', onLoad);

function onLoad () {
  if (document.title === 'Kunde') {
    fetchVorstellungen();
  } else if (document.title === 'Vorstellung') {
    fetchSitzplaetze(sessionstorage.getItem('vorstellung'));
  } else if (document.title === 'Bestätigung') {
    fetchReservierungen();
  } else if (document.title === 'Betreiber') {
    fetchKinosaele();
  }
}

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
          makeVorstellungList(vorstellungen);
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
}

function fetchSitzplaetze (vorstellungString) {
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
          makeSitzList(vorstellung, reservierungen, kinosaele);
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
              makeReservierungTable(reservierung);
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

function makeSitzList (vorstellung, reservierungen, kinosaele) {
  let reservierteSitze = [];
  for (let i = 0; i < reservierungen.length; i++) {
    if (reservierungen[i].vorstellung === vorstellung._id) {
      reservierteSitze.push(reservierungen[i].sitze);
    }
  }
  reservierteSitze = reservierteSitze.flat();
  console.log(reservierteSitze);
  console.log(vorstellung);

  let kinosaal;
  for (let i = 0; i < kinosaele.length; i++) {
    if (kinosaele[i].name === vorstellung.saal) {
      kinosaal = kinosaele[i];
      break;
    }
  }

  const sitzePerKinosaal = [];
  for (let i = 1; i <= kinosaal.sitzreihen; i++) {
    for (let j = 1; j <= kinosaal.sitze; j++) {
      sitzePerKinosaal.push(i + '.' + j);
    }
  }

  const restSitze = sitzePerKinosaal;
  for (let i = 0; i < reservierteSitze.length; i++) {
    const index = restSitze.indexOf(reservierteSitze[i]);
    if (index > -1) {
      restSitze.splice(index, 1);
    }
  }

  console.log(restSitze);

  const sitzContainer = document.getElementById('sitzContainer');

  const vorstellungItem = document.createElement('input');
  vorstellungItem.setAttribute('type', 'hidden');
  vorstellungItem.setAttribute('name', 'vorstellung');
  vorstellungItem.setAttribute('value', vorstellung.name);

  sitzContainer.appendChild(vorstellungItem);

  for (let i = 0; i < restSitze.length; i++) {
    const listItem = document.createElement('input');
    listItem.setAttribute('type', 'checkbox');
    listItem.setAttribute('value', restSitze[i]);
    listItem.setAttribute('id', restSitze[i]);
    listItem.setAttribute('name', 'sitze');

    sitzContainer.appendChild(listItem);

    const label = document.createElement('label');
    label.setAttribute('for', restSitze[i]);

    const reiheSitze = restSitze[i].split('.');
    label.innerHTML = 'Reihe ' + reiheSitze[0] + ', Sitz ' + reiheSitze[1] + '<br>';

    sitzContainer.appendChild(label);
  }

  const button = document.createElement('button');
  button.setAttribute('type', 'submit');
  button.innerHTML = 'Reservieren';
  sitzContainer.appendChild(document.createElement('br'));
  sitzContainer.appendChild(button);
}

function makeVorstellungList (data) {
  const listContainer = document.getElementById('listContainer');
  // const itemHeight = 160;

  for (let i = 0; i < data.length; i++) {
    const listItem = document.createElement('fieldset');
    listItem.setAttribute('id', data[i]._id);
    listItem.setAttribute('class', 'listItem');
    listItem.addEventListener('click', function () {
      window.location.href = 'vorstellung.html';
      sessionstorage.setItem('vorstellung', data[i]._id + '.' + data[i].date + '.' + data[i].time + '.' + data[i].saal + '.' + data[i].name);
      fetchSitzplaetze(data[i]);
    });
    const legend = document.createElement('legend');
    legend.innerHTML = 'Vorstellung';
    const itemTable = document.createElement('table');
    const itemTableRow1 = document.createElement('tr');
    const itemTableRow2 = document.createElement('tr');
    const itemTableRow3 = document.createElement('tr');

    const itemNameLabel = document.createElement('td');
    itemNameLabel.innerHTML = 'Vorstellung:';
    const itemName = document.createElement('td');
    itemName.innerHTML = data[i].name;
    itemTableRow1.append(itemNameLabel, itemName);

    const itemSaalLabel = document.createElement('td');
    itemSaalLabel.innerHTML = 'Saal:';
    const itemSaal = document.createElement('td');
    itemSaal.innerHTML = data[i].saal;
    itemTableRow2.append(itemSaalLabel, itemSaal);

    const itemDateLabel = document.createElement('td');
    itemDateLabel.innerHTML = 'Vorstellungszeit:';
    const itemDate = document.createElement('td');
    itemDate.innerHTML = data[i].date + ' um ' + data[i].time;
    itemTableRow3.append(itemDateLabel, itemDate);

    itemTable.append(itemTableRow1, itemTableRow2, itemTableRow3);
    listItem.append(legend, itemTable);
    listContainer.appendChild(listItem);
  }
}

function makeReservierungTable (reservierung) {
  const qrCode = require('qrcode');
  const documentElements = {
    canvas: document.getElementById('canvas'),
    name: document.getElementById('name'),
    vorstellung: document.getElementById('vorstellung'),
    date: document.getElementById('date'),
    saal: document.getElementById('saal'),
    sitze: document.getElementById('sitze')
  };
  const url = window.location.origin + window.location.pathname + '?qr=' + reservierung.qr;

  qrCode.toCanvas(documentElements.canvas, url, { errorCorrectionLevel: 'H' }, (error) => { if (error) console.error(error); });
  documentElements.name.innerHTML = reservierung.name;
  documentElements.vorstellung.innerHTML = reservierung.vorstellung;
  documentElements.date.innerHTML = reservierung.date + ' um ' + reservierung.time;
  documentElements.saal.innerHTML = reservierung.saal;
  documentElements.sitze.innerHTML = reservierung.sitze.toString().replaceAll(',', ', ');
}
