const issueSelect = document.getElementById('issue-select');
const studioForm = document.getElementById('studio-form');
const studioResult = document.getElementById('studio-result');
const studioPreview = document.getElementById('studio-preview');
const thumbnailGrid = document.getElementById('thumbnail-grid');
const pickerNote = document.getElementById('picker-note');

let issues = [];
let selectedPageSet = new Set([9, 14, 16, 19]);

function pagePathFor(issueNumber, pageNumber) {
  return `/music-press/issue-${issueNumber}/page-${String(pageNumber).padStart(3, '0')}.png`;
}

function videoPathFor(issueNumber, duration, pages) {
  const pageSlug = pages.join('-');
  const detailedPath = `/videos/lucylp-music-press-issue-${issueNumber}-tiktok-promo-${duration}s-p${pageSlug}.mp4`;

  if (issueNumber === 1 && duration === 15 && pageSlug === '9-14-16-19') {
    return '/videos/lucylp-music-press-issue-1-tiktok-promo.mp4';
  }

  return detailedPath;
}

function renderStatus(message, downloadUrl = '') {
  studioResult.innerHTML = `
    <p>${message}</p>
    ${downloadUrl ? `<a class="download-btn" href="${downloadUrl}" download>Download MP4</a>` : ''}
  `;
}

function selectedPages() {
  return Array.from(selectedPageSet).sort((a, b) => a - b);
}

function selectedDuration() {
  return Number(studioForm.querySelector('input[name="duration"]:checked').value);
}

async function videoExists(path) {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function imageExists(path) {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function renderIssueOptions() {
  issueSelect.innerHTML = issues.map((issue) => `
    <option value="${issue.issueNumber}">Issue No.${issue.issueNumber} - ${issue.title}</option>
  `).join('');
}

function updatePickerNote() {
  const pages = selectedPages();
  pickerNote.textContent = pages.length > 0
    ? `Selected pages: ${pages.join(', ')}`
    : 'Select at least one issue page to include after the cover.';
}

function togglePage(pageNumber) {
  if (selectedPageSet.has(pageNumber)) {
    selectedPageSet.delete(pageNumber);
  } else {
    selectedPageSet.add(pageNumber);
  }

  thumbnailGrid.querySelectorAll('.page-thumb').forEach((button) => {
    const selected = selectedPageSet.has(Number(button.dataset.page));
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  updatePickerNote();
}

async function detectPageCount(issueNumber) {
  const issue = issues.find((item) => Number(item.issueNumber) === issueNumber);
  if (issue && Number(issue.pageCount) > 0) {
    return Number(issue.pageCount);
  }

  let count = 0;

  for (let page = 1; page <= 80; page += 1) {
    if (!(await imageExists(pagePathFor(issueNumber, page)))) break;
    count = page;
  }

  return count;
}

async function renderThumbnails(issueNumber) {
  thumbnailGrid.innerHTML = '<p class="picker-note">Loading page thumbnails...</p>';
  const pageCount = await detectPageCount(issueNumber);

  if (pageCount === 0) {
    thumbnailGrid.innerHTML = '<p class="picker-note">No page thumbnails found for this issue yet.</p>';
    return;
  }

  thumbnailGrid.innerHTML = '';
  for (let page = 1; page <= pageCount; page += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-thumb';
    button.dataset.page = String(page);
    button.setAttribute('aria-pressed', selectedPageSet.has(page) ? 'true' : 'false');
    button.innerHTML = `
      <img src="${pagePathFor(issueNumber, page)}" alt="Issue page ${page}" loading="lazy">
      <span>Page ${page}</span>
    `;
    button.addEventListener('click', () => togglePage(page));
    thumbnailGrid.appendChild(button);
  }

  updatePickerNote();
}

async function loadIssues() {
  const response = await fetch('/data/magazine-issues.json', {
    headers: { Accept: 'application/json' },
    cache: 'no-cache',
  });
  issues = await response.json();
  renderIssueOptions();
  await renderThumbnails(Number(issueSelect.value));
}

issueSelect.addEventListener('change', async function() {
  selectedPageSet = new Set([9, 14, 16, 19]);
  await renderThumbnails(Number(issueSelect.value));
});

studioForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const issueNumber = Number(issueSelect.value);
  const pages = selectedPages();
  const duration = selectedDuration();
  const issue = issues.find((item) => Number(item.issueNumber) === issueNumber);
  const videoPath = videoPathFor(issueNumber, duration, pages);

  if (pages.length === 0) {
    renderStatus('Select at least one page before generating a promo.');
    return;
  }

  renderStatus(`Generating ${duration}-second TikTok promo for ${issue.title} using cover image and pages ${pages.join(', ')}...`);

  const exists = await videoExists(videoPath);
  if (!exists) {
    renderStatus(
      `Promo source prepared for ${issue.title}. Generate and save it locally with: python scripts/generate_tiktok_promo.py --issue ${issueNumber} --duration ${duration} --pages ${pages.join(' ')}`
    );
    return;
  }

  studioPreview.src = `${videoPath}?v=${Date.now()}`;
  studioPreview.poster = issue.coverImage;
  studioPreview.load();
  renderStatus(`Generated ${duration}-second vertical promo saved to ${videoPath}`, videoPath);
});

loadIssues().catch(function(error) {
  renderStatus(`Unable to load magazine issues: ${error.message || 'unknown error'}`);
});
