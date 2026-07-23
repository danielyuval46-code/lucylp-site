(function () {
  const grid = document.querySelector("[data-shirts-grid]");
  const products = [
    {
      id: "air-torenza-fourth-of-july-1976",
      title: "Air Torenza — Fourth of July 1976",
      subtitle: "American Route / Gate 70",
      support: "",
      image: "/assets/shirts/products/air-torenza-fourth-of-july-1976.png",
      alt: "Air Torenza Fourth of July 1976 approved shirt artwork",
      price: 28.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538847138/air-torenza-fourth-of-july-1976-american",
      status: "available"
    },
    {
      id: "vintage-it-first-record-1984",
      title: "VINTAGE-IT — First Record 1984",
      subtitle: "Toki Market",
      support: "",
      image: "/assets/shirts/products/vintage-it-first-record-1984.png",
      alt: "VINTAGE-IT First Record 1984 approved shirt artwork",
      price: 29.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538142624/vintage-it-first-record-1984-unisex-t",
      status: "available"
    },
    {
      id: "genesis-fire",
      title: "Genesis Fire",
      subtitle: "Live in Tokyo — 8.2.1966",
      support: "The Fire Comes Before All",
      image: "/assets/shirts/products/genesis-fire-live-in-tokyo.png",
      alt: "Genesis Fire Live in Tokyo approved shirt artwork",
      price: 28.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538395889/genesis-fire-live-in-tokyo-1966-unisex-t",
      status: "available"
    },
    {
      id: "air-torenza-moon-landing-1969",
      title: "Air Torenza — Moon Landing 1969",
      subtitle: "From Imagination to Destination",
      support: "",
      image: "/assets/shirts/products/air-torenza-moon-landing-1969.png",
      alt: "Air Torenza Moon Landing 1969 approved shirt artwork",
      price: 28.99,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4538871472/air-torenza-moon-landing-1969-vintage",
      status: "available"
    }
  ];

  if (grid) {
    grid.replaceChildren(...products.map(createShirtCard));
  }

  function createShirtCard(product) {
    const card = document.createElement("article");
    card.className = "product-card shirt-card";
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
    image.addEventListener("error", () => {
      media.classList.add("product-card__media--missing");
      image.remove();
    }, { once: true });
    media.append(image);

    const body = document.createElement("div");
    body.className = "product-card__body";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const subtitle = document.createElement("p");
    subtitle.className = "product-card__subtitle";
    subtitle.textContent = product.subtitle;

    const support = document.createElement("p");
    support.className = "shirt-card__support";
    support.textContent = product.support;

    const sizes = document.createElement("p");
    sizes.className = "shirt-card__sizes";
    sizes.textContent = "Available in XS–5XL";

    const pricing = document.createElement("div");
    pricing.className = "shirt-card__pricing";
    pricing.setAttribute("aria-label", "Size pricing");
    pricing.innerHTML = [
      `<span>XS–XL ${formatCurrency(product.price, product.currency)}</span>`,
      "<span>2XL $31.99</span>",
      "<span>3XL $33.99</span>",
      "<span>4XL $38.99</span>",
      "<span>5XL $41.99</span>"
    ].join("");

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = `From ${formatCurrency(product.price, product.currency)}`;

    const action = document.createElement(product.status === "available" ? "a" : "span");
    action.className = "product-card__button";
    action.textContent = product.status === "available" ? "Shop shirt" : "Coming soon";

    if (product.status === "available") {
      action.href = product.buyUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer sponsored";
    } else {
      action.setAttribute("aria-disabled", "true");
    }

    body.append(title, subtitle, support, sizes, pricing, price, action);
    card.append(media, body);
    return card;
  }

  function applyResponsiveProductImage(image, assetPath) {
    const stem = assetPath
      .replace(/^\/assets\//, "/assets/responsive/")
      .replace(/\.[^.]+$/, "");
    image.srcset = `${stem}-480.webp 480w, ${stem}-768.webp 768w`;
    image.sizes = "(max-width: 760px) calc(100vw - 40px), (max-width: 1120px) calc(50vw - 36px), 260px";
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
