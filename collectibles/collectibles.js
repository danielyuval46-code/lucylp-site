(function () {
  const grid = document.querySelector("[data-collectibles-grid]");
  const pagination = document.querySelector("[data-collectibles-pagination]");
  const itemsPerPage = 6;
  const products = [
    {
      id: "mexico-1970-ashtray",
      title: "Air Torenza — Mexico 1970 Ashtray",
      subtitle: "Mundial Route / Gate 70",
      image: "/assets/collectibles/products/air-torenza-mexico-1970-ashtray.jpg",
      alt: "Air Torenza Mexico 1970 glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538740099/air-torenza-mexico-1970-mundial-route",
      status: "available"
    },
    {
      id: "fourth-july-1976-ashtray",
      title: "Air Torenza — Fourth of July 1976 Ashtray",
      subtitle: "American Route / Gate 70",
      image: "/assets/collectibles/products/air-torenza-fourth-july-1976-ashtray.jpg",
      alt: "Air Torenza Fourth of July 1976 glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538719648/air-torenza-fourth-of-july-1976-american",
      status: "available"
    },
    {
      id: "london-1966-ashtray",
      title: "Air Torenza — London 1966 Ashtray",
      subtitle: "The Summer of Champions",
      image: "/assets/collectibles/products/air-torenza-london-1966-ashtray.jpg",
      alt: "Air Torenza London 1966 glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538547416/air-torenza-london-1966-vintage-glass",
      status: "available"
    },
    {
      id: "toki-market-ashtray",
      title: "Tokyo to Torenza Ashtray",
      subtitle: "Tokyo Night Finds / Gate 70",
      image: "/assets/collectibles/products/toki-market-ashtray.jpg",
      alt: "Toki Market and Air Torenza Gate 70 glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538599735/air-torenza-tokyo-to-torenza-gate-70",
      status: "available"
    },
    {
      id: "moon-landing-1969-ashtray",
      title: "Air Torenza — Moon Landing 1969 Ashtray",
      subtitle: "From Imagination to Destination",
      image: "/assets/collectibles/products/air-torenza-moon-landing-1969-ashtray.jpg",
      alt: "Air Torenza Moon Landing 1969 glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538607922/air-torenza-moon-landing-1969-glass",
      status: "available"
    },
    {
      id: "woodstock-ashtray",
      title: "Air Torenza — Woodstock Ashtray",
      subtitle: "Peace, Music & Flight",
      image: "/assets/collectibles/products/air-torenza-woodstock-ashtray.jpg",
      alt: "Air Torenza Woodstock glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538610361/air-torenza-woodstock-1969-peace-music",
      status: "available"
    },
    {
      id: "mexico-1970-supersonic-ashtray",
      title: "Air Torenza Mexico 1970 Supersonic Mundial Route Vintage Glass Ashtray",
      subtitle: "",
      image: "https://i.etsystatic.com/17536107/r/il/56d582/8306961465/il_fullxfull.8306961465_m4bi.jpg",
      alt: "Air Torenza Mexico 1970 Supersonic Mundial Route glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538792626/air-torenza-mexico-1970-supersonic",
      status: "available"
    },
    {
      id: "moon-landing-1969-vintage-ashtray",
      title: "Air Torenza Moon Landing 1969 Vintage Glass Ashtray",
      subtitle: "",
      image: "https://i.etsystatic.com/17536107/r/il/61c24e/8305404643/il_fullxfull.8305404643_qa5c.jpg",
      alt: "Air Torenza Moon Landing 1969 vintage glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538584291/air-torenza-moon-landing-1969-vintage",
      status: "available"
    },
    {
      id: "mexico-city-1968-retro-ashtray",
      title: "Air Torenza Mexico City 1968 Retro Aviation Glass Ashtray",
      subtitle: "",
      image: "https://i.etsystatic.com/17536107/r/il/e712c8/8257375666/il_fullxfull.8257375666_l973.jpg",
      alt: "Air Torenza Mexico City 1968 retro aviation glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538570161/air-torenza-mexico-city-1968-retro",
      status: "available"
    },
    {
      id: "mexico-city-1968-vintage-ashtray",
      title: "Air Torenza Mexico City 1968 Vintage Glass Ashtray",
      subtitle: "",
      image: "https://i.etsystatic.com/17536107/r/il/7b2333/8305220449/il_fullxfull.8305220449_hqwa.jpg",
      alt: "Air Torenza Mexico City 1968 vintage glass ashtray",
      format: "Clear glass ashtray",
      price: 24.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538562177/air-torenza-mexico-city-1968-vintage",
      status: "available"
    }
  ];

  if (grid) {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const requestedPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
    const currentPage = Number.isInteger(requestedPage)
      ? Math.min(Math.max(requestedPage, 1), totalPages)
      : 1;
    const start = (currentPage - 1) * itemsPerPage;

    grid.replaceChildren(...products.slice(start, start + itemsPerPage).map(createCard));
    renderPagination(totalPages, currentPage);
  }

  function createCard(product) {
    const card = document.createElement("article");
    card.className = "product-card collectible-card";
    card.dataset.productId = product.id;

    const media = document.createElement("div");
    media.className = "product-card__media";

    const image = document.createElement("img");
    image.src = product.image;
    applyResponsiveProductImage(image, product.image);
    image.alt = product.alt;
    image.width = 768;
    image.height = 512;
    image.loading = "lazy";
    image.decoding = "async";
    image.fetchPriority = "low";
    media.append(image);

    const body = document.createElement("div");
    body.className = "product-card__body";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const subtitle = document.createElement("p");
    subtitle.className = "product-card__subtitle";
    subtitle.textContent = product.subtitle;

    const format = document.createElement("p");
    format.className = "collectible-card__format";
    format.textContent = product.format;

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = product.status === "available"
      ? formatCurrency(product.price, product.currency)
      : "Coming soon";

    const action = document.createElement(product.status === "available" ? "a" : "span");
    action.className = "product-card__button";
    action.textContent = product.status === "available" ? "Shop collectible" : "Coming soon";

    if (product.status === "available") {
      action.href = product.buyUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer sponsored";
    } else {
      action.setAttribute("aria-disabled", "true");
    }

    body.append(title, subtitle, format, price, action);
    card.append(media, body);
    return card;
  }

  function renderPagination(totalPages, currentPage) {
    if (!pagination) {
      return;
    }

    const controls = [
      createPageControl("Previous", currentPage - 1, currentPage === 1)
    ];

    for (let page = 1; page <= totalPages; page += 1) {
      const link = createPageControl(String(page), page, false);
      if (page === currentPage) {
        link.setAttribute("aria-current", "page");
      }
      controls.push(link);
    }

    controls.push(createPageControl("Next", currentPage + 1, currentPage === totalPages));
    pagination.replaceChildren(...controls);
  }

  function createPageControl(label, page, disabled) {
    const control = document.createElement(disabled ? "span" : "a");
    control.className = "collectibles-pagination__control";
    control.textContent = label;

    if (disabled) {
      control.setAttribute("aria-disabled", "true");
    } else {
      control.href = page === 1 ? "/collectibles/" : `/collectibles/?page=${page}`;
      control.setAttribute("aria-label", `${label} collectibles page`);
    }

    return control;
  }
  function applyResponsiveProductImage(image, assetPath) {
    if (!assetPath.startsWith("/assets/collectibles/")) {
      return;
    }

    const stem = assetPath
      .replace(/^\/assets\//, "/assets/responsive/")
      .replace(/\.[^.]+$/, "");
    image.srcset = `${stem}-480.webp 480w, ${stem}-768.webp 768w`;
    image.sizes = "(max-width: 760px) calc(100vw - 40px), (max-width: 1120px) calc(50vw - 36px), 340px";
  }

  function formatCurrency(value, currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(Number(value));
  }

  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}());
