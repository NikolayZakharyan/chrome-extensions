const { settings, transliterate } = globalThis.HyTranslit;

const enabledBox = document.getElementById("enabled");
const siteBox = document.getElementById("site");
const siteRow = document.getElementById("site-row");
const hostLabel = document.getElementById("host");
const tryBox = document.getElementById("try");
const out = document.getElementById("out");
const shortcut = document.getElementById("shortcut");

let current = { ...settings.DEFAULTS };
let hostname = null;

function render() {
  enabledBox.checked = current.enabled;
  siteBox.checked = !current.disabledSites.includes(hostname);
  siteBox.disabled = !current.enabled;
  siteRow.classList.toggle("off", !current.enabled);
  out.textContent = transliterate(tryBox.value, { scheme: current.scheme });
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab.url);
    if (url.protocol === "http:" || url.protocol === "https:") hostname = url.hostname;
  } catch {
    // no URL (e.g. chrome:// pages without access)
  }
  if (hostname) hostLabel.textContent = hostname;
  else siteRow.hidden = true;

  const [command] = (await chrome.commands.getAll()).filter((c) => c.name === "toggle-translit");
  if (command && command.shortcut) shortcut.textContent = command.shortcut;

  current = await settings.load();
  render();
  tryBox.focus();
}

enabledBox.addEventListener("change", async () => {
  current.enabled = enabledBox.checked;
  await settings.save({ enabled: current.enabled });
  render();
});

siteBox.addEventListener("change", async () => {
  const sites = new Set(current.disabledSites);
  if (siteBox.checked) sites.delete(hostname);
  else sites.add(hostname);
  current.disabledSites = [...sites];
  await settings.save({ disabledSites: current.disabledSites });
  render();
});

tryBox.addEventListener("input", render);

init();
