// Service worker: talks to claude.ai and normalizes whatever usage payload it gets back.

const BASE = "https://claude.ai";

// Endpoints are tried in order; the first one that yields recognizable limit
// buckets wins and is remembered so later refreshes go straight to it.
const CANDIDATE_PATHS = [
  "/api/organizations/{org}/usage",
  "/api/organizations/{org}/usage_limits",
  "/api/organizations/{org}/rate_limits",
  "/api/oauth/usage",
  "/api/bootstrap",
];

// ---------------------------------------------------------------- fetching

// Direct fetch from the worker. Works only if the session cookie is sent on
// cross-site requests; if it isn't, we fall back to a claude.ai tab.
async function fetchDirect(path) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { accept: "application/json" },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function findClaudeTab() {
  const tabs = await chrome.tabs.query({ url: "https://claude.ai/*" });
  return tabs.find((t) => t.id != null) || null;
}

// Same-origin fetch executed inside an open claude.ai tab, so the session
// cookie always rides along.
async function fetchViaTab(path) {
  const tab = await findClaudeTab();
  if (!tab) return null;
  const [out] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [path],
    func: async (p) => {
      try {
        const r = await fetch(p, {
          credentials: "include",
          headers: { accept: "application/json" },
        });
        return { ok: r.ok, status: r.status, text: await r.text() };
      } catch (e) {
        return { ok: false, status: 0, text: String(e) };
      }
    },
  });
  return out?.result ?? null;
}

async function getJSON(path) {
  let res = null;
  try {
    res = await fetchDirect(path);
  } catch {
    res = null;
  }
  // 401/403 usually means the cookie was dropped, not that we're logged out.
  if (!res || !res.ok || res.status === 401 || res.status === 403) {
    const viaTab = await fetchViaTab(path);
    if (viaTab) res = viaTab;
  }
  if (!res) throw new Error("network error");
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  try {
    return JSON.parse(res.text);
  } catch {
    throw new Error("non-JSON response");
  }
}

async function getOrgId() {
  const stored = await chrome.storage.local.get("orgId");
  if (stored.orgId) return stored.orgId;
  const orgs = await getJSON("/api/organizations");
  const list = Array.isArray(orgs) ? orgs : orgs?.organizations || [];
  const org = list.find((o) => o?.uuid || o?.id);
  const orgId = org?.uuid || org?.id;
  if (!orgId) throw new Error("no organization found");
  await chrome.storage.local.set({ orgId });
  return orgId;
}

// -------------------------------------------------------------- normalizing

const PCT_KEYS = /^(utilization|percent_used|percentage_used|percent|pct|used_percent)$/i;
const USED_KEYS = /^(used|usage|consumed|used_tokens|tokens_used|count)$/i;
const LIMIT_KEYS = /^(limit|total|max|allowed|quota|cap|limit_tokens)$/i;
const REMAIN_KEYS = /^(remaining|left|remaining_tokens)$/i;
const RESET_KEYS = /reset/i;

const LABELS = [
  [/five_hour|5h|session|current_session/i, "Current session"],
  [/seven_day_opus|weekly_opus|opus/i, "Weekly (Opus)"],
  [/seven_day|7d|weekly|week/i, "Weekly (all models)"],
  [/monthly|month/i, "Monthly"],
  [/daily|day/i, "Daily"],
];

function prettyLabel(pathKeys) {
  const joined = pathKeys.join(" ");
  for (const [re, label] of LABELS) if (re.test(joined)) return label;
  const last = pathKeys[pathKeys.length - 1] || "Usage";
  return last.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toMillis(v) {
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v; // seconds vs ms
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

const NAME_KEYS = /^(name|type|key|label|window|period|scope|model)$/i;

function bucketFrom(obj, pathKeys) {
  let pct = null;
  let nameHint = null;
  let resetsAt = null;
  let used = null;
  let limit = null;
  let remaining = null;

  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number") {
      if (PCT_KEYS.test(k)) pct = v <= 1 ? v * 100 : v;
      else if (USED_KEYS.test(k)) used = v;
      else if (LIMIT_KEYS.test(k)) limit = v;
      else if (REMAIN_KEYS.test(k)) remaining = v;
    }
    if (typeof v === "string" && NAME_KEYS.test(k) && nameHint == null) nameHint = v;
    if (RESET_KEYS.test(k) && resetsAt == null) resetsAt = toMillis(v);
  }

  if (pct == null && limit != null && limit > 0) {
    if (used != null) pct = (used / limit) * 100;
    else if (remaining != null) pct = ((limit - remaining) / limit) * 100;
  }
  if (pct == null) return null;

  // A `name` on the bucket itself beats an array index from the path.
  const labelKeys = nameHint ? pathKeys.concat(nameHint) : pathKeys;
  return {
    label: prettyLabel(labelKeys),
    key: pathKeys.join("."),
    pct: Math.max(0, Math.min(100, pct)),
    resetsAt,
    used,
    limit,
  };
}

// Walks the whole payload and picks out every node that looks like a limit
// bucket, so the popup keeps working if the response shape shifts.
function extractBuckets(data) {
  const found = [];
  const seen = new Set();

  (function walk(node, pathKeys, depth) {
    if (!node || typeof node !== "object" || depth > 8) return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, pathKeys.concat(String(i)), depth + 1));
      return;
    }
    const b = bucketFrom(node, pathKeys);
    if (b && !seen.has(b.key)) {
      seen.add(b.key);
      found.push(b);
    }
    for (const [k, v] of Object.entries(node)) {
      if (v && typeof v === "object") walk(v, pathKeys.concat(k), depth + 1);
    }
  })(data, [], 0);

  const rank = (b) => {
    const i = LABELS.findIndex(([re]) => re.test(b.key) || re.test(b.label));
    return i === -1 ? LABELS.length : i;
  };
  return found.sort((a, b) => rank(a) - rank(b));
}

// ------------------------------------------------------------------- entry

async function loadUsage() {
  const orgId = await getOrgId();
  const stored = await chrome.storage.local.get("goodPath");
  const paths = stored.goodPath
    ? [stored.goodPath, ...CANDIDATE_PATHS]
    : CANDIDATE_PATHS;

  const errors = [];
  for (const template of paths) {
    const path = template.replace("{org}", orgId);
    let data;
    try {
      data = await getJSON(path);
    } catch (e) {
      errors.push(`${path}: ${e.message}`);
      if (e.status === 401 || e.status === 403) throw e; // logged out; stop early
      continue;
    }
    const buckets = extractBuckets(data);
    if (buckets.length) {
      await chrome.storage.local.set({ goodPath: template });
      return { buckets, source: path, raw: data, fetchedAt: Date.now() };
    }
    errors.push(`${path}: no limit fields`);
  }
  const err = new Error("Could not read usage from any known endpoint.");
  err.detail = errors.join("\n");
  throw err;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "getUsage") return;
  (async () => {
    try {
      const result = await loadUsage();
      await chrome.storage.local.set({ lastResult: result });
      sendResponse({ ok: true, result });
    } catch (e) {
      const cached = (await chrome.storage.local.get("lastResult")).lastResult;
      sendResponse({
        ok: false,
        error: e.message,
        detail: e.detail || null,
        status: e.status || null,
        cached: cached || null,
      });
    }
  })();
  return true; // async response
});
