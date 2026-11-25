# Armenian Translit — Chrome extension

Type Armenian with English letters in any text field: `Barev, vonc es?` becomes
`Բարև, ոնց ես?` as you type. Each word converts when you type a space,
punctuation, Enter or Tab.

## Install (unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and pick this folder

## Using it

- **On/off:** click the toolbar icon, or press `Alt+Shift+H`. The orange `Հ`
  badge shows it's on. Change the shortcut at `chrome://extensions/shortcuts`.
- **Turn off for one site:** use the "On this site" switch in the popup.
- **Keep an English word:** press Backspace right after it converts. The word
  goes back to Latin and stays that way. `Ctrl+Z` also works.
- **Choose the other letter:** add `'` after a letter (`t` → տ, `t'` → թ).
  The popup has a cheat sheet and a box to try things out.

Words after a digit, `.`, `/`, `_` and similar are skipped, so URLs, file names
and emails mostly stay as you type them. Password, email, URL and number fields
are never touched.

## How it's built

```
src/
  engine/              pure JS, no DOM: runs in the page, the popup and Node
    rules.js           letter rules as data (one list per scheme)
    dictionary.js      whole-word exceptions the rules get wrong
    translit.js        the transliterator (longest match + word start/end rules)
  shared/settings.js   chrome.storage.sync settings used everywhere
  content/content.js   text field handling: finds the word before the caret
  popup/               on/off switches, try-it box, cheat sheet
  background.js        hotkey + badge
tests/                 engine tests
scripts/
  build.sh             makes the Web Store ZIP (runs tests first)
  screenshots.mjs      renders store images with headless Chrome
store/
  listing.md           every Web Store field, ready to paste + checklist
  privacy-policy.md    privacy policy (host it at a public URL)
  screenshots-src/     HTML sources of the store images
  images/              rendered screenshots and promo tile
```

Words are replaced with `document.execCommand("insertText")`, so the page's undo
history works and frameworks like React see a normal input event.

## Improving the conversion

- **A word converts wrong:** add it to `src/engine/dictionary.js`, then add a
  test case in `tests/translit.test.js`.
- **A pattern converts wrong:** add a rule to `src/engine/rules.js`. Rules can
  apply only at the word start (`at: "start"`) or end (`at: "end"`).
- **A new scheme (e.g. Western Armenian):** add a rule list in `rules.js` and a
  dictionary under the same name, then set `scheme` in the settings.

Run the tests with `npm test` (Node 18+, no dependencies).

## Publishing to the Chrome Web Store

1. Bump `version` in `manifest.json` (the Store rejects a version it has seen).
2. `npm run build` → `dist/armenian-translit-<version>.zip`
3. If the popup or texts changed: `npm run screenshots`
4. Follow `store/listing.md`

## Known limits

- Google Docs and other canvas-based editors don't use normal text fields, so
  they don't work.
- The last word isn't converted if you click a Send button without typing a
  space or Enter first.
- `@` at the start of a word is `ը`, so `@mentions` get converted. Backspace
  undoes it.
