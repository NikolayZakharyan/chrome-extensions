# Chrome Web Store submission

Everything to paste into the Developer Dashboard
(https://chrome.google.com/webstore/devconsole), field by field.

## Checklist

- [ ] Developer account registered (one-time fee)
- [ ] Popup, badge and `Alt+Shift+H` checked in real Chrome (load unpacked)
- [ ] One real Facebook post written with it
- [ ] `npm run build` → upload `dist/armenian-translit-<version>.zip`
- [ ] Store listing tab filled (below)
- [ ] Privacy tab filled (below)
- [ ] Privacy policy hosted at a public URL (`store/privacy-policy.md`)
- [ ] Submit for review

---

## Package tab

Upload `dist/armenian-translit-1.0.0.zip` (made by `npm run build`).

## Store listing tab

**Title** (from the manifest): Armenian Translit

**Summary** (from the manifest, max 132 characters):
Type Armenian with English letters: "Barev" becomes "Բարև" as you type.

**Category:** Productivity → Tools

**Language:** English

**Description:**

```
Type Armenian with English letters, on any website.

Write the way you already chat: "Barev, vonc es?" turns into "Բարև, ոնց ես?" as you type. Each word converts the moment you press Space, so you see Armenian right away, in posts, comments, chats, emails and search boxes.

HOW IT WORKS
• Type in Latin letters as usual. Each word turns Armenian when you press Space, Enter or punctuation.
• Common chat spelling just works: sh → շ, ch → չ, zh → ժ, kh or x → խ, gh → ղ, ts or c → ց, dz → ձ, j → ջ, q → ք, u → ու, ev → և, @ → ը.
• Smart word rules: "yes" and "es" → ես, "vor" → որ, "or" → օր, "Yerevan" → Երևան, "shnorhakalutyun" → շնորհակալություն.
• Need the other letter? Add an apostrophe: t' → թ, p' → փ, k' → ք, ch' → ճ, ts' → ծ, e' → է, o' → օ, r' → ռ.
• Capital letters are kept: "Barev" → "Բարև", "BAREV" → "ԲԱՐԵՎ".

KEEP ENGLISH WHEN YOU NEED IT
• Press Backspace right after a word converts and it goes back to English. It won't be converted again.
• Turn conversion on or off anywhere with Alt+Shift+H, or with one click in the popup.
• Turn it off for single websites and keep it on everywhere else.
• Password, email, URL and number fields are never touched. Most web addresses, emails and file names are left as you type them.

PRIVATE BY DESIGN
Everything runs inside your browser. The extension has no server, collects nothing and sends nothing. Your settings sync through your own Chrome account.

The popup includes a try-it box and a full cheat sheet of the letter rules.

Note: Google Docs uses its own drawing surface instead of normal text fields, so it isn't supported.
```

**Graphic assets** (in `store/images/`):

| Field | File |
| --- | --- |
| Store icon (128×128) | `icons/icon128.png` |
| Screenshots (1280×800) | `screenshot-1-typing.png`, `screenshot-2-popup.png`, `screenshot-3-tips.png` |
| Small promo tile (440×280) | `promo-tile-440x280.png` |

Regenerate the images any time with `npm run screenshots`.

## Privacy tab

**Single purpose:**

```
Converts Armenian words typed with Latin letters (transliteration, e.g. "barev") into Armenian script ("բարև") in text fields while the user types.
```

**Permission justifications:**

`storage`
```
Saves the user's settings: whether conversion is on, and the list of websites where the user turned it off. Settings are stored with chrome.storage.sync only.
```

`activeTab`
```
Lets the popup read the current tab's website address when the user opens it, so the "On this site" switch can turn conversion off for that website.
```

Host permission (content script on all URLs)
```
The extension's single purpose is to convert text as the user types in text fields on any website (social networks, chats, email, search). The content script only reacts to the user's own key presses inside editable fields: it looks at the text before the cursor in the field being typed in, finds the word just typed and replaces it. It reads nothing else on the page, and no data leaves the browser.
```

**Remote code:** No, I am not using remote code. (All JavaScript is included in the package.)

**Data usage:** leave every data type unchecked. The extension collects no user data.

Tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** the public URL where `store/privacy-policy.md` is hosted.
