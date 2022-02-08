const fetcher = require('./fetcher');

window.addEventListener('load', onLoad);

function onLoad () {
  if (document.title === 'Kunde') {
    console.log(window.location.href);
    fetcher.fetchVorstellungen();
  } else if (document.title === 'Vorstellung') {
    console.log(window.location.href);
    fetcher.fetchSitzplaetze();
  } else if (document.title === 'Bestätigung') {
    console.log(window.location.href);
    fetcher.fetchReservierungen();
  } else if (document.title === 'Betreiber') {
    console.log(window.location.href);
    fetcher.fetchKinosaele();
  }
}
