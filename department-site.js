function setupMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    button.textContent = open ? "Close" : "Menu";
  });
}

function respectReducedMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const videos = document.querySelectorAll("video[autoplay]");
  const update = () => {
    videos.forEach((video) => {
      if (reduceMotion.matches) {
        video.pause();
      } else {
        video.muted = true;
        video.play().catch(() => {});
      }
    });
  };

  reduceMotion.addEventListener("change", update);
  update();
}

setupMenu();
respectReducedMotion();
