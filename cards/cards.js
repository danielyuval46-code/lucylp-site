(function () {
  const grid = document.querySelector("[data-cards-grid]");
  const products = [
    {
      id: "birthday",
      title: "Birthday",
      subtitle: "A special LucyLP birthday adventure",
      description: "",
      image: "/assets/cards/products/birthday.png",
      alt: "LucyLP Happy Birthday greeting card",
      format: "Pack of 10 folded 5×7 greeting cards with envelopes",
      price: 24.97,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4537666706/lucylp-happy-birthday-greeting-cards",
      status: "available"
    },
    {
      id: "thank-you",
      title: "Thank You",
      subtitle: "A warm thank-you from the world of LucyLP",
      description: "",
      image: "/assets/cards/products/thank-you.png",
      alt: "LucyLP Thank You greeting card",
      format: "Pack of 10 folded 5×7 greeting cards with envelopes",
      price: 24.97,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4537816579/lucylp-thank-you-greeting-cards-pack-of",
      status: "available"
    },
    {
      id: "mothers-day",
      title: "Mother’s Day",
      subtitle: "For the one who makes every journey possible",
      description: "",
      image: "/assets/cards/products/mothers-day.png",
      alt: "LucyLP Happy Mother's Day greeting card",
      format: "Pack of 10 folded 5×7 greeting cards with envelopes",
      price: 24.97,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4537863640/lucylp-mothers-day-greeting-cards-o-pack",
      status: "available"
    },
    {
      id: "fathers-day",
      title: "Father’s Day",
      subtitle: "For the one who always shows the way",
      description: "",
      image: "/assets/cards/products/fathers-day.png",
      alt: "LucyLP Happy Father's Day greeting card",
      format: "Pack of 10 folded 5×7 greeting cards with envelopes",
      price: 24.97,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4537931759/lucylp-fathers-day-greeting-cards-o-pack",
      status: "available"
    },
    {
      id: "anniversary-love",
      title: "Anniversary / Love",
      subtitle: "A story worth celebrating together",
      description: "",
      image: "/assets/cards/products/anniversary-love.png",
      alt: "LucyLP Happy Anniversary greeting card",
      format: "Pack of 10 folded 5×7 greeting cards with envelopes",
      price: 24.97,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4537983739/lucylp-anniversary-greeting-cards-pack",
      status: "available"
    },
    {
      id: "japanese-new-year",
      title: "Japanese New Year",
      subtitle: "A new year, a new journey.",
      description: "A warm LucyLP greeting card inspired by Japanese New Year traditions, new beginnings, good fortune and beautiful journeys.",
      image: "/assets/cards/products/japanese-new-year.png",
      alt: "LucyLP Japanese New Year greeting card",
      format: "Pack of 10 folded 5×7 greeting cards with envelopes",
      price: 24.97,
      currency: "USD",
      buyUrl: "https://www.etsy.com/listing/4540671043/lucylp-japanese-new-year-greeting-cards",
      status: "available",
      etsyTitle: "LucyLP Japanese New Year Greeting Cards | Pack of 10 | 5x7 Folded Cards with Envelopes",
      etsyDescription: `Welcome the new year with a little story from the world of LucyLP.

This pack includes 10 folded 5x7 greeting cards featuring Lucy in a richly illustrated Japanese New Year scene with lanterns, a shrine gate, sunrise, floral details and vintage comic texture.

Front message:
Happy New Year — A New Year, A New Journey

Inside message:
A new year begins with a single step.
May yours be filled with new stories, warm memories, good fortune, and beautiful journeys.

Happy New Year
あけましておめでとうございます

Perfect for friends, family, collectors and anyone who loves Japan-inspired art, vintage illustration and meaningful paper goods.

Includes:
- 10 folded 5x7 cards
- Matching envelopes
- Blank space for a personal note
- Original LucyLP artwork
- Printed on coated silk paper

A warm, memorable way to begin a new journey.`,
      etsyTags: [
        "japanese new year",
        "new year card",
        "happy new year",
        "greeting card set",
        "pack of 10 cards",
        "5x7 greeting card",
        "folded cards",
        "vintage japan",
        "japan inspired",
        "lucylp",
        "good fortune gift",
        "new beginnings",
        "family friendly"
      ]
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
    image.width = 768;
    image.height = 1152;
    image.loading = "lazy";
    image.decoding = "async";
    image.fetchPriority = "low";
    loadApprovedImage(image, product.image);
    media.append(image);

    const body = document.createElement("div");
    body.className = "product-card__body";

    const title = document.createElement("h3");
    title.textContent = product.title;

    const subtitle = document.createElement("p");
    subtitle.className = "product-card__subtitle";
    subtitle.textContent = product.subtitle;

    const description = document.createElement("p");
    description.className = "greeting-card__description";
    description.textContent = product.description;

    const format = document.createElement("p");
    format.className = "greeting-card__format";
    format.textContent = product.format;

    const price = document.createElement("p");
    price.className = "product-card__price";
    price.textContent = product.status === "available"
      ? formatCurrency(product.price, product.currency)
      : "Coming soon";

    const action = document.createElement(product.status === "available" ? "a" : "span");
    action.className = "product-card__button";
    action.textContent = product.status === "available" ? "Shop card" : "Coming soon";

    if (product.status === "available") {
      action.href = product.buyUrl;
      action.target = "_blank";
      action.rel = "noopener noreferrer sponsored";
    } else {
      action.setAttribute("aria-disabled", "true");
    }

    body.append(title, subtitle, description, format, price, action);
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

    const stem = approvedUrl.pathname
      .replace(/^\/assets\//, "/assets/responsive/")
      .replace(/\.[^.]+$/, "");
    image.srcset = `${stem}-480.webp 480w, ${stem}-768.webp 768w`;
    image.sizes = "(max-width: 760px) calc(100vw - 40px), (max-width: 1120px) calc(50vw - 36px), 340px";
    image.src = approvedUrl.href;
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
