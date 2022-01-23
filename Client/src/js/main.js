const fetch = require('cross-fetch');
const sessionstorage = require('sessionstorage');

window.addEventListener('load', onLoad);

function onLoad () {
  if (document.title === 'Kunde') {
    fetchVorstellungen();
  } else if (document.title === 'Vorstellung') {
    // console.log(sessionstorage.getItem('vorstellung'));
    fetchSitzplaetze(sessionstorage.getItem('vorstellung'));
  }
}

function fetchVorstellungen () {
  fetch('/getVorstellung', { method: 'GET' })
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error('Request failed.');
    })
    .then((data) => {
      makeVorstellungList(data);
    })
    .catch((error) => {
      console.log(error);
    });
}

function fetchSitzplaetze (vorstellungString) {
  const temp = vorstellungString.split('.');
  const vorstellung = { _id: temp[0], date: temp[1], time: temp[2], saal: temp[3], name: temp[4] };
  // console.log(vorstellung);
  fetch('/getKinosaal', { method: 'GET' })
    .then((response) => {
      if (response.ok) return response.json();
      throw new Error('Request failed.');
    })
    .then((kinosäle) => {
      fetch('/getReservierung', { method: 'GET' })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error('Request failed.');
        })
        .then((reservierungen) => {
          makeSitzList(vorstellung, reservierungen, kinosäle);
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
}

function makeSitzList (vorstellung, reservierungen, kinosäle) {
  let reservierteSitze = [];
  for (let i = 0; i < reservierungen.length; i++) {
    if (reservierungen[i].vorstellung === vorstellung.name) {
      reservierteSitze.push(reservierungen[i].sitze);
    }
  }
  reservierteSitze = reservierteSitze.flat();
  // console.log(reservierteSitze);

  let kinosaal;
  for (let i = 0; i < kinosäle.length; i++) {
    if (kinosäle[i].name === vorstellung.saal) {
      kinosaal = kinosäle[i];
    }
  }

  // console.log(kinosaal);

  const sitzePerKinosaal = [];
  for (let i = 1; i <= kinosaal.sitzreihen; i++) {
    for (let j = 1; j <= kinosaal.sitze; j++) {
      sitzePerKinosaal.push(i + '.' + j);
    }
  }

  // console.log(sitzePerKinosaal);

  const restSitze = sitzePerKinosaal;
  for (let i = 0; i < reservierteSitze.length; i++) {
    const index = restSitze.indexOf(reservierteSitze[i]);
    if (index > -1) {
      restSitze.splice(index, 1);
    }
  }

  // console.log(restSitze);

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
  sitzContainer.appendChild(button);
}

function makeVorstellungList (data) {
  // console.log(data);
  const listContainer = document.getElementById('listContainer');

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
    const itemName = document.createElement('p');
    itemName.innerHTML = 'Film: ' + data[i].name;
    const itemRoom = document.createElement('p');
    itemRoom.innerHTML = 'Saal: ' + data[i].saal;
    const itemDate = document.createElement('p');
    itemDate.innerHTML = 'Vorstellungszeit: Am ' + data[i].date + ' um ' + data[i].time;
    listItem.append(legend, itemName, itemRoom, itemDate);

    listContainer.appendChild(listItem);
  }
}
