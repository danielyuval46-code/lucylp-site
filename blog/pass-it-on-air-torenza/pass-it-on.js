const shareTitle = "Pass It On: Air Torenza";
const shareText = "The official Air Torenza company booklet is free to read, download and share.";
const postUrl = new URL(window.location.href);
postUrl.hash = "";
const shareUrl = postUrl.toString();
const encodedUrl = encodeURIComponent(shareUrl);
const encodedText = encodeURIComponent(shareTitle + " — " + shareUrl);
const status = document.querySelector("[data-share-status]");
const whatsapp = document.querySelector("[data-share-whatsapp]");
const facebook = document.querySelector("[data-share-facebook]");
const email = document.querySelector("[data-share-email]");
if (whatsapp) whatsapp.href = "https://wa.me/?text=" + encodedText;
if (facebook) facebook.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;
if (email) email.href = "mailto:?subject=" + encodeURIComponent(shareTitle) + "&body=" + encodeURIComponent(shareText + "\n\n" + shareUrl);
const nativeShare = document.querySelector("[data-share-native]");
if (nativeShare) {
  if (navigator.share) {
    nativeShare.addEventListener("click", async () => {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (error) {
        if (error.name !== "AbortError" && status) status.textContent = "Sharing could not be opened.";
      }
    });
  } else {
    nativeShare.hidden = true;
  }
}
const copyLink = document.querySelector("[data-copy-link]");
if (copyLink) {
  copyLink.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (status) status.textContent = "Link copied.";
    } catch {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      if (status) status.textContent = copied ? "Link copied." : "Copy the page address from your browser.";
    }
  });
}
