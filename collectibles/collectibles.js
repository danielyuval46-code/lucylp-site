(function () {
  const grid = document.querySelector("[data-collectibles-grid]");
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
      title: "Toki Market Ashtray",
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
      id: "gate-70-lighter",
      title: "Air Torenza Lighter — Gate 70",
      subtitle: "World’s Airways",
      image: "/assets/collectibles/products/air-torenza-lighter-gate-70.png",
      alt: "Approved VINTAGE-IT Collectibles artwork showing Air Torenza Gate 70 lighters",
      format: "Collectible lighter",
      status: "coming-soon"
    },
    {
      id: "destination-moon-lighter",
      title: "Air Torenza Lighter — Destination the Moon",
      subtitle: "From Imagination to Destination",
      image: "/assets/collectibles/products/air-torenza-lighter-destination-moon.png",
      alt: "Approved VINTAGE-IT Collectibles artwork showing the Destination the Moon lighter",
      format: "Collectible lighter",
      status: "coming-soon"
    }
  ];

  if (grid) {
    grid.replaceChildren(...products.map(createCard));
  }

  function createCard(product) {
    const card = document.createElement("article");
    card.className = "product-card collectible-card";
    card.dataset.productId = product.id;

    const media = document.createElement("div");
    media.className = "product-card__media";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.alt;
    image.loading = "lazy";
    image.decoding = "async";
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
