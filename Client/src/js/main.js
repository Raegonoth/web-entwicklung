console.log('Client-side code running');

const betreiberButton = document.getElementById('betreiber');

betreiberButton.addEventListener('click', () => {
  console.log('Willkommen Betreiber');
});

const kundeButton = document.getElementById('kunde');

kundeButton.addEventListener('click', () => {
  console.log('Willkommen Kunde');
});
