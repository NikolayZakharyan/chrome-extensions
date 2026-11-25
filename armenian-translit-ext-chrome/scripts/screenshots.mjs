// Renders the Chrome Web Store images from store/screenshots-src/*.html
// into store/images/ using headless Chrome. No npm dependencies.
//
//   npm run screenshots            (set CHROME=/path/to/chrome if needed)
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "store/screenshots-src");
const outDir = join(root, "store/images");

const SHOTS = [
  { page: "1-typing.html", out: "screenshot-1-typing.png", width: 1280, height: 800 },
  { page: "2-popup.html", out: "screenshot-2-popup.png", width: 1280, height: 800 },
  { page: "3-tips.html", out: "screenshot-3-tips.png", width: 1280, height: 800 },
  { page: "promo-tile.html", out: "promo-tile-440x280.png", width: 440, height: 280 },
];

// Runs in every frame before page scripts. Gives the real popup the
// chrome.* APIs it needs, with demo values.
const POPUP_STUB = `
  if (location.pathname.endsWith("/src/popup/popup.html")) {
    window.chrome = {
      storage: {
        sync: { get: async (d) => ({ ...d }), set: async () => {} },
        onChanged: { addListener() {} },
      },
      tabs: { query: async () => [{ url: "https://example.com/" }] },
      commands: { getAll: async () => [{ name: "toggle-translit", shortcut: "Alt+Shift+H" }] },
    };
    addEventListener("load", () => setTimeout(() => {
      const box = document.getElementById("try");
      box.value = "Barev, vonc es?";
      box.dispatchEvent(new Event("input"));
      box.blur();
    }, 50));
  }
`;

const chromeBin = process.env.CHROME || "google-chrome";
const port = 9400 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "store-shots-"));
const chrome = spawn(chromeBin, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--allow-file-access-from-files",
  "--hide-scrollbars",
  "--no-first-run",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome did not start");
}

let failed = false;
try {
  const ws = new WebSocket(await connect());
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === "Runtime.exceptionThrown") {
      failed = true;
      console.error("  page error:", msg.params.exceptionDetails.exception?.description);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      failed = true;
      console.error("  console error:", msg.params.args.map((a) => a.value ?? a.description).join(" "));
    }
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, (msg) => r(msg.result));
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: POPUP_STUB });

  for (const shot of SHOTS) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: false,
    });
    await send("Page.navigate", { url: pathToFileURL(join(srcDir, shot.page)).href });
    await sleep(1000); // load, fonts, popup demo text
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(outDir, shot.out), Buffer.from(data, "base64"));
    console.log(`store/images/${shot.out}  ${shot.width}x${shot.height}`);
  }
  ws.close();
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}

if (failed) {
  console.error("Some pages reported errors (see above).");
  process.exit(1);
}
