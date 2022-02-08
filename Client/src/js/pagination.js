function makePagination (containerName) {
  const container = document.getElementById(containerName);
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  const availableSpace = windowHeight - 260; // beruecksichtigt das letzte listItem, das bei while sichtbar gemacht wird

  container.setAttribute('style', '');

  // alle items verstecken
  container.childNodes.forEach((item) => {
    item.setAttribute('style', 'display: none;');
  });

  // items solange wieder anzeigen, bis fenstergroesse ausgeschoepft ist
  let itemsPerPage = 0;
  do {
    container.childNodes[itemsPerPage].setAttribute('style', '');
    itemsPerPage++;
  }
  while (container.clientHeight < availableSpace && itemsPerPage < container.childNodes.length);

  container.setAttribute('style', 'height: ' + container.clientHeight + 'px;');

  const totalPages = Math.ceil(container.childNodes.length / itemsPerPage);

  selectPage(containerName, 1, itemsPerPage, totalPages);
}

function selectPage (containerName, page, itemsPerPage, totalPages) {
  const container = document.getElementById(containerName);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (page > 2) {
    const first = document.createElement('li');
    first.innerHTML = '&laquo;';
    first.addEventListener('click', () => selectPage(containerName, 1, itemsPerPage, totalPages));
    pagination.appendChild(first);
  }

  for (let i = Math.max(1, page - 1); i <= Math.min(page + 1, totalPages); i++) {
    const pageSelection = document.createElement('li');
    pageSelection.innerHTML = i;
    pageSelection.addEventListener('click', () => selectPage(containerName, i, itemsPerPage, totalPages));
    if (i === page) pageSelection.classList.add('selectedPage');
    pagination.appendChild(pageSelection);
  }

  if (page < totalPages - 1) {
    const last = document.createElement('li');
    last.innerHTML = '&raquo;';
    last.addEventListener('click', () => selectPage(containerName, totalPages, itemsPerPage, totalPages));
    pagination.appendChild(last);
  }

  // alle items verstecken
  container.childNodes.forEach((item) => {
    item.setAttribute('style', 'display: none;');
  });

  const firstItemIndex = (page - 1) * itemsPerPage;
  const lastItemIndex = firstItemIndex + itemsPerPage;
  for (let i = firstItemIndex; i < Math.min(lastItemIndex, container.childNodes.length); i++) {
    container.childNodes[i].setAttribute('style', '');
  }
}

function makeVorstellungPagination () {
  makePagination('listContainer');
}

function makeSitzePagination () {
  makePagination('sitzContainer');
}

module.exports = { makeSitzePagination, makeVorstellungPagination };
