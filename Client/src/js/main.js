console.log('Client-side code running');

// get the element
const element = document.getElementById('betreiber');

// always checking if the element is clicked, if so, do alert('hello')
element.addEventListener('click', () => {
  console.log('test');
});
