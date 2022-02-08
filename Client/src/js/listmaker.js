const pagination = require('./pagination');
const fetcher = require('./fetcher');

const qrCode = require('qrcode');
const sessionstorage = require('sessionstorage');

function makeSitzList (vorstellung, reservierungen, kinosaele) {
  let reservierteSitze = [];
  for (let i = 0; i < reservierungen.length; i++) {
    if (reservierungen[i].vorstellung === vorstellung._id) {
      reservierteSitze.push(reservierungen[i].sitze);
    }
  }
  reservierteSitze = reservierteSitze.flat();

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

  const sitzContainer = document.getElementById('sitzContainer');

  const vorstellungItem = document.createElement('input');
  vorstellungItem.setAttribute('type', 'hidden');
  vorstellungItem.setAttribute('name', 'vorstellung');
  vorstellungItem.setAttribute('value', vorstellung.name);

  sitzContainer.parentNode.appendChild(vorstellungItem);

  for (let i = 0; i < restSitze.length; i++) {
    const listItem = document.createElement('div');

    const input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('value', restSitze[i]);
    input.setAttribute('id', restSitze[i]);
    input.setAttribute('name', 'sitze');

    const label = document.createElement('label');
    label.setAttribute('for', restSitze[i]);

    const reiheSitze = restSitze[i].split('.');
    label.innerHTML = 'Reihe ' + reiheSitze[0] + ', Sitz ' + reiheSitze[1] + '<br>';

    listItem.appendChild(input);
    listItem.appendChild(label);
    sitzContainer.appendChild(listItem);
  }

  pagination.makeSitzePagination();
  window.addEventListener('resize', pagination.makeSitzePagination);
}

function makeReservierungTable (reservierung) {
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

function makeVorstellungList (data) {
  const listContainer = document.getElementById('listContainer');

  data.sort((a, b) => {
    if (a.date < b.date) return -1;
    else if (a.date > b.date) return 1;
    else {
      if (a.time < b.time) return -1;
      else if (a.time > b.time) return 1;
      else return 0;
    }
  });

  for (let i = 0; i < data.length; i++) {
    const listItem = document.createElement('fieldset');
    listItem.setAttribute('id', data[i]._id);
    listItem.setAttribute('class', 'listItem');
    listItem.addEventListener('click', function () {
      window.location.href = 'vorstellung.html';
      sessionstorage.setItem('vorstellung', data[i]._id + '.' + data[i].date + '.' + data[i].time + '.' + data[i].saal + '.' + data[i].name);
      fetcher.fetchSitzplaetze(data[i]);
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
  pagination.makeVorstellungPagination();
  window.addEventListener('resize', pagination.makeVorstellungPagination);
}

module.exports = { makeVorstellungList, makeSitzList, makeReservierungTable };
