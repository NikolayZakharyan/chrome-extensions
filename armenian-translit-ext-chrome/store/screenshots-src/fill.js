// Fills every [data-latin] element with the real engine output,
// so the store images always match what the extension does.
for (const el of document.querySelectorAll("[data-latin]")) {
  el.textContent = HyTranslit.transliterate(el.dataset.latin);
}
