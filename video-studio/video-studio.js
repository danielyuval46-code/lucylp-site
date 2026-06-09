const issueSelect = document.getElementById('issue-select');
const studioForm = document.getElementById('studio-form');
const studioResult = document.getElementById('studio-result');
const studioPreview = document.getElementById('studio-preview');

let issues = [];

function videoPathFor(issueNumber) {
  return `/videos/lucylp-music-press-issue-${issueNumber}-tiktok-promo.mp4`;
}

function renderStatus(message, downloadUrl = '') {
  studioResult.innerHTML = `
    <p>${message}</p>
    ${downloadUrl ? `<a class="download-btn" href="${downloadUrl}" download>Download MP4</a>` : ''}
  `;
}

function selectedPages() {
  return Array.from(studioForm.querySelectorAll('input[name="page"]')).map((input) => Number(input.value));
}

async function videoExists(path) {
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

async function loadIssues() {
  const response = await fetch('/data/magazine-issues.json', {
    headers: { Accept: 'application/json' },
  });
  issues = await response.json();
  renderIssueOptions();
}

studioForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  const issueNumber = Number(issueSelect.value);
  const pages = selectedPages();
  const issue = issues.find((item) => Number(item.issueNumber) === issueNumber);
  const videoPath = videoPathFor(issueNumber);

  renderStatus(`Generating TikTok promo for ${issue.title} using cover image and pages ${pages.join(', ')}...`);

  const exists = await videoExists(videoPath);
  if (!exists) {
    renderStatus(
      `Promo source prepared for ${issue.title}. Generate and save it locally with: python scripts/generate_tiktok_promo.py --issue ${issueNumber} --pages ${pages.join(' ')}`
    );
    return;
  }

  studioPreview.src = `${videoPath}?v=${Date.now()}`;
  studioPreview.poster = issue.coverImage;
  studioPreview.load();
  renderStatus(`Generated 15-second vertical promo saved to ${videoPath}`, videoPath);
});

loadIssues().catch(function(error) {
  renderStatus(`Unable to load magazine issues: ${error.message || 'unknown error'}`);
});
