(function () {
  const products = Array.isArray(window.LUCYLP_MANGA_PRODUCTS) ? window.LUCYLP_MANGA_PRODUCTS : [];
  const grid = document.querySelector("[data-find-grid]");
  const pagination = document.querySelector("[data-catalog-pagination]");
  const categoryLinks = document.querySelectorAll("[data-category-link]");
  const menuButton = document.querySelector("[data-manga-menu]");
  const nav = document.querySelector("#manga-nav");
  const activeCategory = getActiveCategory();
  const itemsPerPage = 6;

  if (!grid) {
    return;
  }

  markActiveCategory(activeCategory);
  wireMobileMenu();
  renderFinds(products, activeCategory, getActivePage());

  function renderFinds(items, category, page) {
    const visible = items
      .filter((item) => item.featured !== false)
      .filter((item) => !category || item.category === category)
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    const totalPages = Math.max(1, Math.ceil(visible.length / itemsPerPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const pageItems = visible.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    grid.replaceChildren(...pageItems.map(createFindCard));
    renderPagination(totalPages, safePage, category);
  }

  function createFindCard(product) {
    const card = document.createElement("article");
    card.className = "find-card";

    const media = document.createElement("div");
    media.className = "find-card__media";

    if (product.image) {
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.title || "Manga and Japan find";
      image.loading = "lazy";
      media.append(image);
    } else {
      media.classList.add("find-card__media--placeholder");
      media.textContent = product.imageLabel || "PRODUCT ARTWORK PENDING";
    }

    const body = document.createElement("div");
    body.className = "find-card__body";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const creator = document.createElement("p");
    creator.className = "find-card__creator";
    creator.textContent = product.creator || "Creator pending";

    const edition = document.createElement("p");
    edition.className = "find-card__edition";
    edition.textContent = product.edition || product.category || "";

    const price = document.createElement("p");
    price.className = "find-card__price";
    price.textContent = formatPrice(product.price, product.currency);

    const isAvailable = product.status === "active" && product.buyUrl;
    const action = document.createElement(isAvailable ? "a" : "span");
    action.className = "find-card__button";
    action.textContent = "VIEW THE FIND";

    if (isAvailable) {
      action.href = product.buyUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer sponsored";
    } else {
      action.setAttribute("aria-disabled", "true");
    }

    const save = document.createElement("button");
    save.className = "find-card__save";
    save.type = "button";
    save.setAttribute("aria-label", `Save ${product.title}`);
    save.textContent = "♡";

    const actions = document.createElement("div");
    actions.className = "find-card__actions";
    actions.append(action, save);

    body.append(title, creator, edition, price, actions);
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
    const validCategories = [
      "manga",
      "manga-anime-art-books",
      "vintage-magazines",
      "new-japan-finds"
    ];
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
      link.setAttribute("aria-label", `Go to Manga and Japan Finds page ${index}`);

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
    return query ? `/manga/?${query}` : "/manga/";
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
