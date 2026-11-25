// Settings shared by the content script, popup and background worker.
// Stored in chrome.storage.sync so they follow the user across devices.
(function (root) {
  const HyTranslit = (root.HyTranslit = root.HyTranslit || {});

  const DEFAULTS = {
    enabled: true,
    scheme: "eastern",
    disabledSites: [], // hostnames where conversion is off
  };

  HyTranslit.settings = {
    DEFAULTS,

    load() {
      return chrome.storage.sync.get(DEFAULTS);
    },

    save(patch) {
      return chrome.storage.sync.set(patch);
    },

    isActiveOn(settings, hostname) {
      return settings.enabled && !settings.disabledSites.includes(hostname);
    },

    onChange(callback) {
      chrome.storage.onChanged.addListener((_changes, area) => {
        if (area === "sync") HyTranslit.settings.load().then(callback);
      });
    },
  };
})(globalThis);
