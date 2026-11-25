// Run: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");

require("../src/engine/rules.js");
require("../src/engine/dictionary.js");
const { transliterateWord, transliterate } = require("../src/engine/translit.js");

const cases = {
  // basics
  barev: "բարև",
  Barev: "Բարև",
  BAREV: "ԲԱՐԵՎ",
  inch: "ինչ",
  ka: "կա",
  chka: "չկա",
  vonc: "ոնց",
  shat: "շատ",
  lav: "լավ",
  jan: "ջան",
  hayastan: "հայաստան",
  hayeren: "հայերեն",
  axper: "ախպեր",
  akhper: "ախպեր",
  qez: "քեզ",
  menq: "մենք",
  sirum: "սիրում",
  em: "եմ",
  du: "դու",
  u: "ու",
  ur: "ուր",
  gnacinq: "գնացինք",
  // word start
  es: "ես",
  yes: "ես",
  Yerevan: "Երևան",
  vor: "որ",
  voch: "ոչ",
  or: "օր",
  ogni: "օգնի",
  ev: "և",
  Ev: "Եվ",
  yev: "և",
  // word end
  shnorhakalutyun: "շնորհակալություն",
  // digraphs / alternates
  zhamanak: "ժամանակ",
  ghazar: "ղազար",
  dzayn: "ձայն",
  barr: "բառ",
  "@nker": "ընկեր",
  "t'iv": "թիվ",
  "p'oxel": "փոխել",
  "ch'ash": "ճաշ",
  "ts'ov": "ծով",
  "e'j": "էջ",
  // dictionary
  e: "է",
  el: "էլ",
  che: "չէ",
  ete: "եթե",
  aysor: "այսօր",
  ov: "ով",
  kez: "քեզ",
  Evropa: "Եվրոպա",
};

for (const [latin, armenian] of Object.entries(cases)) {
  test(`${latin} → ${armenian}`, () => {
    assert.equal(transliterateWord(latin), armenian);
  });
}

test("converts whole sentences and keeps punctuation", () => {
  assert.equal(transliterate("Barev, vonc es?"), "Բարև, ոնց ես?");
  assert.equal(transliterate("inch ka chka 123"), "ինչ կա չկա 123");
});

test("unknown characters pass through", () => {
  assert.equal(transliterateWord("'"), "'");
});
