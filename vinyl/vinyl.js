(function () {
  const fallbackProducts = Array.isArray(window.LUCYLP_VINYL_PRODUCTS) ? window.LUCYLP_VINYL_PRODUCTS : [];
  const categoryConfig = Array.isArray(window.LUCYLP_VINYL_CATEGORIES) ? window.LUCYLP_VINYL_CATEGORIES : [];
  const grid = document.querySelector("[data-record-grid]");
  const feedStatus = document.querySelector("[data-feed-status]");
  const categoryLinks = document.querySelectorAll("[data-category-link]");

  if (!grid) {
    return;
  }

  const activeCategory = getActiveCategory();
  markActiveCategory(activeCategory);
  loadProducts(activeCategory).then((products) => {
    renderRecords(products, activeCategory);
  });

  async function loadProducts(activeCategory) {
    try {
      const response = await fetch(buildFeedUrl(activeCategory), {
        headers: { accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error("Feed unavailable");
      }

      const data = await response.json();
      const liveItems = normalizeFeed(data, activeCategory);

      if (!liveItems.length) {
        return fallbackProducts;
      }

      if (feedStatus) {
        feedStatus.textContent = "Live collector finds are loaded from the curated feed.";
      }

      return liveItems;
    } catch (_error) {
      if (feedStatus) {
        feedStatus.textContent = "Curated fallback records are shown until the live feed is available.";
      }

      return fallbackProducts;
    }
  }

  function buildFeedUrl(activeCategory) {
    if (activeCategory) {
      return `/api/ebay?category=${encodeURIComponent(activeCategory)}`;
    }

    return "/api/ebay";
  }

  function normalizeFeed(data, activeCategory) {
    if (Array.isArray(data.items)) {
      return data.items.map((item, index) => normalizeProviderItem(item, activeCategory || data.category || "new-finds", index));
    }

    if (!data.sections || typeof data.sections !== "object") {
      return [];
    }

    return categoryConfig.flatMap((category) => {
      const items = data.sections[category.id] || [];
      return items.map((item, index) => normalizeProviderItem(item, category.id, index));
    });
  }

  function normalizeProviderItem(item, category, index) {
    const title = String(item.title || "LucyLP Collector Find").trim();
    const parsed = splitTitle(title);

    return {
      id: item.itemId || item.id || `${category}-${index}`,
      title: parsed.artist,
      artist: parsed.artist,
      album: parsed.album,
      category,
      edition: "",
      pressingCountry: "",
      year: "",
      condition: item.condition || "",
      price: normalizePrice(item.price),
      currency: item.currency || "",
      image: item.image || item.imageUrl || "",
      provider: item.provider || "provider",
      buyUrl: item.url || item.buyUrl || "",
      status: item.url || item.buyUrl ? "available" : "curated",
      featured: true,
      displayOrder: 100 + index,
      tags: []
    };
  }

  function splitTitle(title) {
    const separators = [" - ", " – ", " | "];
    const separator = separators.find((mark) => title.includes(mark));

    if (!separator) {
      return {
        artist: title,
        album: ""
      };
    }

    const [artist, ...rest] = title.split(separator);
    return {
      artist: artist.trim(),
      album: rest.join(separator).trim()
    };
  }

  function normalizePrice(price) {
    const raw = String(price || "").trim();
    const providerPrice = raw.match(/^([A-Z]{3})\s+([0-9.,]+)/);

    if (providerPrice) {
      return formatCurrency(providerPrice[2], providerPrice[1]);
    }

    if (/^[^\d-]/.test(raw)) {
      return raw;
    }

    return raw ? formatCurrency(raw, "USD") : "TBA";
  }

  function formatCurrency(value, currency) {
    const number = Number(String(value).replace(/,/g, ""));

    if (!Number.isFinite(number)) {
      return value;
    }

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD"
      }).format(number);
    } catch (_error) {
      return value;
    }
  }

  function renderRecords(products, activeCategory) {
    const visible = products
      .filter((product) => product.featured !== false)
      .filter((product) => !activeCategory || product.category === activeCategory)
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
      .slice(0, 12);

    grid.replaceChildren(...visible.map(createRecordCard));
  }

  function createRecordCard(product) {
    const card = document.createElement("article");
    card.className = "record-card";

    const media = document.createElement("div");
    media.className = "record-card__media";

    const image = document.createElement("img");
    image.src = product.image || "/assets/departments/vinyl-sample-01.png";
    image.alt = `${product.title} ${product.album || "vinyl record"} artwork`;
    image.loading = "lazy";
    image.width = 320;
    image.height = 320;
    media.append(image);

    const badgeText = getBadge(product);
    if (badgeText) {
      const badge = document.createElement("span");
      badge.className = "record-card__badge";
      badge.textContent = badgeText;
      media.append(badge);
    }

    const body = document.createElement("div");
    body.className = "record-card__body";

    const artist = document.createElement("h3");
    artist.textContent = product.artist || product.title;

    const album = document.createElement("p");
    album.className = "record-card__album";
    album.textContent = product.album || product.edition || "Collector record";

    const price = document.createElement("p");
    price.className = "record-card__price";
    price.textContent = product.price || "TBA";

    const actionRow = document.createElement("div");
    actionRow.className = "record-card__actions";

    const action = document.createElement("a");
    action.className = "record-card__button";
    action.textContent = "View the Record";

    if (product.status === "available" && product.buyUrl) {
      action.href = product.buyUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer";
    } else {
      action.href = "#";
      action.setAttribute("aria-disabled", "true");
    }

    const favorite = document.createElement("button");
    favorite.className = "record-card__save";
    favorite.type = "button";
    favorite.setAttribute("aria-label", "Save record placeholder");
    favorite.textContent = "♡";

    actionRow.append(action, favorite);
    body.append(artist, album, price, actionRow);
    card.append(media, body);
    return card;
  }

  function getBadge(product) {
    const parts = [product.year, product.pressingCountry, product.edition || product.condition]
      .filter(Boolean)
      .join(" ");

    return parts || "";
  }

  function getActiveCategory() {
    const category = new URLSearchParams(window.location.search).get("category");
    const knownCategories = categoryConfig.map((item) => item.id);
    return knownCategories.includes(category) ? category : "";
  }

  function markActiveCategory(activeCategory) {
    if (!activeCategory) {
      return;
    }

    categoryLinks.forEach((link) => {
      if (link.dataset.categoryLink === activeCategory) {
        link.setAttribute("aria-current", "true");
      }
    });
  }
})();
