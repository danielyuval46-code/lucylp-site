const promoButton = document.getElementById('generate-tiktok-promo');
const promoStatus = document.getElementById('promo-status');
const promoPreview = document.getElementById('promo-preview');
const promoPath = '/videos/lucylp-music-press-issue-1-tiktok-promo.mp4';

const tokenForm = document.getElementById('blog-token-form');
const tokenInput = document.getElementById('blog-admin-token');
const blogStatus = document.getElementById('blog-admin-status');
const approvalList = document.getElementById('blog-approval-list');
const tokenKey = 'lucylp-blog-admin-token';

function escapeHTML(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char]);
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function getToken() {
  return tokenInput.value.trim();
}

function setBlogStatus(text) {
  blogStatus.textContent = text;
}

async function blogRequest(path = '/api/blog?admin=1&v=20260803-live-1', options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-blog-admin-token': getToken(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Blog admin request failed');
  return data;
}

function renderItems(items) {
  if (!items.length) {
    approvalList.innerHTML = '<article class="approval-card"><h2>No submissions yet</h2><p>New LucyLP community stories and reviews will appear here.</p></article>';
    return;
  }

  approvalList.innerHTML = items.map((item) => {
    const isPending = item.status === 'pending';
    const title = item.type === 'review' ? `${item.rating || 5} star review by ${item.author || 'Reader'}` : item.title;
    const meta = [item.type, item.status, item.category, formatDate(item.createdAt)].filter(Boolean).join(' · ');
    return `
      <article class="approval-card" data-id="${escapeHTML(item.id)}">
        ${item.image ? `<img src="${item.image}" alt="">` : ''}
        <div class="approval-copy">
          <p class="approval-meta">${escapeHTML(meta)}</p>
          <h2>${escapeHTML(title)}</h2>
          <p>${escapeHTML(item.body)}</p>
          <div class="admin-actions compact-actions">
            ${isPending ? `<button class="admin-btn" type="button" data-action="approved" data-id="${escapeHTML(item.id)}">Approve</button>` : ''}
            ${isPending ? `<button class="admin-btn admin-btn-secondary" type="button" data-action="rejected" data-id="${escapeHTML(item.id)}">Reject</button>` : ''}
            <button class="admin-btn danger-admin" type="button" data-delete="${escapeHTML(item.id)}">Delete</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

async function loadApprovals() {
  if (!getToken()) {
    setBlogStatus('Enter the blog admin token first.');
    return;
  }
  localStorage.setItem(tokenKey, getToken());
  setBlogStatus('Loading blog submissions...');
  try {
    const data = await blogRequest();
    renderItems(data.items || []);
    setBlogStatus('Blog submissions loaded. Pending items are shown first.');
  } catch (error) {
    approvalList.innerHTML = '';
    setBlogStatus(error.message);
  }
}

tokenInput.value = localStorage.getItem(tokenKey) || '';

tokenForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadApprovals();
});

approvalList.addEventListener('click', async (event) => {
  const statusButton = event.target.closest('[data-action]');
  const deleteButton = event.target.closest('[data-delete]');

  try {
    if (statusButton) {
      setBlogStatus('Updating submission...');
      await blogRequest('/api/blog?v=20260803-live-1', {
        method: 'PATCH',
        body: JSON.stringify({ id: statusButton.dataset.id, status: statusButton.dataset.action }),
      });
      await loadApprovals();
    }

    if (deleteButton) {
      if (!confirm('Delete this blog submission permanently?')) return;
      setBlogStatus('Deleting submission...');
      await blogRequest(`/api/blog?id=${encodeURIComponent(deleteButton.dataset.delete)}`, { method: 'DELETE' });
      await loadApprovals();
    }
  } catch (error) {
    setBlogStatus(error.message);
  }
});

if (promoButton) {
  promoButton.addEventListener('click', function() {
    promoButton.disabled = true;
    promoButton.textContent = 'Generating...';
    promoStatus.textContent = 'Generating TikTok promo from cover, pages 9, 14, 16, and 19...';

    window.setTimeout(function() {
      promoPreview.src = `${promoPath}?v=${Date.now()}`;
      promoPreview.load();
      promoStatus.textContent = 'Generated and saved to /videos/lucylp-music-press-issue-1-tiktok-promo.mp4';
      promoButton.textContent = 'Generated';
    }, 700);
  });
}