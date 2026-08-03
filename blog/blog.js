const BLOG_KEY = "lucylp-community-blog-v1";
const DRAFT_KEY = "lucylp-community-blog-draft-v1";
const API_URL = "/api/blog?v=20260803-live-1";

const state = { posts: seedPosts(), reviews: [], apiOnline: false };
let selectedImage = "";

const els = {
  form: document.querySelector("#postForm"),
  title: document.querySelector("#postTitle"),
  category: document.querySelector("#postCategory"),
  body: document.querySelector("#postBody"),
  image: document.querySelector("#postImage"),
  preview: document.querySelector("#imagePreview"),
  previewImg: document.querySelector("#imagePreview img"),
  postList: document.querySelector("#postList"),
  reviewForm: document.querySelector("#reviewForm"),
  reviewName: document.querySelector("#reviewName"),
  reviewRating: document.querySelector("#reviewRating"),
  reviewText: document.querySelector("#reviewText"),
  reviewList: document.querySelector("#reviewList"),
  status: document.querySelector("#blogStatus"),
};

function seedPosts() {
  return [
    {
      id: "seed-cameras-before-smartphones",
      title: "How Cameras Worked Before Smartphones",
      category: "Book Note",
      body: "A child-friendly LucyLP note about cameras, family memory and the small ceremony of waiting for film to be developed.",
      image: "/assets/books/baby-vintage-school/baby-vintage-school-cameras-en.png",
      createdAt: "2026-08-03T00:00:00.000Z",
    },
  ];
}

function setStatus(text) {
  els.status.textContent = text;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderPosts() {
  if (!state.posts.length) {
    els.postList.innerHTML = '<article class="post-card"><h3>No approved posts yet</h3><p>Send the first LucyLP community story for approval above.</p></article>';
    return;
  }

  els.postList.innerHTML = state.posts.map((post) => `
    <article class="post-card ${post.image ? "has-image" : ""}">
      ${post.image ? `<img src="${post.image}" alt="">` : ""}
      <div>
        <p class="post-meta">${escapeHTML(post.category)} · ${formatDate(post.createdAt)}</p>
        <h3>${escapeHTML(post.title)}</h3>
        <p>${escapeHTML(post.body)}</p>
      </div>
    </article>
  `).join("");
}

function renderReviews() {
  if (!state.reviews.length) {
    els.reviewList.innerHTML = '<article class="review-card"><h3>No approved reviews yet</h3><p>Be the first to send a review for approval.</p></article>';
    return;
  }

  els.reviewList.innerHTML = state.reviews.map((review) => `
    <article class="review-card">
      <p class="review-meta">${"★".repeat(Number(review.rating) || 5)} · ${formatDate(review.createdAt)}</p>
      <h3>${escapeHTML(review.author || review.name || "LucyLP Reader")}</h3>
      <p>${escapeHTML(review.body || review.text)}</p>
    </article>
  `).join("");
}

function saveLocalBackup(payload) {
  const local = loadLocalBackup();
  if (payload.type === "post") local.pendingPosts.unshift(payload);
  if (payload.type === "review") local.pendingReviews.unshift(payload);
  localStorage.setItem(BLOG_KEY, JSON.stringify(local));
}

function loadLocalBackup() {
  try {
    return JSON.parse(localStorage.getItem(BLOG_KEY)) || { pendingPosts: [], pendingReviews: [] };
  } catch {
    return { pendingPosts: [], pendingReviews: [] };
  }
}

async function loadApprovedItems() {
  try {
    const response = await fetch(API_URL, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("Blog service unavailable");
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Blog service unavailable");
    state.posts = data.posts.length ? data.posts : seedPosts();
    state.reviews = data.reviews || [];
    state.apiOnline = true;
    setStatus("Community portal connected — submissions go to approval");
  } catch {
    state.posts = seedPosts();
    state.reviews = [];
    state.apiOnline = false;
    setStatus("Preview mode: saving a local backup until the approval database is connected");
  }
  renderPosts();
  renderReviews();
}

async function submitForApproval(payload) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Submission failed");
    return true;
  } catch {
    saveLocalBackup({ ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    return false;
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > 1800000) {
      reject(new Error("Image is too large. Use an image under 1.8MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Image could not be loaded."));
    reader.readAsDataURL(file);
  });
}

function clearEditor() {
  els.form.reset();
  selectedImage = "";
  els.preview.hidden = true;
  els.previewImg.removeAttribute("src");
}

function saveDraft() {
  const draft = {
    title: els.title.value,
    category: els.category.value,
    body: els.body.value,
    image: selectedImage,
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  setStatus("Draft saved on this device");
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft) return;
    els.title.value = draft.title || "";
    els.category.value = draft.category || "Vintage Story";
    els.body.value = draft.body || "";
    selectedImage = draft.image || "";
    if (selectedImage) {
      els.previewImg.src = selectedImage;
      els.preview.hidden = false;
    }
  } catch {
    localStorage.removeItem(DRAFT_KEY);
  }
}

els.image.addEventListener("change", async () => {
  try {
    selectedImage = await readImage(els.image.files[0]);
    if (selectedImage) {
      els.previewImg.src = selectedImage;
      els.preview.hidden = false;
      setStatus("Image ready");
    }
  } catch (error) {
    els.image.value = "";
    selectedImage = "";
    els.preview.hidden = true;
    setStatus(error.message);
  }
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    type: "post",
    title: els.title.value.trim(),
    category: els.category.value,
    body: els.body.value.trim(),
    image: selectedImage,
  };
  const sent = await submitForApproval(payload);
  localStorage.removeItem(DRAFT_KEY);
  clearEditor();
  setStatus(sent ? "Story sent for approval" : "Story saved locally; approval database is not connected yet");
  await loadApprovedItems();
});

els.reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    type: "review",
    name: els.reviewName.value.trim(),
    rating: els.reviewRating.value,
    text: els.reviewText.value.trim(),
  };
  const sent = await submitForApproval(payload);
  els.reviewForm.reset();
  setStatus(sent ? "Review sent for approval" : "Review saved locally; approval database is not connected yet");
  await loadApprovedItems();
});

document.querySelector("#saveDraft").addEventListener("click", saveDraft);
document.querySelector("#clearDraft").addEventListener("click", () => {
  localStorage.removeItem(DRAFT_KEY);
  clearEditor();
  setStatus("Editor cleared");
});

document.querySelector("#exportBlog").addEventListener("click", () => {
  const backup = { app: "LucyLP Blog Community", version: 2, exportedAt: new Date().toISOString(), ...loadLocalBackup() };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `LucyLP_Blog_Submissions_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

document.querySelector("#importBlog").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    const pendingPosts = Array.isArray(imported.pendingPosts) ? imported.pendingPosts : [];
    const pendingReviews = Array.isArray(imported.pendingReviews) ? imported.pendingReviews : [];
    localStorage.setItem(BLOG_KEY, JSON.stringify({ pendingPosts, pendingReviews }));
    setStatus("Local backup imported");
  } catch {
    setStatus("Backup file rejected");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#resetBlog").addEventListener("click", () => {
  if (!confirm("Reset local LucyLP blog backup on this browser? Approved public posts are not deleted.")) return;
  localStorage.removeItem(BLOG_KEY);
  localStorage.removeItem(DRAFT_KEY);
  clearEditor();
  setStatus("Local backup reset");
});

restoreDraft();
loadApprovedItems();