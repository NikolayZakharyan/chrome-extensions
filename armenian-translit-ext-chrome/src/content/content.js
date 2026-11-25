// Watches text fields on the page and converts the word before the caret
// when the user types a word boundary (space, punctuation, Enter, Tab).
//
// Backspace right after a conversion puts the Latin word back, and that
// word is then left alone — handy for English words and names.
(() => {
  const T = globalThis.HyTranslit;
  if (!T || T.contentLoaded) return;
  T.contentLoaded = true;

  // Keys that end a word. Printable ones can be undone with Backspace.
  const PRINTABLE_BOUNDARIES = new Set([" ", ".", ",", "!", "?", ";", ":", ")", "(", '"', "-"]);
  const OTHER_BOUNDARIES = new Set(["Enter", "Tab"]);
  const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);
  const TEXT_INPUT_TYPES = new Set(["text", "search", ""]);

  // A word right after one of these is likely a URL, path, file name or
  // number ("site.com", "a/b", "v2"), so it is not converted.
  const SKIP_AFTER = /[0-9_./\\:=&%~+]/;

  let settings = { ...T.settings.DEFAULTS };
  let active = false;

  // Last conversion, so Backspace can undo it.
  let last = null; // { el, latin, armenian, key }
  // Word the user reverted; don't convert it again on the next boundary.
  let keepLatin = null; // { el, word }

  function applySettings(s) {
    settings = s;
    active = T.settings.isActiveOn(s, location.hostname);
  }
  T.settings.load().then(applySettings);
  T.settings.onChange(applySettings);

  function isTextField(el) {
    if (el instanceof HTMLTextAreaElement) return true;
    return el instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(el.type);
  }

  // insertText keeps the page's undo history and fires normal input events,
  // so frameworks like React and rich editors see the change.
  function insertText(doc, text) {
    return doc.execCommand("insertText", false, text);
  }

  /**
   * What's before the caret, plus a way to replace the last `len`
   * characters of it. Returns null when the caret isn't somewhere we can edit.
   */
  function caretContext(target) {
    if (isTextField(target)) {
      const el = target;
      const pos = el.selectionStart;
      if (pos == null || pos !== el.selectionEnd) return null;
      return {
        el,
        before: el.value.slice(0, pos),
        replace(len, text) {
          el.setSelectionRange(pos - len, pos);
          if (!insertText(el.ownerDocument, text)) {
            el.setRangeText(text, pos - len, pos, "end");
            el.dispatchEvent(new Event("input", { bubbles: true }));
          }
        },
      };
    }

    if (!target.isContentEditable) return null;
    const doc = target.ownerDocument;
    const sel = doc.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;

    let node = sel.anchorNode;
    let offset = sel.anchorOffset;
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      const prev = node.childNodes[offset - 1];
      if (!prev || prev.nodeType !== Node.TEXT_NODE) return null;
      node = prev;
      offset = prev.data.length;
    }
    if (!node || node.nodeType !== Node.TEXT_NODE) return null;

    return {
      el: target,
      before: node.data.slice(0, offset),
      replace(len, text) {
        const range = doc.createRange();
        range.setStart(node, offset - len);
        range.setEnd(node, offset);
        sel.removeAllRanges();
        sel.addRange(range);
        insertText(doc, text);
      },
    };
  }

  function shouldConvert(word, charBefore) {
    if (charBefore && SKIP_AFTER.test(charBefore)) return false;
    // "@" only means ը at the start of a word; elsewhere it's an email.
    if (word.indexOf("@", 1) !== -1) return false;
    return /[A-Za-z@]/.test(word);
  }

  function convertWordBeforeCaret(ctx, key) {
    const match = ctx.before.match(T.WORD_AT_END_RE);
    if (!match) return;
    const word = match[0];

    if (keepLatin && keepLatin.el === ctx.el && keepLatin.word === word) {
      keepLatin = null;
      return;
    }
    keepLatin = null;

    const charBefore = ctx.before[ctx.before.length - word.length - 1];
    if (!shouldConvert(word, charBefore)) return;

    const armenian = T.transliterateWord(word, { scheme: settings.scheme });
    if (armenian === word) return;

    ctx.replace(word.length, armenian);
    last = PRINTABLE_BOUNDARIES.has(key) ? { el: ctx.el, latin: word, armenian, key } : null;
  }

  // Backspace right after "Բարև " → "barev" (boundary removed too).
  function undoLastConversion(ctx, conversion) {
    const { latin, armenian, key } = conversion;
    const tail = armenian + key;
    // contenteditable often stores a trailing space as a non-breaking space.
    const before = ctx.before.slice(-tail.length).replace(/ /g, " ");
    if (before !== tail) return false;
    ctx.replace(tail.length, latin);
    keepLatin = { el: ctx.el, word: latin };
    return true;
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (!active || e.isComposing || MODIFIER_KEYS.has(e.key)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) {
        last = null;
        return;
      }

      const target = e.composedPath()[0];
      if (!(target instanceof Element)) return;

      if (e.key === "Backspace" && last && last.el === target) {
        const ctx = caretContext(target);
        const conversion = last;
        last = null;
        if (ctx && undoLastConversion(ctx, conversion)) e.preventDefault();
        return;
      }
      last = null;

      if (!PRINTABLE_BOUNDARIES.has(e.key) && !OTHER_BOUNDARIES.has(e.key)) return;
      const ctx = caretContext(target);
      // Convert before the browser inserts the boundary character, so the
      // caret naturally ends up after it.
      if (ctx) convertWordBeforeCaret(ctx, e.key);
    },
    true
  );

  // Moving the caret with the mouse makes Backspace undo unsafe.
  window.addEventListener("mousedown", () => (last = null), true);
})();
