const issueSelect = document.getElementById('issue-select');
const studioForm = document.getElementById('studio-form');
const studioResult = document.getElementById('studio-result');
const studioPreview = document.getElementById('studio-preview');
const thumbnailGrid = document.getElementById('thumbnail-grid');
const pickerNote = document.getElementById('picker-note');
const promoGrid = document.getElementById('promo-grid');
const durationNote = document.getElementById('duration-note');

let issues = [];
let selectedPageSet = new Set([6, 7, 8]);

const presetPromos = [
  {
    title: 'Beatles 60s Promo',
    pages: [6, 7, 8],
    duration: 60,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-60s-p6-7-8.mp4',
  },
  {
    title: 'RL Zeppelin 60s Promo',
    pages: [9, 10],
    duration: 60,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-60s-p9-10.mp4',
  },
  {
    title: 'OBI Japan 60s Promo',
    pages: [14, 15],
    duration: 60,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-60s-p14-15.mp4',
  },
  {
    title: 'Collector Stories 60s Promo',
    pages: [16, 17, 18, 19],
    duration: 60,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-60s-p16-17-18-19.mp4',
  },
  {
    title: 'Beatles Promo',
    pages: [6, 7, 8],
    duration: 15,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-15s-p6-7-8.mp4',
  },
  {
    title: 'OBI Promo',
    pages: [14, 15],
    duration: 15,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-15s-p14-15.mp4',
  },
  {
    title: 'RL Zeppelin Promo',
    pages: [9, 10],
    duration: 15,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-15s-p9-10.mp4',
  },
  {
    title: 'Emotional Collector Promo',
    pages: [16, 17, 18, 19],
    duration: 15,
    path: '/videos/lucylp-music-press-issue-1-tiktok-promo-15s-p16-17-18-19.mp4',
  },
];

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

function renderStatus(message, downloadUrl = '', command = '') {
  studioResult.innerHTML = `
    <p>${message}</p>
    ${downloadUrl ? `<a class="download-btn" href="${downloadUrl}" download>Download MP4</a>` : ''}
    ${command ? `
      <details class="advanced-command">
        <summary>Advanced local command</summary>
        <code>${command}</code>
      </details>
    ` : ''}
  `;
}

function localCommand(issueNumber, duration, pages) {
  return `python scripts/generate_tiktok_promo.py --issue ${issueNumber} --duration ${duration} --pages ${pages.join(' ')}`;
}

function previewPromo(promo) {
  const issue = issues.find((item) => Number(item.issueNumber) === 1);
  studioPreview.src = `${promo.path}?v=${Date.now()}`;
  studioPreview.poster = issue ? issue.coverImage : '';
  studioPreview.load();
  renderStatus(
    `${promo.title} is ready: ${promo.duration}-second vertical MP4 using pages ${promo.pages.join(', ')}.`,
    promo.path,
    localCommand(1, promo.duration, promo.pages)
  );
}

function updateDurationNote() {
  const duration = selectedDuration();
  const pages = selectedPages();

  if (duration === 60) {
    durationNote.textContent = 'For 60-second promos, select 6–10 pages for better pacing.';
    if (pages.length < 6 || pages.length > 10) {
      durationNote.textContent += ` Current selection: ${pages.length} page${pages.length === 1 ? '' : 's'}.`;
    }
    return;
  }

  durationNote.textContent = duration === 30
    ? '30-second promos are the default LucyLP format.'
    : '15-second promos work best for short social teasers.';
}

function renderPresetPromos() {
  promoGrid.innerHTML = presetPromos.map((promo) => `
    <article class="promo-card">
      <h3>${promo.title}</h3>
      <p>Issue No.1 pages ${promo.pages.join(', ')} - ${promo.duration} sec</p>
      <div class="promo-actions">
        <button type="button" class="promo-btn" data-promo="${promo.title}">Preview</button>
        <a class="download-btn" href="${promo.path}" download>Download MP4</a>
      </div>
    </article>
  `).join('');

  promoGrid.querySelectorAll('[data-promo]').forEach((button) => {
    button.addEventListener('click', () => {
      const promo = presetPromos.find((item) => item.title === button.dataset.promo);
      if (promo) previewPromo(promo);
    });
  });
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
    const contentType = response.headers.get('content-type') || '';
    return response.ok && contentType.toLowerCase().includes('video');
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
  updateDurationNote();
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
  renderPresetPromos();
  await renderThumbnails(Number(issueSelect.value));
}

issueSelect.addEventListener('change', async function() {
  selectedPageSet = new Set([6, 7, 8]);
  await renderThumbnails(Number(issueSelect.value));
});

studioForm.querySelectorAll('input[name="duration"]').forEach((input) => {
  input.addEventListener('change', updateDurationNote);
});

studioForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const issueNumber = Number(issueSelect.value);
  const pages = selectedPages();
  const duration = selectedDuration();
  const issue = issues.find((item) => Number(item.issueNumber) === issueNumber);
  const videoPath = videoPathFor(issueNumber, duration, pages);
  const command = localCommand(issueNumber, duration, pages);

  if (pages.length === 0) {
    renderStatus('Select at least one page before generating a promo.');
    return;
  }

  renderStatus(`Generating ${duration}-second TikTok promo for ${issue.title} using cover image and pages ${pages.join(', ')}...`);

  const exists = await videoExists(videoPath);
  if (!exists) {
    renderStatus(
      `No ready MP4 exists yet for ${issue.title} with pages ${pages.join(', ')} at ${duration} seconds. Choose one of the ready MP4 presets, or open the advanced command below.`,
      '',
      command
    );
    return;
  }

  studioPreview.src = `${videoPath}?v=${Date.now()}`;
  studioPreview.poster = issue.coverImage;
  studioPreview.load();
  renderStatus(`Generated ${duration}-second vertical promo saved to ${videoPath}.`, videoPath, command);
});

loadIssues().catch(function(error) {
  renderStatus(`Unable to load magazine issues: ${error.message || 'unknown error'}`);
});
