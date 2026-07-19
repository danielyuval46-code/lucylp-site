(function () {
  const localProducts = Array.isArray(window.LUCYLP_PRODUCTS) ? window.LUCYLP_PRODUCTS : [];
  const grids = document.querySelectorAll("[data-product-grid]");

  if (!grids.length) {
    return;
  }

  loadProducts().then(renderProducts).catch(() => {
    renderProducts(localProducts);
  });

  async function loadProducts() {
    const response = await fetch("/api/etsy", {
      headers: { accept: "application/json" }
    });

    if (!response.ok) {
      return localProducts;
    }

    const data = await response.json();
    const etsyProducts = Array.isArray(data.products) ? data.products : [];

    if (!etsyProducts.length) {
      return localProducts;
    }

    return mergeProducts(localProducts, etsyProducts);
  }

  function mergeProducts(localItems, etsyItems) {
    const etsyByListingId = new Map(
      etsyItems
        .filter((product) => product.providerListingId)
        .map((product) => [String(product.providerListingId), product])
    );
    const etsyById = new Map(etsyItems.map((product) => [String(product.id), product]));
    const etsyByNormalizedTitle = new Map(
      etsyItems
        .filter((product) => product.title)
        .map((product) => [normalizeTitle(product.title), product])
    );
    const usedEtsyIds = new Set();

    const mergedLocalItems = localItems.map((localProduct) => {
      const etsyProduct =
        etsyByListingId.get(String(localProduct.etsyListingId || "")) ||
        etsyByNormalizedTitle.get(normalizeTitle(localProduct.etsyTitleMatch || "")) ||
        etsyById.get(String(localProduct.id));

      if (!etsyProduct) {
        return localProduct;
      }

      usedEtsyIds.add(String(etsyProduct.id));

      return {
        ...localProduct,
        price: etsyProduct.price || localProduct.price,
        currency: etsyProduct.currency || localProduct.currency,
        provider: etsyProduct.provider || localProduct.provider,
        providerListingId: etsyProduct.providerListingId,
        buyUrl: etsyProduct.buyUrl || localProduct.buyUrl,
        status: etsyProduct.status === "available" && etsyProduct.buyUrl ? "available" : localProduct.status,
        updatedAt: etsyProduct.updatedAt || localProduct.updatedAt
      };
    });

    const etsyOnlyItems = etsyItems
      .filter((etsyProduct) => !usedEtsyIds.has(String(etsyProduct.id)))
      .filter((etsyProduct) => etsyProduct.status === "available")
      .map((etsyProduct, index) => ({
        id: etsyProduct.id,
        collection: etsyProduct.collection || "shop",
        title: etsyProduct.title,
        subtitle: "",
        type: inferType(etsyProduct),
        language: "",
        pages: null,
        price: etsyProduct.price,
        currency: etsyProduct.currency,
        cover: etsyProduct.image,
        provider: etsyProduct.provider,
        providerListingId: etsyProduct.providerListingId,
        buyUrl: etsyProduct.buyUrl,
        status: "available",
        featured: etsyProduct.collection !== "shop",
        displayOrder: 1000 + index,
        updatedAt: etsyProduct.updatedAt
      }));

    return [...mergedLocalItems, ...etsyOnlyItems].sort((a, b) => {
      return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
    });
  }

  function renderProducts(products) {
    grids.forEach((grid) => {
      const collection = grid.dataset.collection;
      const visibleProducts = products.filter((product) => {
        return product.featured && (!collection || product.collection === collection);
      });

      if (!visibleProducts.length) {
        const emptyState = document.querySelector(`[data-empty-state="${collection}"]`);
        if (emptyState) {
          emptyState.hidden = false;
        }
        return;
      }

      grid.replaceChildren(...visibleProducts.map(createProductCard));
    });
  }

  function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productId = product.id;

    const media = document.createElement("div");
    media.className = "product-card__media";

    if (product.cover) {
      const image = document.createElement("img");
      image.src = product.cover;
      image.alt = `${product.title} cover`;
      image.loading = "eager";
      image.decoding = "async";
      image.addEventListener("error", () => {
        media.classList.add("product-card__media--missing");
        image.remove();
      }, { once: true });
      media.append(image);
    } else {
      media.classList.add("product-card__media--missing");
    }

    if (product.status !== "available") {
      const stamp = document.createElement("span");
      stamp.className = "product-card__stamp";
      stamp.textContent = "Coming soon";
      media.append(stamp);
    }

    const body = document.createElement("div");
    body.className = "product-card__body";

    const meta = document.createElement("p");
    meta.className = "product-card__meta";
    meta.textContent = [product.type, product.language, formatPages(product.pages)]
      .filter(Boolean)
      .join(" | ");

    const title = document.createElement("h3");
    title.textContent = product.title;

    const subtitle = document.createElement("p");
    subtitle.className = "product-card__subtitle";
    subtitle.textContent = product.subtitle;

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = formatPrice(product);

    const isAvailable = product.status === "available" && product.buyUrl;
    const action = document.createElement(isAvailable ? "a" : "span");
    action.className = "product-card__button";
    action.textContent = getButtonLabel(product);

    if (isAvailable) {
      action.href = product.buyUrl;
    } else {
      action.setAttribute("aria-disabled", "true");
    }

    body.append(meta, title, subtitle, price, action);
    card.append(media, body);
    return card;
  }

  function formatPages(pages) {
    return pages ? `${pages} pages` : "Pages TBA";
  }

  function formatPrice(product) {
    const rawPrice = String(product.price || "").trim();

    if (!rawPrice) {
      return "TBA";
    }

    if (/^[^\d-]/.test(rawPrice)) {
      return rawPrice;
    }

    const numericPrice = Number(rawPrice.replace(/,/g, ""));

    if (!Number.isFinite(numericPrice)) {
      return rawPrice;
    }

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: product.currency || "USD"
      }).format(numericPrice);
    } catch (_error) {
      return rawPrice;
    }
  }

  function getButtonLabel(product) {
    if (product.status !== "available") {
      return "Coming soon";
    }

    if (product.buttonLabel) {
      return product.buttonLabel;
    }

    return product.type.toLowerCase().includes("comic") ? "Get the comic" : "Get the book";
  }

  function inferType(product) {
    const tags = Array.isArray(product.tags) ? product.tags.join(" ").toLowerCase() : "";
    const text = `${product.title || ""} ${tags}`.toLowerCase();

    if (text.includes("comic") || text.includes("lucylp-comic")) {
      return "Digital Comic";
    }

    if (text.includes("guide") || text.includes("book") || text.includes("lucylp-guide")) {
      return "Digital Activity Book";
    }

    return "Digital Product";
  }

  function normalizeTitle(title) {
    return String(title || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}());
