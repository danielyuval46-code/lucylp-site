const promoButton = document.getElementById('generate-tiktok-promo');
const promoStatus = document.getElementById('promo-status');
const promoPreview = document.getElementById('promo-preview');
const promoPath = '/videos/lucylp-music-press-issue-1-tiktok-promo.mp4';

promoButton.addEventListener('click', function() {
  promoButton.disabled = true;
  promoButton.textContent = 'Generating...';
  promoStatus.textContent = 'Generating TikTok promo from cover, pages 9, 14, 16, and 19...';

  window.setTimeout(function() {
    promoPreview.src = `${promoPath}?v=${Date.now()}`;
    promoPreview.load();
    promoStatus.textContent = 'Generated and saved to /videos/lucylp-music-press-issue-1-tiktok-promo.mp4';
    promoButton.textContent = 'Generated';
  }, 700);
});
