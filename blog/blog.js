const BLOG_KEY = "lucylp-community-blog-v1";
const DRAFT_KEY = "lucylp-community-blog-draft-v1";

const state = loadState();
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

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(BLOG_KEY)) || { posts: seedPosts(), reviews: [] };
  } catch {
    return { posts: seedPosts(), reviews: [] };
  }
}

function seedPosts() {
  return [
    {
      id: crypto.randomUUID(),
      title: "How Cameras Worked Before Smartphones",
      category: "Book Note",
      body: "A child-friendly LucyLP note about cameras, family memory and the small ceremony of waiting for film to be developed.",
      image: "/assets/books/baby-vintage-school/baby-vintage-school-cameras-en.png",
      createdAt: "2026-08-03T00:00:00.000Z",
    },
  ];
}

function saveState() {
  localStorage.setItem(BLOG_KEY, JSON.stringify(state));
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
    els.postList.innerHTML = '<article class="post-card"><h3>No posts yet</h3><p>Write the first LucyLP community story above.</p></article>';
    return;
  }

  els.postList.innerHTML = state.posts.map((post) => `
    <article class="post-card ${post.image ? "has-image" : ""}">
      ${post.image ? `<img src="${post.image}" alt="">` : ""}
      <div>
        <p class="post-meta">${escapeHTML(post.category)} · ${formatDate(post.createdAt)}</p>
        <h3>${escapeHTML(post.title)}</h3>
        <p>${escapeHTML(post.body)}</p>
        <button type="button" data-delete-post="${post.id}">Delete Local Post</button>
      </div>
    </article>
  `).join("");
}

function renderReviews() {
  if (!state.reviews.length) {
    els.reviewList.innerHTML = '<article class="review-card"><h3>No reviews yet</h3><p>Be the first to write a review for the LucyLP blog.</p></article>';
    return;
  }

  els.reviewList.innerHTML = state.reviews.map((review) => `
    <article class="review-card">
      <p class="review-meta">${"★".repeat(Number(review.rating))} · ${formatDate(review.createdAt)}</p>
      <h3>${escapeHTML(review.name)}</h3>
      <p>${escapeHTML(review.text)}</p>
      <button type="button" data-delete-review="${review.id}">Delete Local Review</button>
    </article>
  `).join("");
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
      reject(new Error("Image is too large. Use an image under 1.8MB for local browser storage."));
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
  setStatus("Draft saved");
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

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  state.posts.unshift({
    id: crypto.randomUUID(),
    title: els.title.value.trim(),
    category: els.category.value,
    body: els.body.value.trim(),
    image: selectedImage,
    createdAt: new Date().toISOString(),
  });
  saveState();
  localStorage.removeItem(DRAFT_KEY);
  clearEditor();
  renderPosts();
  setStatus("Post published locally");
});

els.reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.reviews.unshift({
    id: crypto.randomUUID(),
    name: els.reviewName.value.trim(),
    rating: els.reviewRating.value,
    text: els.reviewText.value.trim(),
    createdAt: new Date().toISOString(),
  });
  saveState();
  els.reviewForm.reset();
  renderReviews();
  setStatus("Review added locally");
});

document.querySelector("#saveDraft").addEventListener("click", saveDraft);
document.querySelector("#clearDraft").addEventListener("click", () => {
  localStorage.removeItem(DRAFT_KEY);
  clearEditor();
  setStatus("Editor cleared");
});

document.querySelector("#exportBlog").addEventListener("click", () => {
  const backup = { app: "LucyLP Blog Community", version: 1, exportedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `LucyLP_Blog_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

document.querySelector("#importBlog").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.posts) || !Array.isArray(imported.reviews)) throw new Error("Invalid backup");
    state.posts = imported.posts;
    state.reviews = imported.reviews;
    saveState();
    renderPosts();
    renderReviews();
    setStatus("Backup imported");
  } catch {
    setStatus("Backup file rejected");
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#resetBlog").addEventListener("click", () => {
  if (!confirm("Reset local LucyLP blog posts and reviews on this browser?")) return;
  localStorage.removeItem(BLOG_KEY);
  localStorage.removeItem(DRAFT_KEY);
  state.posts = seedPosts();
  state.reviews = [];
  clearEditor();
  saveState();
  renderPosts();
  renderReviews();
  setStatus("Local blog reset");
});

document.addEventListener("click", (event) => {
  const postButton = event.target.closest("[data-delete-post]");
  const reviewButton = event.target.closest("[data-delete-review]");
  if (postButton) {
    state.posts = state.posts.filter((post) => post.id !== postButton.dataset.deletePost);
    saveState();
    renderPosts();
    setStatus("Post deleted locally");
  }
  if (reviewButton) {
    state.reviews = state.reviews.filter((review) => review.id !== reviewButton.dataset.deleteReview);
    saveState();
    renderReviews();
    setStatus("Review deleted locally");
  }
});

restoreDraft();
saveState();
renderPosts();
renderReviews();
