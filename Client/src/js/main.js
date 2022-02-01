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

  makeSitzePagination();
  window.addEventListener('resize', makeSitzePagination);
}

function makeSitzePagination () {
  const sitzContainer = document.getElementById('sitzContainer');
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  const availableSpace = windowHeight - 260; // beruecksichtigt das letzte listItem, das bei while sichtbar gemacht wird

  sitzContainer.setAttribute('style', '');

  // alle vorstellungen verstecken
  sitzContainer.childNodes.forEach((child) => {
    child.setAttribute('style', 'display: none;');
  });

  // vorstellungen solange wieder anzeigen, bis fenstergroesse ausgeschoepft ist
  let itemsPerPage = 0;
  do {
    sitzContainer.childNodes[itemsPerPage].setAttribute('style', '');
    itemsPerPage++;
  }
  while (sitzContainer.clientHeight < availableSpace && itemsPerPage < sitzContainer.childNodes.length);

  sitzContainer.setAttribute('style', 'height: ' + sitzContainer.clientHeight + 'px;');

  const totalPages = Math.ceil(sitzContainer.childNodes.length / itemsPerPage);
  selectSitzePage(1, itemsPerPage, totalPages);
}

function selectSitzePage (page, itemsPerPage, totalPages) {
  const sitzContainer = document.getElementById('sitzContainer');
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (page > 2) {
    const first = document.createElement('li');
    first.innerHTML = '&laquo;';
    first.addEventListener('click', () => selectSitzePage(1, itemsPerPage, totalPages));
    pagination.appendChild(first);
  }

  for (let i = Math.max(1, page - 1); i <= Math.min(page + 1, totalPages); i++) {
    const pageSelection = document.createElement('li');
    pageSelection.innerHTML = i;
    pageSelection.addEventListener('click', () => selectSitzePage(i, itemsPerPage, totalPages));
    if (i === page) pageSelection.classList.add('selectedPage');
    pagination.appendChild(pageSelection);
  }

  if (page < totalPages - 1) {
    const last = document.createElement('li');
    last.innerHTML = '&raquo;';
    last.addEventListener('click', () => selectSitzePage(totalPages, itemsPerPage, totalPages));
    pagination.appendChild(last);
  }

  // alle vorstellungen verstecken
  sitzContainer.childNodes.forEach((child) => {
    child.setAttribute('style', 'display: none;');
  });

  const firstItemIndex = (page - 1) * itemsPerPage;
  const lastItemIndex = firstItemIndex + itemsPerPage;
  for (let i = firstItemIndex; i < Math.min(lastItemIndex, sitzContainer.childNodes.length); i++) {
    sitzContainer.childNodes[i].setAttribute('style', '');
  }
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
  makeVorstellungPagination();
  window.addEventListener('resize', makeVorstellungPagination);
}

function makeVorstellungPagination () {
  const listContainer = document.getElementById('listContainer');
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  const availableSpace = windowHeight - 250; // beruecksichtigt das letzte listItem, das bei while sichtbar gemacht wird

  listContainer.setAttribute('style', '');

  // alle vorstellungen verstecken
  listContainer.childNodes.forEach((child) => {
    child.setAttribute('style', 'display: none;');
  });

  // vorstellungen solange wieder anzeigen, bis fenstergroesse ausgeschoepft ist
  let itemsPerPage = 0;
  do {
    listContainer.childNodes[itemsPerPage].setAttribute('style', '');
    itemsPerPage++;
  }
  while (listContainer.clientHeight < availableSpace && itemsPerPage < listContainer.childNodes.length);

  listContainer.setAttribute('style', 'height: ' + listContainer.clientHeight + 'px;');

  const totalPages = Math.ceil(listContainer.childNodes.length / itemsPerPage);
  selectVorstellungPage(1, itemsPerPage, totalPages);
}

function selectVorstellungPage (page, itemsPerPage, totalPages) {
  const listContainer = document.getElementById('listContainer');
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (page > 2) {
    const first = document.createElement('li');
    first.innerHTML = '&laquo;';
    first.addEventListener('click', () => selectVorstellungPage(1, itemsPerPage, totalPages));
    pagination.appendChild(first);
  }

  for (let i = Math.max(1, page - 1); i <= Math.min(page + 1, totalPages); i++) {
    const pageSelection = document.createElement('li');
    pageSelection.innerHTML = i;
    pageSelection.addEventListener('click', () => selectVorstellungPage(i, itemsPerPage, totalPages));
    if (i === page) pageSelection.classList.add('selectedPage');
    pagination.appendChild(pageSelection);
  }

  if (page < totalPages - 1) {
    const last = document.createElement('li');
    last.innerHTML = '&raquo;';
    last.addEventListener('click', () => selectVorstellungPage(totalPages, itemsPerPage, totalPages));
    pagination.appendChild(last);
  }

  // alle vorstellungen verstecken
  listContainer.childNodes.forEach((child) => {
    child.setAttribute('style', 'display: none;');
  });

  const firstItemIndex = (page - 1) * itemsPerPage;
  const lastItemIndex = firstItemIndex + itemsPerPage;
  for (let i = firstItemIndex; i < Math.min(lastItemIndex, listContainer.childNodes.length); i++) {
    listContainer.childNodes[i].setAttribute('style', '');
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
