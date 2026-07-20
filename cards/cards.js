(function () {
  const grid = document.querySelector("[data-cards-grid]");
  const products = [
    {
      id: "birthday",
      title: "Birthday",
      subtitle: "A special LucyLP birthday adventure",
      image: "/assets/cards/products/birthday.png",
      alt: "LucyLP Happy Birthday greeting card"
    },
    {
      id: "thank-you",
      title: "Thank You",
      subtitle: "A warm thank-you from the world of LucyLP",
      image: "/assets/cards/products/thank-you.png",
      alt: "LucyLP Thank You greeting card"
    },
    {
      id: "mothers-day",
      title: "Mother’s Day",
      subtitle: "For the one who makes every journey possible",
      image: "/assets/cards/products/mothers-day.png",
      alt: "LucyLP Happy Mother's Day greeting card"
    },
    {
      id: "fathers-day",
      title: "Father’s Day",
      subtitle: "For the one who always shows the way",
      image: "/assets/cards/products/fathers-day.png",
      alt: "LucyLP Happy Father's Day greeting card"
    },
    {
      id: "anniversary-love",
      title: "Anniversary / Love",
      subtitle: "A story worth celebrating together",
      image: "/assets/cards/products/anniversary-love.png",
      alt: "LucyLP Happy Anniversary greeting card"
    }
  ];

  if (grid) {
    grid.replaceChildren(...products.map(createCard));
  }

  function createCard(product) {
    const card = document.createElement("article");
    card.className = "product-card greeting-card";
    card.dataset.productId = product.id;

    const media = document.createElement("div");
    media.className = "product-card__media";

    const image = document.createElement("img");
    image.alt = product.alt;
    image.loading = "eager";
    image.decoding = "async";
    loadApprovedImage(image, product.image);
    media.append(image);

    const body = document.createElement("div");
    body.className = "product-card__body";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const subtitle = document.createElement("p");
    subtitle.className = "product-card__subtitle";
    subtitle.textContent = product.subtitle;

    const format = document.createElement("p");
    format.className = "greeting-card__format";
    format.textContent = "Format details coming soon";

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = "Coming soon";

    const action = document.createElement("span");
    action.className = "product-card__button";
    action.textContent = "Coming soon";
    action.setAttribute("aria-disabled", "true");

    body.append(title, subtitle, format, price, action);
    card.append(media, body);
    return card;
  }

  function loadApprovedImage(image, assetPath) {
    const approvedUrl = new URL(assetPath, window.location.origin);
    let retryCount = 0;

    image.addEventListener("error", () => {
      if (retryCount >= 2) {
        return;
      }

      retryCount += 1;
      const retryUrl = new URL(approvedUrl.href);
      retryUrl.searchParams.set("asset-retry", String(retryCount));
      window.setTimeout(() => {
        image.src = retryUrl.href;
      }, retryCount * 250);
    });

    image.src = approvedUrl.href;
  }

  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}());
