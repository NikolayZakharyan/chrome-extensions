const content = document.getElementById("content");
const updated = document.getElementById("updated");
const refreshBtn = document.getElementById("refresh");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function formatReset(ms) {
  if (!ms) return null;
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Resets ${time}`;
  const day = d.toLocaleDateString([], { weekday: "short" });
  return `Resets ${day} ${time}`;
}

function formatAge(ms) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

function renderBuckets(buckets) {
  for (const b of buckets) {
    const row = el("div", "row");
    const top = el("div", "row-top");
    top.append(el("span", "row-label", b.label));

    const track = el("div", "track");
    const fill = el("div", "fill");
    fill.style.width = `${b.pct}%`;
    track.append(fill);
    top.append(track);

    top.append(el("span", "row-pct", `${Math.round(b.pct)}% used`));
    row.append(top);

    const sub = formatReset(b.resetsAt);
    if (sub) row.append(el("div", "row-sub", sub));
    content.append(row);
  }
}

function render(result, { stale } = {}) {
  content.textContent = "";
  if (!result.buckets.length) {
    content.append(el("p", "muted", "No usage limits reported."));
  } else {
    renderBuckets(result.buckets);
  }
  updated.textContent = stale
    ? `Cached — ${formatAge(result.fetchedAt)}`
    : `Last updated: ${formatAge(result.fetchedAt)}`;
}

function renderError(res) {
  content.textContent = "";
  const loggedOut = res.status === 401 || res.status === 403;
  content.append(
    el(
      "p",
      "error",
      loggedOut
        ? "Not signed in. Open claude.ai in a tab, sign in, then refresh."
        : res.error
    )
  );
  if (!loggedOut && res.detail) content.append(el("p", "detail", res.detail));
  if (res.cached) {
    content.append(el("p", "muted", "Showing last known values:"));
    renderBuckets(res.cached.buckets);
    updated.textContent = `Cached — ${formatAge(res.cached.fetchedAt)}`;
  } else {
    updated.textContent = "";
  }
}

async function load() {
  refreshBtn.disabled = true;
  content.textContent = "";
  content.append(el("p", "muted", "Loading…"));
  try {
    const res = await chrome.runtime.sendMessage({ type: "getUsage" });
    if (res?.ok) render(res.result);
    else renderError(res || { error: "No response from background worker." });
  } catch (e) {
    renderError({ error: String(e) });
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", load);

document.getElementById("open-settings").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://claude.ai/settings/usage" });
});

// Paint cached values immediately so the popup is never blank, then refresh.
chrome.storage.local.get("lastResult").then(({ lastResult }) => {
  if (lastResult) render(lastResult, { stale: true });
});

load();
