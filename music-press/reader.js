const issue = {
  number: 1,
  title: 'LucyLP Music Press',
  pageCount: 22,
  path: './issue-1/page-',
  pdf: '/public/music-press/pdf/lucylp-music-press-issue-1-june-2026.pdf'
};

const state = {
  page: 1,
  zoom: 1,
  turning: false
};

const pageImage = document.getElementById('magazine-page');
const turningPage = document.getElementById('turning-page');
const book = document.getElementById('magazine-book');
const stage = document.getElementById('magazine-stage');
const pageCount = document.getElementById('page-count');
const zoomCount = document.getElementById('zoom-count');
const thumbStrip = document.getElementById('thumb-strip');
const readerShell = document.getElementById('reader-shell');

function pageSrc(page) {
  return `${issue.path}${String(page).padStart(3, '0')}.png`;
}

function preload(page) {
  if (page < 1 || page > issue.pageCount) return;
  const image = new Image();
  image.src = pageSrc(page);
}

function renderThumbnails() {
  thumbStrip.innerHTML = '';

  for (let page = 1; page <= issue.pageCount; page += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb-button';
    button.setAttribute('aria-label', `Open page ${page}`);
    button.dataset.page = String(page);
    button.innerHTML = `<img loading="lazy" src="${pageSrc(page)}" alt="Page ${page} thumbnail">`;
    button.addEventListener('click', () => goToPage(page));
    thumbStrip.appendChild(button);
  }
}

function updateControls() {
  pageCount.textContent = `Page ${state.page} / ${issue.pageCount}`;
  zoomCount.textContent = `${Math.round(state.zoom * 100)}%`;
  book.style.transform = `scale(${state.zoom})`;
  book.style.marginBottom = `${Math.max(0, (state.zoom - 1) * 760)}px`;

  document.getElementById('prev-page').disabled = state.page === 1;
  document.getElementById('next-page').disabled = state.page === issue.pageCount;

  thumbStrip.querySelectorAll('.thumb-button').forEach((button) => {
    button.setAttribute('aria-current', button.dataset.page === String(state.page) ? 'true' : 'false');
  });

  const activeThumb = thumbStrip.querySelector('[aria-current="true"]');
  if (activeThumb) {
    activeThumb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  preload(state.page + 1);
  preload(state.page - 1);
}

function renderPage(page, direction = 'next') {
  if (state.turning) return;
  if (page < 1 || page > issue.pageCount || page === state.page) return;

  state.turning = true;
  const previousSrc = pageImage.src;
  turningPage.src = previousSrc;
  book.classList.add(direction === 'prev' ? 'is-turning-prev' : 'is-turning-next');

  window.setTimeout(() => {
    state.page = page;
    pageImage.src = pageSrc(page);
    pageImage.alt = `${issue.title} page ${page}`;
    updateControls();
  }, 210);

  window.setTimeout(() => {
    book.classList.remove('is-turning-prev', 'is-turning-next');
    state.turning = false;
  }, 540);
}

function goToPage(page) {
  const direction = page < state.page ? 'prev' : 'next';
  renderPage(page, direction);
}

function nextPage() {
  goToPage(state.page + 1);
}

function previousPage() {
  goToPage(state.page - 1);
}

function setZoom(value) {
  state.zoom = Math.min(1.75, Math.max(0.7, value));
  updateControls();
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await readerShell.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

document.getElementById('prev-page').addEventListener('click', previousPage);
document.getElementById('next-page').addEventListener('click', nextPage);
document.getElementById('zoom-in').addEventListener('click', () => setZoom(state.zoom + 0.1));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(state.zoom - 0.1));
document.getElementById('fullscreen-toggle').addEventListener('click', toggleFullscreen);

function handleReaderKeydown(event) {
  const tagName = document.activeElement ? document.activeElement.tagName : '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return;

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    nextPage();
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    previousPage();
  }

  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    setZoom(state.zoom + 0.1);
  }

  if (event.key === '-') {
    event.preventDefault();
    setZoom(state.zoom - 0.1);
  }
}

stage.addEventListener('keydown', handleReaderKeydown);
document.addEventListener('keydown', (event) => {
  if (!readerShell.contains(document.activeElement)) handleReaderKeydown(event);
});

renderThumbnails();
updateControls();
preload(2);
