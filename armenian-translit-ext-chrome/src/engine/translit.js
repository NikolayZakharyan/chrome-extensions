// Transliteration engine. Pure functions, no DOM — runs in the content
// script, the popup, and Node tests alike.
(function (root) {
  const HyTranslit = (root.HyTranslit = root.HyTranslit || {});

  const DEFAULT_SCHEME = "eastern";

  // Characters that can be part of a translit word.
  const WORD_CHARS = "A-Za-z'@";
  const WORD_RE = new RegExp(`[${WORD_CHARS}]+`, "g");
  const WORD_AT_END_RE = new RegExp(`[${WORD_CHARS}]+$`);

  // Rules sorted for matching: longest first, positional rules before
  // general ones of the same length. Cached per scheme.
  const compiled = {};

  function compile(scheme) {
    if (compiled[scheme]) return compiled[scheme];
    const rules = HyTranslit.schemes && HyTranslit.schemes[scheme];
    if (!rules) throw new Error(`Unknown translit scheme: ${scheme}`);
    const sorted = rules.slice().sort((a, b) => {
      if (b.from.length !== a.from.length) return b.from.length - a.from.length;
      return (b.at ? 1 : 0) - (a.at ? 1 : 0);
    });
    return (compiled[scheme] = sorted);
  }

  function matchAt(rules, lower, i) {
    for (const rule of rules) {
      if (rule.at === "start" && i !== 0) continue;
      if (rule.at === "end" && i + rule.from.length !== lower.length) continue;
      if (lower.startsWith(rule.from, i)) return rule;
    }
    return null;
  }

  // Armenian case helpers. "և" has no single uppercase letter: it becomes
  // "Եվ" at the start of a word and "ԵՎ" in all-caps text.
  function upper(s) {
    return s.replace(/և/g, "ԵՎ").toUpperCase();
  }

  function capitalize(s) {
    if (s.startsWith("և")) return "Եվ" + s.slice(1);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function isUpper(ch) {
    return ch !== ch.toLowerCase();
  }

  function isAllCaps(word) {
    const letters = word.replace(/[^A-Za-z]/g, "");
    return letters.length > 1 && letters === letters.toUpperCase();
  }

  /**
   * Convert one Latin word to Armenian.
   * Unknown characters are kept as they are.
   */
  function transliterateWord(word, options = {}) {
    if (!word) return word;
    const scheme = options.scheme || DEFAULT_SCHEME;
    const lower = word.toLowerCase();
    const allCaps = isAllCaps(word);

    const dictionary = (HyTranslit.dictionaries || {})[scheme] || {};
    if (Object.prototype.hasOwnProperty.call(dictionary, lower)) {
      const hit = dictionary[lower];
      if (allCaps) return upper(hit);
      return isUpper(word[0]) ? capitalize(hit) : hit;
    }

    const rules = compile(scheme);
    let out = "";
    let i = 0;
    while (i < lower.length) {
      const rule = matchAt(rules, lower, i);
      if (!rule) {
        out += word[i];
        i += 1;
        continue;
      }
      let piece = rule.to;
      if (allCaps) piece = upper(piece);
      else if (isUpper(word[i])) piece = capitalize(piece);
      out += piece;
      i += rule.from.length;
    }
    return out;
  }

  /** Convert every Latin word in a piece of text. */
  function transliterate(text, options = {}) {
    return text.replace(WORD_RE, (w) => transliterateWord(w, options));
  }

  HyTranslit.WORD_CHARS = WORD_CHARS;
  HyTranslit.WORD_AT_END_RE = WORD_AT_END_RE;
  HyTranslit.transliterateWord = transliterateWord;
  HyTranslit.transliterate = transliterate;

  if (typeof module !== "undefined") module.exports = HyTranslit;
})(globalThis);
