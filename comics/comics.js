(function () {
  const grid = document.querySelector("[data-comics-grid]");
  const allProducts = Array.isArray(window.LUCYLP_PRODUCTS) ? window.LUCYLP_PRODUCTS : [];
  const issueOrder = [
    "lucy-japan-issue-1-en",
    "lucy-japan-issue-2-en",
    "lucy-japan-issue-3-en",
    "lucy-japan-issue-4-en"
  ];
  if (!grid) {
    return;
  }

  const comics = issueOrder.map((id) => {
    const product = allProducts.find((item) => item.id === id) || {};

    return {
      ...product,
      id,
      pages: 19
    };
  });

  grid.replaceChildren(...comics.map(createComicCard));

  function createComicCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productId = product.id;

    const media = document.createElement("div");
    media.className = "product-card__media";

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

    const body = document.createElement("div");
    body.className = "product-card__body";

    const status = document.createElement("p");
    status.className = `product-card__status${product.status === "available" ? "" : " product-card__status--soon"}`;
    status.textContent = product.status === "available" ? "Available" : "Coming soon";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const subtitle = document.createElement("p");
    subtitle.className = "product-card__subtitle";
    subtitle.textContent = product.subtitle;

    const meta = document.createElement("p");
    meta.className = "product-card__meta";
    meta.textContent = `${product.language} | ${product.pages} pages`;

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = product.status === "available" ? product.price : "Coming soon";

    const action = document.createElement(product.status === "available" ? "a" : "span");
    action.className = "product-card__button";
    action.textContent = product.status === "available" ? "Get the comic" : "Coming soon";

    if (product.status === "available") {
      action.href = product.buyUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer sponsored";
    } else {
      action.setAttribute("aria-disabled", "true");
    }

    body.append(status, title, subtitle, meta, price, action);
    card.append(media, body);
    return card;
  }

  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}());
