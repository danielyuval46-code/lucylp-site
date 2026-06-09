const archiveState = {
  issues: [],
};

const archiveGrid = document.getElementById('issue-grid');
const featuredCover = document.querySelector('[data-featured-cover]');
const featuredIssue = document.querySelector('[data-featured-issue]');
const featuredPublished = document.querySelector('[data-featured-published]');
const featuredDescription = document.querySelector('[data-featured-description]');
const featuredPdf = document.querySelector('[data-featured-pdf]');
const featuredPdfSize = document.querySelector('[data-featured-pdf-size]');
const featuredRead = document.querySelector('[data-featured-read]');

function formatReleaseMonth(releaseDate) {
  const date = new Date(`${releaseDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return releaseDate;

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';

  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character]));
}

async function getPdfSize(pdfFile) {
  try {
    const response = await fetch(pdfFile, { method: 'HEAD' });
    const contentLength = Number(response.headers.get('content-length'));
    return formatFileSize(contentLength);
  } catch (error) {
    return '';
  }
}

function renderFeaturedIssue(issue) {
  const releaseMonth = formatReleaseMonth(issue.releaseDate);

  featuredCover.src = issue.coverImage;
  featuredCover.alt = `${issue.title} cover`;
  featuredIssue.textContent = `Issue No.${issue.issueNumber} - ${releaseMonth}`;
  featuredPublished.textContent = `Published ${releaseMonth}`;
  featuredDescription.textContent = issue.description;
  featuredPdf.href = issue.pdfFile;
  featuredRead.href = issue.issueNumber === 1 ? '#reader' : issue.pdfFile;
  featuredRead.textContent = 'Read Online';
}

function renderIssueCard(issue) {
  const releaseMonth = formatReleaseMonth(issue.releaseDate);
  const title = escapeHtml(issue.title);
  const description = escapeHtml(issue.description);
  const coverImage = escapeHtml(issue.coverImage);
  const pdfFile = escapeHtml(issue.pdfFile);
  const readerLink = issue.issueNumber === 1
    ? '<a class="archive-btn primary" href="#reader">Read Online</a>'
    : '';

  return `
    <article class="issue-card">
      <a href="${pdfFile}" class="issue-cover-link" download>
        <img src="${coverImage}" alt="${title} cover" loading="lazy">
      </a>
      <div class="issue-card-copy">
        <p class="issue-number">Issue No.${escapeHtml(issue.issueNumber)}</p>
        <h3>${title}</h3>
        <p class="issue-date">Published ${releaseMonth}</p>
        <p>${description}</p>
        <div class="issue-actions">
          ${readerLink}
          <a class="archive-btn" href="${pdfFile}" download>Download PDF</a>
        </div>
      </div>
    </article>
  `;
}

function renderArchive(issues) {
  archiveGrid.innerHTML = issues.map(renderIssueCard).join('');
}

async function loadMagazineIssues() {
  try {
    const response = await fetch('/data/magazine-issues.json', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Magazine archive failed with ${response.status}`);
    }

    const issues = await response.json();
    archiveState.issues = Array.isArray(issues)
      ? issues.slice().sort((a, b) => Number(b.issueNumber) - Number(a.issueNumber))
      : [];

    if (archiveState.issues.length === 0) {
      archiveGrid.innerHTML = '<p class="archive-loading">No magazine issues available yet.</p>';
      return;
    }

    const featured = archiveState.issues[0];
    renderFeaturedIssue(featured);
    renderArchive(archiveState.issues);

    const pdfSize = await getPdfSize(featured.pdfFile);
    if (pdfSize) {
      featuredPdfSize.textContent = pdfSize;
    }
  } catch (error) {
    archiveGrid.innerHTML = '<p class="archive-loading">Magazine archive is unavailable right now.</p>';
    console.log('LucyLP magazine archive unavailable', {
      message: error.message || 'Unable to load magazine archive',
    });
  }
}

loadMagazineIssues();
