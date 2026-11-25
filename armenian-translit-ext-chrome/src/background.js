// Handles the on/off hotkey and keeps the toolbar badge in sync.
importScripts("shared/settings.js");

const { settings } = globalThis.HyTranslit;

async function updateBadge() {
  const s = await settings.load();
  await chrome.action.setBadgeBackgroundColor({ color: "#d9822b" });
  await chrome.action.setBadgeText({ text: s.enabled ? "Հ" : "" });
  await chrome.action.setTitle({
    title: `Armenian Translit — ${s.enabled ? "on" : "off"}`,
  });
}

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "sync") updateBadge();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-translit") return;
  const s = await settings.load();
  await settings.save({ enabled: !s.enabled });
});
