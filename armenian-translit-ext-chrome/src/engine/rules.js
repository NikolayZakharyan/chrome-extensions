// Transliteration rules: Latin "translit" -> Armenian (Eastern, reformed spelling).
//
// Rules are plain data so new schemes (e.g. Western Armenian) can be added
// without touching the engine. Each rule:
//   from  – lowercase Latin sequence to match
//   to    – Armenian output (lowercase)
//   at    – optional position: "start" (word start) or "end" (word end)
//
// The engine always picks the LONGEST matching rule at each position, and
// position-specific rules win over general ones of the same length.
//
// Convention: an apostrophe after a letter picks its "other" Armenian twin
// (t → տ, t' → թ; e → ե, e' → է ...).
(function (root) {
  const HyTranslit = (root.HyTranslit = root.HyTranslit || {});

  const eastern = [
    // --- word start ---------------------------------------------------------
    { from: "yev", to: "և", at: "start" }, // yev → և ("and")
    { from: "ye", to: "ե", at: "start" },  // yes → ես, Yerevan → Երևան
    { from: "vo", to: "ո", at: "start" },  // vor → որ, voch → ոչ
    { from: "o", to: "օ", at: "start" },   // or → օր, ogn → օգն...

    // --- word end -----------------------------------------------------------
    { from: "tyun", to: "թյուն", at: "end" }, // -ություն suffix

    // --- apostrophe twins ---------------------------------------------------
    { from: "ch'", to: "ճ" },
    { from: "ts'", to: "ծ" },
    { from: "c'", to: "ծ" },
    { from: "t'", to: "թ" },
    { from: "p'", to: "փ" },
    { from: "k'", to: "ք" },
    { from: "e'", to: "է" },
    { from: "o'", to: "օ" },
    { from: "r'", to: "ռ" },
    { from: "y'", to: "ը" },

    // --- digraphs -----------------------------------------------------------
    { from: "sh", to: "շ" },
    { from: "ch", to: "չ" },
    { from: "zh", to: "ժ" },
    { from: "kh", to: "խ" },
    { from: "gh", to: "ղ" },
    { from: "ts", to: "ց" },
    { from: "dz", to: "ձ" },
    { from: "rr", to: "ռ" },
    { from: "ev", to: "և" },
    { from: "ou", to: "ու" },

    // --- single letters -----------------------------------------------------
    { from: "a", to: "ա" },
    { from: "b", to: "բ" },
    { from: "c", to: "ց" },
    { from: "d", to: "դ" },
    { from: "e", to: "ե" },
    { from: "f", to: "ֆ" },
    { from: "g", to: "գ" },
    { from: "h", to: "հ" },
    { from: "i", to: "ի" },
    { from: "j", to: "ջ" },
    { from: "k", to: "կ" },
    { from: "l", to: "լ" },
    { from: "m", to: "մ" },
    { from: "n", to: "ն" },
    { from: "o", to: "ո" },
    { from: "p", to: "պ" },
    { from: "q", to: "ք" },
    { from: "r", to: "ր" },
    { from: "s", to: "ս" },
    { from: "t", to: "տ" },
    { from: "u", to: "ու" },
    { from: "v", to: "վ" },
    { from: "w", to: "վ" },
    { from: "x", to: "խ" },
    { from: "y", to: "յ" },
    { from: "z", to: "զ" },
    { from: "@", to: "ը" },
  ];

  HyTranslit.schemes = HyTranslit.schemes || {};
  HyTranslit.schemes.eastern = eastern;

  if (typeof module !== "undefined") module.exports = HyTranslit;
})(globalThis);
