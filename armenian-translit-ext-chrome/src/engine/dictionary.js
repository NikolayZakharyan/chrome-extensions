// Whole-word exceptions: common words the rules get wrong.
// Keys are lowercase Latin, values are lowercase Armenian.
// Checked before the rules, so an entry here always wins.
//
// Only add words the rules can't guess (է vs ե, թ vs տ, օ vs ո, ծ vs ց...).
// When this grows big, move it to a JSON file and load it per scheme.
(function (root) {
  const HyTranslit = (root.HyTranslit = root.HyTranslit || {});

  const eastern = {
    // է
    e: "է",
    el: "էլ",
    che: "չէ",
    ej: "էջ",
    ed: "էդ",
    esor: "էսօր",
    estex: "էստեղ",
    edtex: "էդտեղ",
    entex: "էնտեղ",

    // թ
    ete: "եթե",
    te: "թե",
    tert: "թերթ",
    yot: "յոթ",
    ut: "ութ",
    tox: "թող",
    togh: "թող",
    tiv: "թիվ",
    tvakan: "թվական",

    // ք
    kez: "քեզ",

    // ծ
    tsov: "ծով",

    // օ / ո
    aysor: "այսօր",
    ov: "ով",
    ovqer: "ովքեր",

    // եվ before a consonant (the rules would write և)
    evropa: "եվրոպա",
    yevropa: "եվրոպա",
  };

  HyTranslit.dictionaries = HyTranslit.dictionaries || {};
  HyTranslit.dictionaries.eastern = eastern;

  if (typeof module !== "undefined") module.exports = HyTranslit;
})(globalThis);
