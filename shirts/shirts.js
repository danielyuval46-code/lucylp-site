(function () {
  const grid = document.querySelector("[data-shirts-grid]");
  const products = [
    {
      id: "air-torenza-fourth-of-july-1976",
      title: "Air Torenza — Fourth of July 1976",
      subtitle: "American Route / Gate 70",
      support: "",
      image: "/assets/shirts/products/air-torenza-fourth-of-july-1976.png",
      alt: "Air Torenza Fourth of July 1976 approved shirt artwork"
    },
    {
      id: "vintage-it-first-record-1984",
      title: "VINTAGE-IT — First Record 1984",
      subtitle: "Toki Market",
      support: "",
      image: "/assets/shirts/products/vintage-it-first-record-1984.png",
      alt: "VINTAGE-IT First Record 1984 approved shirt artwork"
    },
    {
      id: "genesis-fire",
      title: "Genesis Fire",
      subtitle: "Live in Tokyo — 8.2.1966",
      support: "The Fire Comes Before All",
      image: "/assets/shirts/products/genesis-fire-live-in-tokyo.png",
      alt: "Genesis Fire Live in Tokyo approved shirt artwork"
    },
    {
      id: "air-torenza-moon-landing-1969",
      title: "Air Torenza — Moon Landing 1969",
      subtitle: "From Imagination to Destination",
      support: "",
      image: "/assets/shirts/products/air-torenza-moon-landing-1969.png",
      alt: "Air Torenza Moon Landing 1969 approved shirt artwork"
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
    image.alt = product.alt;
    image.loading = "eager";
    image.decoding = "async";
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
      "<span>XS–XL $28.99</span>",
      "<span>2XL $31.99</span>",
      "<span>3XL $33.99</span>",
      "<span>4XL $38.99</span>",
      "<span>5XL $41.99</span>"
    ].join("");

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = "From $28.99";

    const action = document.createElement("span");
    action.className = "product-card__button";
    action.textContent = "Coming soon";
    action.setAttribute("aria-disabled", "true");

    body.append(title, subtitle, support, sizes, pricing, price, action);
    card.append(media, body);
    return card;
  }

  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}());
