const catalogData = {
  vinyl: [
    {
      image: "/assets/departments/vinyl-sample-01.png?v=20260713-1",
      title: "Japanese Pressing Selection",
      eyebrow: "Sample record",
      edition: "Japanese pressing",
      condition: "Condition to be confirmed",
      price: "Price pending",
      url: ""
    },
    {
      image: "/assets/departments/vinyl-sample-02.png?v=20260713-1",
      title: "Classic Album Selection",
      eyebrow: "Sample record",
      edition: "Collector edition",
      condition: "Condition to be confirmed",
      price: "Price pending",
      url: ""
    },
    {
      image: "/assets/departments/vinyl-sample-03.png?v=20260713-1",
      title: "Rare Vinyl Selection",
      eyebrow: "Sample record",
      edition: "International pressing",
      condition: "Condition to be confirmed",
      price: "Price pending",
      url: ""
    }
  ],
  manga: [
    {
      title: "Japanese Original Selection",
      eyebrow: "Sample manga",
      volume: "Volume to be confirmed",
      language: "Japanese",
      condition: "Condition to be confirmed",
      price: "Price pending",
      sampleClass: "sample-1",
      url: ""
    },
    {
      title: "Classic Series Selection",
      eyebrow: "Sample manga",
      volume: "Volume to be confirmed",
      language: "Japanese / English",
      condition: "Condition to be confirmed",
      price: "Price pending",
      sampleClass: "sample-2",
      url: ""
    },
    {
      title: "Collectible Manga Selection",
      eyebrow: "Sample manga",
      volume: "Volume to be confirmed",
      language: "Edition to be confirmed",
      condition: "Condition to be confirmed",
      price: "Price pending",
      sampleClass: "sample-3",
      url: ""
    }
  ]
};

function detailRows(type, item) {
  if (type === "vinyl") {
    return [
      ["Edition", item.edition],
      ["Condition", item.condition],
      ["Price", item.price]
    ];
  }

  return [
    ["Volume", item.volume],
    ["Language", item.language],
    ["Condition", item.condition],
    ["Price", item.price]
  ];
}

function renderCatalog() {
  const grid = document.querySelector("[data-catalog]");
  if (!grid) return;

  const type = grid.dataset.catalog;
  const items = catalogData[type] || [];
  const actionLabel = type === "vinyl" ? "View record" : "View manga";

  grid.replaceChildren(...items.map((item) => {
    const article = document.createElement("article");
    article.className = "catalog-card";

    const visual = document.createElement("div");
    visual.className = type === "manga"
      ? `item-visual manga-sample-visual ${item.sampleClass}`
      : "item-visual";

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = `${item.title} sample listing image`;
      img.loading = "lazy";
      visual.append(img);
    }

    const flag = document.createElement("span");
    flag.className = "sample-flag";
    flag.textContent = "Sample listing";
    visual.append(flag);

    const body = document.createElement("div");
    body.className = "card-body";
    const rows = detailRows(type, item)
      .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
      .join("");
    const actionAttrs = item.url
      ? `href="${item.url}" target="_blank" rel="noopener noreferrer"`
      : `href="#" aria-disabled="true" title="Sample listing — link pending"`;

    body.innerHTML = `
      <p class="card-eyebrow">${item.eyebrow}</p>
      <h2 class="card-title">${item.title}</h2>
      <dl class="details-list">${rows}</dl>
      <a class="card-action" ${actionAttrs}>${actionLabel}</a>
    `;

    const action = body.querySelector("[aria-disabled='true']");
    action?.addEventListener("click", (event) => event.preventDefault());
    article.append(visual, body);
    return article;
  }));
}

function setupMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    button.textContent = open ? "×" : "☰";
  });
}

renderCatalog();
setupMenu();
