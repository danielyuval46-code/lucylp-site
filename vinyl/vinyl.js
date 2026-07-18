(function () {
  const products = Array.isArray(window.LUCYLP_VINYL_PRODUCTS) ? window.LUCYLP_VINYL_PRODUCTS : [];
  const grid = document.querySelector("[data-record-grid]");
  const pagination = document.querySelector("[data-catalog-pagination]");
  const categoryLinks = document.querySelectorAll("[data-category-link]");
  const activeCategory = getActiveCategory();
  const itemsPerPage = 6;

  if (!grid) {
    return;
  }

  markActiveCategory(activeCategory);
  renderRecords(products, activeCategory, getActivePage());

  function renderRecords(items, category, page) {
    const visible = items
      .filter((item) => item.featured !== false)
      .filter((item) => !category || item.category === category)
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    const totalPages = Math.max(1, Math.ceil(visible.length / itemsPerPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const pageItems = visible.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    grid.replaceChildren(...pageItems.map(createRecordCard));
    renderPagination(totalPages, safePage, category);
  }

  function createRecordCard(product) {
    const card = document.createElement("article");
    card.className = "record-card";

    const media = document.createElement("div");
    media.className = "record-card__media record-card__media--placeholder";
    media.textContent = product.imageLabel || "PRODUCT ARTWORK PENDING";

    const body = document.createElement("div");
    body.className = "record-card__body";

    const artist = document.createElement("h3");
    artist.textContent = product.artist;

    const album = document.createElement("p");
    album.className = "record-card__album";
    album.textContent = product.album;

    const price = document.createElement("p");
    price.className = "record-card__price";
    price.textContent = product.price || "TBA";

    const action = document.createElement("a");
    action.className = "record-card__button";
    action.href = "#";
    action.setAttribute("aria-disabled", "true");
    action.textContent = "View the Record";

    const save = document.createElement("button");
    save.className = "record-card__save";
    save.type = "button";
    save.setAttribute("aria-label", "Save record placeholder");
    save.textContent = "♡";

    const actions = document.createElement("div");
    actions.className = "record-card__actions";
    actions.append(action, save);

    body.append(artist, album, price, actions);
    card.append(media, body);
    return card;
  }

  function getActiveCategory() {
    const category = new URLSearchParams(window.location.search).get("category");
    const validCategories = ["pink-floyd", "the-beatles", "japanese-pressings", "colored-vinyl", "new-finds"];
    return validCategories.includes(category) ? category : "";
  }

  function getActivePage() {
    const page = Number(new URLSearchParams(window.location.search).get("page") || 1);
    return Number.isInteger(page) && page > 0 ? page : 1;
  }

  function renderPagination(totalPages, currentPage, category) {
    if (!pagination) {
      return;
    }

    if (totalPages <= 1) {
      pagination.replaceChildren();
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;
    const links = [];

    for (let index = 1; index <= totalPages; index += 1) {
      const link = document.createElement("a");
      link.href = buildPageUrl(index, category);
      link.textContent = String(index);
      link.setAttribute("aria-label", `Go to Vinyl Finds page ${index}`);

      if (index === currentPage) {
        link.setAttribute("aria-current", "page");
      }

      links.push(link);
    }

    pagination.replaceChildren(...links);
  }

  function buildPageUrl(page, category) {
    const params = new URLSearchParams();

    if (category) {
      params.set("category", category);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const query = params.toString();
    return query ? `/vinyl/?${query}` : "/vinyl/";
  }

  function markActiveCategory(category) {
    if (!category) {
      return;
    }

    categoryLinks.forEach((link) => {
      if (link.dataset.categoryLink === category) {
        link.setAttribute("aria-current", "true");
      }
    });
  }
})();
