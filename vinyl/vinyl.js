(function () {
  const products = Array.isArray(window.LUCYLP_VINYL_PRODUCTS) ? window.LUCYLP_VINYL_PRODUCTS : [];
  const grid = document.querySelector("[data-record-grid]");
  const pagination = document.querySelector("[data-catalog-pagination]");
  const categoryLinks = document.querySelectorAll("[data-category-link]");
  const menuButton = document.querySelector("[data-vinyl-menu]");
  const nav = document.querySelector("#vinyl-nav");
  const activeCategory = getActiveCategory();
  const itemsPerPage = 6;

  if (!grid) {
    return;
  }

  markActiveCategory(activeCategory);
  wireMobileMenu();
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
    media.className = "record-card__media";

    if (product.image) {
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.title || `${product.artist} - ${product.album}`;
      image.width = 225;
      image.height = 225;
      image.loading = "lazy";
      image.decoding = "async";
      image.fetchPriority = "low";
      media.append(image);
    } else {
      media.classList.add("record-card__media--placeholder");
      media.textContent = product.imageLabel || "RECORD IMAGE PENDING";
    }

    const body = document.createElement("div");
    body.className = "record-card__body";

    const artist = document.createElement("h3");
    artist.textContent = product.artist;

    const album = document.createElement("p");
    album.className = "record-card__album";
    album.textContent = product.album;

    const edition = document.createElement("p");
    edition.className = "record-card__edition";
    edition.textContent = product.edition || product.category || "";

    const price = document.createElement("p");
    price.className = "record-card__price";
    price.textContent = formatPrice(product.price, product.currency);

    const isAvailable = product.status === "active" && product.buyUrl;
    const action = document.createElement(isAvailable ? "a" : "span");
    action.className = "record-card__button";
    action.textContent = "VIEW THE RECORD";

    if (isAvailable) {
      action.href = product.buyUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer sponsored";
    } else {
      action.setAttribute("aria-disabled", "true");
    }

    const save = document.createElement("button");
    save.className = "record-card__save";
    save.type = "button";
    save.setAttribute("aria-label", `Save ${product.artist} ${product.album}`);
    save.textContent = "♡";

    const actions = document.createElement("div");
    actions.className = "record-card__actions";
    actions.append(action, save);

    body.append(artist, album, edition, price, actions);
    card.append(media, body);
    return card;
  }

  function formatPrice(price, currency) {
    if (!price || price === "TBA") {
      return "TBA";
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
      return String(price);
    }

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD"
      }).format(numericPrice);
    } catch (_error) {
      return `${currency || "USD"} ${numericPrice.toFixed(2)}`;
    }
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

  function wireMobileMenu() {
    if (!menuButton || !nav) {
      return;
    }

    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
})();
