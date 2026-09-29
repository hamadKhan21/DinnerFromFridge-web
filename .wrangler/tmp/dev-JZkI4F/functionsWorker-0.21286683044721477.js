var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-MYxE7a/functionsWorker-0.21286683044721477.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var STAPLE_RE = /^(salt|oil|olive oil|vegetable oil|cooking oil|sesame oil|mustard oil|pepper|black pepper|white pepper|garlic|onion|onions|red onion|ginger|cumin|cumin seeds|turmeric|paprika|chili powder|chilli powder|chili flakes|red pepper flakes|garam masala|curry powder|coriander|ground coriander|cinnamon|oregano|thyme|whole spices|.*masala|.*spices|.*seasoning|baharat|sumac|star anise|saffron|soy sauce|butter|ghee|sugar|brown sugar|flour|water|broth|stock|chicken broth|vegetable broth|chicken stock|lemon|lime|lemon juice|vinegar|rice vinegar|honey|cornstarch|baking powder|sesame seeds|sesame|cilantro|parsley|mint|basil|green chili|green chilies|chili|dried chili|red chili|curry leaves|ketchup|mayo|mayonnaise|mustard|tomato paste|hot sauce|sriracha)$/i;
function isStaple(name) {
  return STAPLE_RE.test(name.trim().toLowerCase());
}
__name(isStaple, "isStaple");
__name2(isStaple, "isStaple");
function coreIngredients(entry) {
  return entry.i.filter((n) => !isStaple(n));
}
__name(coreIngredients, "coreIngredients");
__name2(coreIngredients, "coreIngredients");
function singular(w) {
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith("oes")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("es") && /(ch|sh|ss|x)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}
__name(singular, "singular");
__name2(singular, "singular");
function normalizeIngredient(name) {
  return name.toLowerCase().replace(/\(.*?\)/g, " ").split(",")[0].replace(/[^a-z\u00c0-\u024f\u0600-\u06ff\s-]/g, " ").replace(/\b(fresh|frozen|cooked|leftover|chopped|diced|sliced|large|small|medium|boneless|skinless|ground|minced|canned|dried|raw|greek|plain|baby|cherry)\b/g, " ").split(/\s+/).filter(Boolean).map(singular).join(" ").trim();
}
__name(normalizeIngredient, "normalizeIngredient");
__name2(normalizeIngredient, "normalizeIngredient");
function ingredientCovers(userItem, recipeIngredient) {
  const a = normalizeIngredient(userItem);
  const b = normalizeIngredient(recipeIngredient);
  if (!a || !b) return false;
  if (a === b) return true;
  const aw = a.split(" ");
  const bw = new Set(b.split(" "));
  if (aw.every((w) => bw.has(w))) return true;
  const bArr = b.split(" ");
  return bArr.length === 1 && aw.includes(bArr[0]) && bArr[0].length > 3;
}
__name(ingredientCovers, "ingredientCovers");
__name2(ingredientCovers, "ingredientCovers");
function matchCatalog(catalog, have, opts = {}) {
  const items = have.map((h) => h.trim()).filter(Boolean);
  const out = [];
  for (const entry of catalog) {
    const core = coreIngredients(entry);
    if (opts.maxCore != null && core.length > opts.maxCore) continue;
    const used = items.filter((h) => entry.i.some((ing) => ingredientCovers(h, ing)));
    if (!used.length) continue;
    if (opts.minUsed != null && used.length < opts.minUsed) continue;
    if (opts.requireAllUsed && used.length < items.length) continue;
    const missingCore = core.filter((ing) => !items.some((h) => ingredientCovers(h, ing)));
    const score = used.length * 10 - missingCore.length * 4 - core.length * 0.5 - Math.min(entry.m, 90) / 60;
    out.push({ entry, used, missingCore, coreCount: core.length, score });
  }
  out.sort((a, b) => b.score - a.score || a.entry.m - b.entry.m);
  return out.slice(0, opts.limit ?? 24);
}
__name(matchCatalog, "matchCatalog");
__name2(matchCatalog, "matchCatalog");
function smallRecipes(catalog, maxCore = 3, limit = 30) {
  const list = catalog.filter((e) => coreIngredients(e).length <= maxCore && coreIngredients(e).length >= 1).sort((a, b) => coreIngredients(a).length - coreIngredients(b).length || a.m - b.m);
  return diversify(list, limit, 1);
}
__name(smallRecipes, "smallRecipes");
__name2(smallRecipes, "smallRecipes");
var CHALLENGE_MAX = 5;
function parseChallengeParam(raw, max = CHALLENGE_MAX) {
  if (!raw) return [];
  const seen = /* @__PURE__ */ new Set();
  const list = [];
  for (const part of raw.split(/[,|]/)) {
    const v = part.replace(/[-_+]/g, " ").replace(/\s+/g, " ").trim().slice(0, 32);
    const key = v.toLowerCase();
    if (!v || seen.has(key)) continue;
    if (/\b(pork|bacon|ham|lard|prosciutto|pancetta|pepperoni|salami)\b/i.test(v)) continue;
    seen.add(key);
    list.push(v);
    if (list.length >= max) break;
  }
  return list;
}
__name(parseChallengeParam, "parseChallengeParam");
__name2(parseChallengeParam, "parseChallengeParam");
function challengeQuery(items) {
  return items.map((s) => s.trim().toLowerCase().split(/\s+/).filter(Boolean).map(encodeURIComponent).join("+")).filter(Boolean).join(",");
}
__name(challengeQuery, "challengeQuery");
__name2(challengeQuery, "challengeQuery");
function joinList(items, and = "and") {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} ${and} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}
__name(joinList, "joinList");
__name2(joinList, "joinList");
function filterHub(catalog, rule, limit = 36) {
  const words = (rule.words || []).map((w) => w.toLowerCase());
  const tags = new Set((rule.tags || []).map((t) => t.toLowerCase()));
  const boost = (rule.boost || []).map((w) => w.toLowerCase());
  const scored = [];
  for (const e of catalog) {
    if (rule.maxMinutes != null && e.m > rule.maxMinutes) continue;
    const hay = `${e.t} ${e.ds}`.toLowerCase();
    const tagHit = e.g.some((t) => tags.has(t));
    const wordHit = words.some((w) => hay.includes(w));
    if (!tagHit && !wordHit) continue;
    let s = (tagHit ? 2 : 0) + (wordHit ? 3 : 0);
    for (const b of boost) if (hay.includes(b)) s += 4;
    s -= e.m / 120;
    scored.push({ e, s });
  }
  scored.sort((a, b) => b.s - a.s || a.e.t.localeCompare(b.e.t));
  return diversify(scored.map((x) => x.e), limit);
}
__name(filterHub, "filterHub");
__name2(filterHub, "filterHub");
function titleFamily(title) {
  const w = title.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  return w.length > 1 ? w.slice(1, 3).join(" ") : w.join(" ");
}
__name(titleFamily, "titleFamily");
__name2(titleFamily, "titleFamily");
function diversify(list, limit, perFamily = 2) {
  const fam = /* @__PURE__ */ new Map();
  const seenTitle = /* @__PURE__ */ new Set();
  const out = [];
  for (const e of list) {
    const k = titleFamily(e.t);
    const n = fam.get(k) ?? 0;
    const tk = e.t.toLowerCase().split(" ").slice(0, 2).join(" ");
    if (n >= perFamily || seenTitle.has(tk)) continue;
    fam.set(k, n + 1);
    seenTitle.add(tk);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}
__name(diversify, "diversify");
__name2(diversify, "diversify");
var HALAL_EXCLUDE = /\b(wine|beer|rum|sake|brandy|bourbon|whisky|whiskey|mirin)\b/i;
var IFTAR = {
  tags: ["soup", "lentils", "chaat", "kebab", "chickpeas"],
  words: ["samosa", "pakora", "haleem", "lentil soup", "shorba", "chaat", "kebab", "falafel", "hummus", "fatteh", "dahi", "harira", "soup", "biryani", "kabsa"],
  boost: ["samosa", "pakora", "haleem", "lentil soup", "chaat", "harira", "falafel", "fatteh"]
};
var SUHOOR = {
  tags: ["breakfast", "eggs"],
  words: ["egg", "shakshuka", "omelette", "bhurji", "yogurt", "oats", "paratha", "foul", "ful ", "labneh"],
  boost: ["shakshuka", "bhurji", "omelette", "oats"],
  maxMinutes: 30
};
var EID_FEAST = {
  words: ["biryani", "korma", "nihari", "haleem", "pulao", "kofta", "mandi", "kabsa", "kebab", "qorma", "karahi", "roast lamb"],
  tags: ["lamb", "mutton", "goat"],
  boost: ["biryani", "korma", "nihari", "mandi", "kabsa"]
};
var EID_LEFTOVER = {
  words: ["wrap", "fried rice", "bowl", "sandwich", "shawarma", "keema", "paratha", "pulao", "kofta"],
  tags: ["bowl", "wrap", "sandwich"],
  maxMinutes: 30,
  boost: ["keema", "shawarma", "wrap", "fried rice"]
};
var DESI_MAIN = {
  tags: ["indian", "pakistani", "bengali", "bangladeshi", "hyderabadi", "karahi", "sindhi", "balochi", "kashmiri", "afghani", "awadhi", "south indian"],
  words: ["karahi", "biryani", "dal", "daal", "sabzi", "aloo", "keema", "tikka", "korma", "nihari", "paneer", "chana", "bhuna", "pulao"],
  boost: ["karahi", "biryani", "daal", "dal ", "aloo", "keema"]
};
var DESI_QUICK = { ...DESI_MAIN, maxMinutes: 30, boost: ["bhurji", "aloo", "keema", "dal"] };
var ARABIC_MAIN = {
  tags: ["arabic", "middle eastern", "levantine", "lebanese", "egyptian", "gulf", "saudi", "yemeni", "palestinian", "jordanian", "iraqi", "moroccan", "north african"],
  words: ["kabsa", "mandi", "shawarma", "hummus", "falafel", "fatteh", "shakshuka", "kofta", "maqluba", "mujadara", "tagine", "harira", "fattoush", "tabbouleh"],
  boost: ["kabsa", "mandi", "shawarma", "maqluba", "fatteh"]
};
var ARABIC_QUICK = { ...ARABIC_MAIN, maxMinutes: 30, boost: ["shakshuka", "hummus", "falafel", "shawarma"] };
var HUBS = [
  {
    slug: "ramadan",
    emoji: "\u{1F319}",
    keywords: "ramadan recipes, iftar ideas, suhoor ideas, sehri recipes, halal dinner, iftar from fridge",
    sections: [
      { key: "iftar", rule: IFTAR },
      { key: "suhoor", rule: SUHOOR }
    ],
    copy: {
      en: {
        title: "Ramadan recipes: iftar & suhoor ideas from your fridge",
        h1: "Ramadan: iftar & suhoor from your fridge",
        intro: "Break your fast with what you already have. Halal, pork-free iftar favourites \u2014 lentil soup, pakoras, kebabs, biryani \u2014 plus quick suhoor ideas that keep you full.",
        sections: {
          iftar: { h: "Iftar from your fridge", p: "Soups, chaat, kebabs and rice dishes for the whole table." },
          suhoor: { h: "Quick suhoor ideas", p: "Ready in 30 minutes or less \u2014 eggs, yogurt and filling bowls." }
        },
        tips: [
          "Cook a big pot of lentil soup on day one \u2014 it keeps for 3 days.",
          "Soak chickpeas or lentils before taraweeh for tomorrow\u2019s iftar.",
          "Leftover rice becomes fried rice or pulao for suhoor."
        ]
      },
      ar: {
        title: "\u0648\u0635\u0641\u0627\u062A \u0631\u0645\u0636\u0627\u0646: \u0623\u0641\u0643\u0627\u0631 \u0644\u0644\u0625\u0641\u0637\u0627\u0631 \u0648\u0627\u0644\u0633\u062D\u0648\u0631 \u0645\u0646 \u062B\u0644\u0627\u062C\u062A\u0643",
        h1: "\u0631\u0645\u0636\u0627\u0646: \u0625\u0641\u0637\u0627\u0631 \u0648\u0633\u062D\u0648\u0631 \u0645\u0646 \u062B\u0644\u0627\u062C\u062A\u0643",
        intro: "\u0623\u0641\u0637\u0631 \u0628\u0645\u0627 \u0644\u062F\u064A\u0643 \u0641\u064A \u0627\u0644\u0628\u064A\u062A. \u0623\u0637\u0628\u0627\u0642 \u0625\u0641\u0637\u0627\u0631 \u062D\u0644\u0627\u0644 \u0648\u062E\u0627\u0644\u064A\u0629 \u0645\u0646 \u0644\u062D\u0645 \u0627\u0644\u062E\u0646\u0632\u064A\u0631 \u2014 \u0634\u0648\u0631\u0628\u0629 \u0627\u0644\u0639\u062F\u0633\u060C \u0627\u0644\u0643\u0628\u0627\u0628\u060C \u0627\u0644\u0628\u0631\u064A\u0627\u0646\u064A \u2014 \u0648\u0623\u0641\u0643\u0627\u0631 \u0633\u062D\u0648\u0631 \u0633\u0631\u064A\u0639\u0629 \u062A\u0634\u0628\u0639\u0643 \u062D\u062A\u0649 \u0627\u0644\u0645\u063A\u0631\u0628.",
        sections: {
          iftar: { h: "\u0625\u0641\u0637\u0627\u0631 \u0645\u0646 \u062B\u0644\u0627\u062C\u062A\u0643", p: "\u0634\u0648\u0631\u0628\u0627\u062A \u0648\u0645\u0642\u0628\u0644\u0627\u062A \u0648\u0643\u0628\u0627\u0628 \u0648\u0623\u0637\u0628\u0627\u0642 \u0623\u0631\u0632 \u0644\u0643\u0644 \u0627\u0644\u0639\u0627\u0626\u0644\u0629." },
          suhoor: { h: "\u0623\u0641\u0643\u0627\u0631 \u0633\u062D\u0648\u0631 \u0633\u0631\u064A\u0639\u0629", p: "\u062C\u0627\u0647\u0632\u0629 \u0641\u064A \u0663\u0660 \u062F\u0642\u064A\u0642\u0629 \u0623\u0648 \u0623\u0642\u0644 \u2014 \u0628\u064A\u0636 \u0648\u0644\u0628\u0646 \u0648\u0623\u0637\u0628\u0627\u0642 \u0645\u0634\u0628\u0639\u0629." }
        },
        tips: [
          "\u0627\u0637\u0628\u062E \u0642\u062F\u0631\u064B\u0627 \u0643\u0628\u064A\u0631\u064B\u0627 \u0645\u0646 \u0634\u0648\u0631\u0628\u0629 \u0627\u0644\u0639\u062F\u0633 \u0641\u064A \u0623\u0648\u0644 \u064A\u0648\u0645 \u2014 \u062A\u0628\u0642\u0649 \u0663 \u0623\u064A\u0627\u0645.",
          "\u0627\u0646\u0642\u0639 \u0627\u0644\u062D\u0645\u0635 \u0623\u0648 \u0627\u0644\u0639\u062F\u0633 \u0642\u0628\u0644 \u0627\u0644\u062A\u0631\u0627\u0648\u064A\u062D \u0644\u0625\u0641\u0637\u0627\u0631 \u0627\u0644\u063A\u062F.",
          "\u0627\u0644\u0623\u0631\u0632 \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u064A\u0635\u0628\u062D \u0623\u0631\u0632\u064B\u0627 \u0645\u0642\u0644\u064A\u064B\u0627 \u0623\u0648 \u0628\u0644\u0627\u0648 \u0644\u0644\u0633\u062D\u0648\u0631."
        ]
      },
      ur: {
        title: "\u0631\u0645\u0636\u0627\u0646 \u06A9\u06CC \u062A\u0631\u06A9\u06CC\u0628\u06CC\u06BA: \u0641\u0631\u06CC\u062C \u0633\u06D2 \u0627\u0641\u0637\u0627\u0631 \u0627\u0648\u0631 \u0633\u062D\u0631\u06CC",
        h1: "\u0631\u0645\u0636\u0627\u0646: \u0641\u0631\u06CC\u062C \u0633\u06D2 \u0627\u0641\u0637\u0627\u0631 \u0627\u0648\u0631 \u0633\u062D\u0631\u06CC",
        intro: "\u062C\u0648 \u06AF\u06BE\u0631 \u0645\u06CC\u06BA \u0645\u0648\u062C\u0648\u062F \u06C1\u06D2 \u0627\u0633\u06CC \u0633\u06D2 \u0631\u0648\u0632\u06C1 \u06A9\u06BE\u0648\u0644\u06CC\u06BA\u06D4 \u062D\u0644\u0627\u0644 \u0627\u0641\u0637\u0627\u0631 \u2014 \u062F\u0627\u0644 \u06A9\u0627 \u0634\u0648\u0631\u0628\u06C1\u060C \u067E\u06A9\u0648\u0691\u06D2\u060C \u06A9\u0628\u0627\u0628\u060C \u0628\u0631\u06CC\u0627\u0646\u06CC \u2014 \u0627\u0648\u0631 \u0633\u062D\u0631\u06CC \u06A9\u06D2 \u0622\u0633\u0627\u0646 \u0622\u0626\u06CC\u0688\u06CC\u0627\u0632 \u062C\u0648 \u062F\u0646 \u0628\u06BE\u0631 \u067E\u06CC\u0679 \u0628\u06BE\u0631\u0627 \u0631\u06A9\u06BE\u06CC\u06BA\u06D4",
        sections: {
          iftar: { h: "\u0641\u0631\u06CC\u062C \u0633\u06D2 \u0627\u0641\u0637\u0627\u0631", p: "\u0634\u0648\u0631\u0628\u06D2\u060C \u0686\u0627\u0679\u060C \u06A9\u0628\u0627\u0628 \u0627\u0648\u0631 \u0686\u0627\u0648\u0644 \u2014 \u067E\u0648\u0631\u06D2 \u062F\u0633\u062A\u0631\u062E\u0648\u0627\u0646 \u06A9\u06D2 \u0644\u06CC\u06D2\u06D4" },
          suhoor: { h: "\u062C\u0644\u062F\u06CC \u0633\u062D\u0631\u06CC", p: "\u06F3\u06F0 \u0645\u0646\u0679 \u06CC\u0627 \u06A9\u0645 \u0645\u06CC\u06BA \u062A\u06CC\u0627\u0631 \u2014 \u0627\u0646\u0688\u06D2\u060C \u062F\u06C1\u06CC \u0627\u0648\u0631 \u067E\u06CC\u0679 \u0628\u06BE\u0631\u0646\u06D2 \u0648\u0627\u0644\u06D2 \u0628\u0627\u0624\u0644\u06D4" }
        },
        tips: [
          "\u067E\u06C1\u0644\u06D2 \u062F\u0646 \u062F\u0627\u0644 \u06A9\u0627 \u0628\u0691\u0627 \u0634\u0648\u0631\u0628\u06C1 \u0628\u0646\u0627\u0626\u06CC\u06BA \u2014 \u06F3 \u062F\u0646 \u0686\u0644\u062A\u0627 \u06C1\u06D2\u06D4",
          "\u062A\u0631\u0627\u0648\u06CC\u062D \u0633\u06D2 \u067E\u06C1\u0644\u06D2 \u06A9\u0644 \u06A9\u06CC \u0627\u0641\u0637\u0627\u0631 \u06A9\u06D2 \u0644\u06CC\u06D2 \u0686\u0646\u06D2 \u06CC\u0627 \u062F\u0627\u0644 \u0628\u06BE\u06AF\u0648 \u062F\u06CC\u06BA\u06D4",
          "\u0628\u0686\u06D2 \u06C1\u0648\u0626\u06D2 \u0686\u0627\u0648\u0644 \u0633\u062D\u0631\u06CC \u0645\u06CC\u06BA \u0641\u0631\u0627\u0626\u06CC\u0688 \u0631\u0627\u0626\u0633 \u06CC\u0627 \u067E\u0644\u0627\u0624 \u0628\u0646 \u062C\u0627\u062A\u06D2 \u06C1\u06CC\u06BA\u06D4"
        ]
      },
      es: {
        title: "Recetas de Ramad\xE1n: ideas de iftar y suhoor con lo que tienes",
        h1: "Ramad\xE1n: iftar y suhoor con lo de tu nevera",
        intro: "Rompe el ayuno con lo que ya tienes. Platos halal y sin cerdo \u2014 sopa de lentejas, pakoras, kebabs, biryani \u2014 y suhoor r\xE1pido que te mantiene saciado.",
        sections: {
          iftar: { h: "Iftar con lo de tu nevera", p: "Sopas, chaat, kebabs y arroces para toda la mesa." },
          suhoor: { h: "Suhoor r\xE1pido", p: "Listo en 30 minutos o menos \u2014 huevos, yogur y bowls saciantes." }
        },
        tips: [
          "Haz una olla grande de sopa de lentejas el primer d\xEDa: dura 3 d\xEDas.",
          "Remoja garbanzos o lentejas antes del taraweeh para el iftar de ma\xF1ana.",
          "El arroz sobrante se convierte en arroz frito o pulao para el suhoor."
        ]
      },
      fr: {
        title: "Recettes du Ramadan : id\xE9es d\u2019iftar et de suhoor avec votre frigo",
        h1: "Ramadan : iftar et suhoor avec votre frigo",
        intro: "Rompez le je\xFBne avec ce que vous avez d\xE9j\xE0. Plats halal et sans porc \u2014 soupe de lentilles, pakoras, kebabs, biryani \u2014 et suhoor rapides et rassasiants.",
        sections: {
          iftar: { h: "Iftar avec votre frigo", p: "Soupes, chaat, kebabs et plats de riz pour toute la table." },
          suhoor: { h: "Suhoor rapides", p: "Pr\xEAts en 30 minutes ou moins \u2014 \u0153ufs, yaourt et bols rassasiants." }
        },
        tips: [
          "Pr\xE9parez une grande soupe de lentilles le premier jour : elle se garde 3 jours.",
          "Faites tremper pois chiches ou lentilles avant les tarawih pour l\u2019iftar du lendemain.",
          "Le riz restant devient riz saut\xE9 ou pulao pour le suhoor."
        ]
      },
      tr: {
        title: "Ramazan tarifleri: buzdolab\u0131ndan iftar ve sahur fikirleri",
        h1: "Ramazan: buzdolab\u0131ndan iftar ve sahur",
        intro: "Orucunu evdekilerle a\xE7. Helal, domuz \xFCr\xFCns\xFCz iftar klasikleri \u2014 mercimek \xE7orbas\u0131, pakora, kebap, biryani \u2014 ve tok tutan h\u0131zl\u0131 sahur fikirleri.",
        sections: {
          iftar: { h: "Buzdolab\u0131ndan iftar", p: "\xC7orbalar, mezeler, kebaplar ve pilavlar \u2014 t\xFCm sofra i\xE7in." },
          suhoor: { h: "H\u0131zl\u0131 sahur fikirleri", p: "30 dakikada haz\u0131r \u2014 yumurta, yo\u011Furt ve doyurucu kaseler." }
        },
        tips: [
          "\u0130lk g\xFCn b\xFCy\xFCk bir tencere mercimek \xE7orbas\u0131 yap \u2014 3 g\xFCn dayan\u0131r.",
          "Yar\u0131n\u0131n iftar\u0131 i\xE7in teravihten \xF6nce nohut ya da mercime\u011Fi \u0131slat.",
          "Artan pilav sahurda k\u0131zarm\u0131\u015F pilava d\xF6n\xFC\u015F\xFCr."
        ]
      }
    }
  },
  {
    slug: "eid",
    emoji: "\u{1F389}",
    keywords: "eid recipes, eid leftovers, eid ul adha meat recipes, eid dinner, leftover biryani, leftover lamb",
    sections: [
      { key: "feast", rule: EID_FEAST },
      { key: "leftovers", rule: EID_LEFTOVER }
    ],
    copy: {
      en: {
        title: "Eid recipes & Eid leftovers: feast dishes and next-day dinners",
        h1: "Eid: feast dishes & leftover makeovers",
        intro: "Biryani, korma, kebabs and mandi for the Eid table \u2014 then quick ways to turn leftover meat and rice into tomorrow\u2019s dinner. Halal, no pork.",
        sections: {
          feast: { h: "Eid feast dishes", p: "Big-pot favourites for family and guests." },
          leftovers: { h: "Eid leftovers \u2192 dinner", p: "Leftover meat or rice? Wraps, keema and fried rice in 30 minutes." }
        },
        tips: [
          "Eid ul Adha meat: freeze in 500 g bags so each bag is one dinner.",
          "Shred leftover roast or kebab into wraps with yogurt sauce.",
          "Leftover biryani reheats best with a splash of water and a lid."
        ]
      },
      ar: {
        title: "\u0648\u0635\u0641\u0627\u062A \u0627\u0644\u0639\u064A\u062F \u0648\u0628\u0642\u0627\u064A\u0627 \u0627\u0644\u0639\u064A\u062F: \u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u0648\u0644\u064A\u0645\u0629 \u0648\u0639\u0634\u0627\u0621 \u0627\u0644\u064A\u0648\u0645 \u0627\u0644\u062A\u0627\u0644\u064A",
        h1: "\u0627\u0644\u0639\u064A\u062F: \u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u0648\u0644\u064A\u0645\u0629 \u0648\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0628\u0642\u0627\u064A\u0627",
        intro: "\u0628\u0631\u064A\u0627\u0646\u064A \u0648\u0643\u0628\u0627\u0628 \u0648\u0645\u0646\u062F\u064A \u0648\u0643\u0628\u0633\u0629 \u0644\u0645\u0627\u0626\u062F\u0629 \u0627\u0644\u0639\u064A\u062F \u2014 \u062B\u0645 \u0637\u0631\u0642 \u0633\u0631\u064A\u0639\u0629 \u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0644\u062D\u0645 \u0648\u0627\u0644\u0623\u0631\u0632 \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0625\u0644\u0649 \u0639\u0634\u0627\u0621 \u0627\u0644\u063A\u062F. \u062D\u0644\u0627\u0644 \u0648\u0628\u062F\u0648\u0646 \u0644\u062D\u0645 \u062E\u0646\u0632\u064A\u0631.",
        sections: {
          feast: { h: "\u0623\u0637\u0628\u0627\u0642 \u0648\u0644\u064A\u0645\u0629 \u0627\u0644\u0639\u064A\u062F", p: "\u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u0642\u062F\u0631 \u0627\u0644\u0643\u0628\u064A\u0631 \u0644\u0644\u0639\u0627\u0626\u0644\u0629 \u0648\u0627\u0644\u0636\u064A\u0648\u0641." },
          leftovers: { h: "\u0628\u0642\u0627\u064A\u0627 \u0627\u0644\u0639\u064A\u062F \u2190 \u0639\u0634\u0627\u0621", p: "\u0644\u062D\u0645 \u0623\u0648 \u0623\u0631\u0632 \u0645\u062A\u0628\u0642\u064D\u061F \u0644\u0641\u0627\u0626\u0641 \u0648\u0643\u064A\u0645\u0629 \u0648\u0623\u0631\u0632 \u0645\u0642\u0644\u064A \u0641\u064A \u0663\u0660 \u062F\u0642\u064A\u0642\u0629." }
        },
        tips: [
          "\u0644\u062D\u0645 \u0627\u0644\u0623\u0636\u062D\u0649: \u062C\u0645\u0651\u062F\u0647 \u0641\u064A \u0623\u0643\u064A\u0627\u0633 \u0665\u0660\u0660 \u063A\u060C \u0643\u0644 \u0643\u064A\u0633 \u0639\u0634\u0627\u0621 \u0648\u0627\u062D\u062F.",
          "\u0642\u0637\u0651\u0639 \u0627\u0644\u0644\u062D\u0645 \u0627\u0644\u0645\u0634\u0648\u064A \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0641\u064A \u0644\u0641\u0627\u0626\u0641 \u0645\u0639 \u0635\u0644\u0635\u0629 \u0627\u0644\u0644\u0628\u0646.",
          "\u064A\u0633\u062E\u0646 \u0627\u0644\u0628\u0631\u064A\u0627\u0646\u064A \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0628\u0634\u0643\u0644 \u0623\u0641\u0636\u0644 \u0645\u0639 \u0642\u0644\u064A\u0644 \u0645\u0646 \u0627\u0644\u0645\u0627\u0621 \u0648\u063A\u0637\u0627\u0621."
        ]
      },
      ur: {
        title: "\u0639\u06CC\u062F \u06A9\u06CC \u062A\u0631\u06A9\u06CC\u0628\u06CC\u06BA \u0627\u0648\u0631 \u0639\u06CC\u062F \u06A9\u0627 \u0628\u0686\u0627 \u06C1\u0648\u0627 \u06A9\u06BE\u0627\u0646\u0627",
        h1: "\u0639\u06CC\u062F: \u062F\u0639\u0648\u062A \u06A9\u06D2 \u067E\u06A9\u0648\u0627\u0646 \u0627\u0648\u0631 \u0628\u0686\u06D2 \u06A9\u06BE\u0627\u0646\u06D2 \u06A9\u0627 \u0646\u06CC\u0627 \u0631\u0648\u067E",
        intro: "\u0639\u06CC\u062F \u06A9\u06D2 \u062F\u0633\u062A\u0631\u062E\u0648\u0627\u0646 \u06A9\u06D2 \u0644\u06CC\u06D2 \u0628\u0631\u06CC\u0627\u0646\u06CC\u060C \u0642\u0648\u0631\u0645\u06C1\u060C \u06A9\u0628\u0627\u0628 \u0627\u0648\u0631 \u0645\u0646\u062F\u06CC \u2014 \u067E\u06BE\u0631 \u0628\u0686\u06D2 \u06C1\u0648\u0626\u06D2 \u06AF\u0648\u0634\u062A \u0627\u0648\u0631 \u0686\u0627\u0648\u0644 \u0633\u06D2 \u0627\u06AF\u0644\u06D2 \u062F\u0646 \u06A9\u0627 \u062C\u0644\u062F\u06CC \u06A9\u06BE\u0627\u0646\u0627\u06D4 \u062D\u0644\u0627\u0644\u060C \u0628\u063A\u06CC\u0631 \u0633\u0648\u0631 \u06A9\u06D2 \u06AF\u0648\u0634\u062A \u06A9\u06D2\u06D4",
        sections: {
          feast: { h: "\u0639\u06CC\u062F \u06A9\u06CC \u062F\u0639\u0648\u062A \u06A9\u06D2 \u067E\u06A9\u0648\u0627\u0646", p: "\u06AF\u06BE\u0631 \u0648\u0627\u0644\u0648\u06BA \u0627\u0648\u0631 \u0645\u06C1\u0645\u0627\u0646\u0648\u06BA \u06A9\u06D2 \u0644\u06CC\u06D2 \u0628\u0691\u06CC \u062F\u06CC\u06AF \u06A9\u06D2 \u067E\u0633\u0646\u062F\u06CC\u062F\u06C1 \u06A9\u06BE\u0627\u0646\u06D2\u06D4" },
          leftovers: { h: "\u0639\u06CC\u062F \u06A9\u0627 \u0628\u0686\u0627 \u06A9\u06BE\u0627\u0646\u0627 \u2190 \u0688\u0646\u0631", p: "\u06AF\u0648\u0634\u062A \u06CC\u0627 \u0686\u0627\u0648\u0644 \u0628\u0686 \u06AF\u0626\u06D2\u061F \u0631\u0648\u0644\u060C \u0642\u06CC\u0645\u06C1 \u0627\u0648\u0631 \u0641\u0631\u0627\u0626\u06CC\u0688 \u0631\u0627\u0626\u0633 \u06F3\u06F0 \u0645\u0646\u0679 \u0645\u06CC\u06BA\u06D4" }
        },
        tips: [
          "\u0642\u0631\u0628\u0627\u0646\u06CC \u06A9\u0627 \u06AF\u0648\u0634\u062A \u06F5\u06F0\u06F0 \u06AF\u0631\u0627\u0645 \u06A9\u06CC \u062A\u06BE\u06CC\u0644\u06CC\u0648\u06BA \u0645\u06CC\u06BA \u0641\u0631\u06CC\u0632 \u06A9\u0631\u06CC\u06BA \u2014 \u06C1\u0631 \u062A\u06BE\u06CC\u0644\u06CC \u0627\u06CC\u06A9 \u0688\u0646\u0631\u06D4",
          "\u0628\u0686\u06D2 \u06C1\u0648\u0626\u06D2 \u06A9\u0628\u0627\u0628 \u06CC\u0627 \u0631\u0648\u0633\u0679 \u06A9\u0648 \u062F\u06C1\u06CC \u06A9\u06CC \u0686\u0679\u0646\u06CC \u06A9\u06D2 \u0633\u0627\u062A\u06BE \u0631\u0648\u0644 \u0645\u06CC\u06BA \u0688\u0627\u0644\u06CC\u06BA\u06D4",
          "\u0628\u0686\u06CC \u0628\u0631\u06CC\u0627\u0646\u06CC \u062A\u06BE\u0648\u0691\u0627 \u067E\u0627\u0646\u06CC \u0688\u0627\u0644 \u06A9\u0631 \u0688\u06BE\u06A9 \u06A9\u0631 \u06AF\u0631\u0645 \u06A9\u0631\u06CC\u06BA\u06D4"
        ]
      },
      es: {
        title: "Recetas de Eid y sobras de Eid: platos de fiesta y cenas del d\xEDa siguiente",
        h1: "Eid: platos de fiesta y sobras renovadas",
        intro: "Biryani, korma, kebabs y mandi para la mesa de Eid, y formas r\xE1pidas de convertir la carne y el arroz sobrantes en la cena de ma\xF1ana. Halal, sin cerdo.",
        sections: {
          feast: { h: "Platos de fiesta de Eid", p: "Favoritos de olla grande para familia e invitados." },
          leftovers: { h: "Sobras de Eid \u2192 cena", p: "\xBFSobr\xF3 carne o arroz? Wraps, keema y arroz frito en 30 minutos." }
        },
        tips: [
          "Carne de Eid al-Adha: cong\xE9lala en bolsas de 500 g, una bolsa por cena.",
          "Desmenuza el asado o kebab sobrante en wraps con salsa de yogur.",
          "El biryani sobrante se recalienta mejor con un chorrito de agua y tapa."
        ]
      },
      fr: {
        title: "Recettes de l\u2019A\xEFd et restes de l\u2019A\xEFd : plats de f\xEAte et d\xEEners du lendemain",
        h1: "A\xEFd : plats de f\xEAte et restes revisit\xE9s",
        intro: "Biryani, korma, kebabs et mandi pour la table de l\u2019A\xEFd \u2014 puis des id\xE9es rapides pour transformer viande et riz restants en d\xEEner du lendemain. Halal, sans porc.",
        sections: {
          feast: { h: "Plats de f\xEAte de l\u2019A\xEFd", p: "Grandes marmites pour la famille et les invit\xE9s." },
          leftovers: { h: "Restes de l\u2019A\xEFd \u2192 d\xEEner", p: "Viande ou riz en trop ? Wraps, keema et riz saut\xE9 en 30 minutes." }
        },
        tips: [
          "Viande de l\u2019A\xEFd al-Adha : congelez-la en sachets de 500 g, un sachet par d\xEEner.",
          "Effilochez le r\xF4ti ou les kebabs restants dans des wraps sauce yaourt.",
          "Le biryani restant se r\xE9chauffe mieux avec un peu d\u2019eau et un couvercle."
        ]
      },
      tr: {
        title: "Bayram tarifleri ve bayram art\u0131klar\u0131: sofra yemekleri ve ertesi g\xFCn ak\u015Fam yemekleri",
        h1: "Bayram: sofra yemekleri ve art\u0131k d\xF6n\xFC\u015F\xFCm\xFC",
        intro: "Bayram sofras\u0131 i\xE7in biryani, korma, kebap ve mandi \u2014 sonra artan et ve pilav\u0131 ertesi g\xFCn\xFCn ak\u015Fam yeme\u011Fine \xE7evirmenin h\u0131zl\u0131 yollar\u0131. Helal, domuz yok.",
        sections: {
          feast: { h: "Bayram sofras\u0131", p: "Aile ve misafirler i\xE7in b\xFCy\xFCk tencere klasikleri." },
          leftovers: { h: "Bayram art\u0131klar\u0131 \u2192 ak\u015Fam yeme\u011Fi", p: "Et ya da pilav m\u0131 artt\u0131? D\xFCr\xFCm, k\u0131yma ve k\u0131zarm\u0131\u015F pilav 30 dakikada." }
        },
        tips: [
          "Kurban etini 500 g\u2019l\u0131k po\u015Fetlerde dondur \u2014 her po\u015Fet bir ak\u015Fam yeme\u011Fi.",
          "Artan kebab\u0131 yo\u011Furt soslu d\xFCr\xFCme \xE7evir.",
          "Artan biryaniyi biraz su ekleyip kapa\u011F\u0131 kapal\u0131 \u0131s\u0131t."
        ]
      }
    }
  },
  {
    slug: "desi",
    emoji: "\u{1F35B}",
    keywords: "desi recipes, pakistani dinner, indian dinner, karahi, daal chawal, biryani, desi food from fridge",
    sections: [
      { key: "classics", rule: DESI_MAIN },
      { key: "quick", rule: DESI_QUICK }
    ],
    copy: {
      en: {
        title: "Desi dinner recipes from your fridge \u2014 karahi, daal, biryani",
        h1: "Desi dinners from your fridge",
        intro: "Pakistani, Indian and Bangladeshi home cooking \u2014 karahi, daal chawal, aloo sabzi, keema and biryani \u2014 matched to what\u2019s already in your fridge. Halal, no pork.",
        sections: {
          classics: { h: "Desi classics", p: "The dinners ammi makes \u2014 curries, daal and rice." },
          quick: { h: "Desi in 30 minutes", p: "Weeknight bhurji, keema and daal when you\u2019re short on time." }
        },
        tips: [
          "Onion, tomato, ginger-garlic and garam masala turn almost anything into a salan.",
          "Make a jar of bhuna masala on the weekend \u2014 dinner in 15 minutes all week.",
          "Leftover roti? Make a quick egg roll or chips for chaat."
        ]
      },
      ar: {
        title: "\u0648\u0635\u0641\u0627\u062A \u0639\u0634\u0627\u0621 \u062F\u064A\u0633\u064A \u0645\u0646 \u062B\u0644\u0627\u062C\u062A\u0643 \u2014 \u0643\u0631\u0627\u0647\u064A\u060C \u062F\u0627\u0644\u060C \u0628\u0631\u064A\u0627\u0646\u064A",
        h1: "\u0639\u0634\u0627\u0621 \u062F\u064A\u0633\u064A \u0645\u0646 \u062B\u0644\u0627\u062C\u062A\u0643",
        intro: "\u0637\u0628\u062E \u0627\u0644\u0628\u064A\u062A \u0627\u0644\u0628\u0627\u0643\u0633\u062A\u0627\u0646\u064A \u0648\u0627\u0644\u0647\u0646\u062F\u064A \u0648\u0627\u0644\u0628\u0646\u063A\u0627\u0644\u064A \u2014 \u0643\u0631\u0627\u0647\u064A \u0648\u062F\u0627\u0644 \u0628\u0627\u0644\u0623\u0631\u0632 \u0648\u0628\u0637\u0627\u0637\u0627 \u0628\u0627\u0644\u0628\u0647\u0627\u0631\u0627\u062A \u0648\u0643\u064A\u0645\u0629 \u0648\u0628\u0631\u064A\u0627\u0646\u064A \u2014 \u062D\u0633\u0628 \u0645\u0627 \u0641\u064A \u062B\u0644\u0627\u062C\u062A\u0643. \u062D\u0644\u0627\u0644 \u0648\u0628\u062F\u0648\u0646 \u0644\u062D\u0645 \u062E\u0646\u0632\u064A\u0631.",
        sections: {
          classics: { h: "\u0623\u0637\u0628\u0627\u0642 \u062F\u064A\u0633\u064A \u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629", p: "\u0623\u0637\u0628\u0627\u0642 \u0627\u0644\u0628\u064A\u062A \u2014 \u0643\u0627\u0631\u064A \u0648\u062F\u0627\u0644 \u0648\u0623\u0631\u0632." },
          quick: { h: "\u062F\u064A\u0633\u064A \u0641\u064A \u0663\u0660 \u062F\u0642\u064A\u0642\u0629", p: "\u0628\u064A\u0636 \u0628\u0647\u0627\u0631\u0627\u062A \u0648\u0643\u064A\u0645\u0629 \u0648\u062F\u0627\u0644 \u0644\u0623\u064A\u0627\u0645 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0632\u062F\u062D\u0645\u0629." }
        },
        tips: [
          "\u0627\u0644\u0628\u0635\u0644 \u0648\u0627\u0644\u0637\u0645\u0627\u0637\u0645 \u0648\u0627\u0644\u0632\u0646\u062C\u0628\u064A\u0644 \u0648\u0627\u0644\u062B\u0648\u0645 \u0648\u0627\u0644\u062C\u0631\u0627\u0645 \u0645\u0627\u0633\u0627\u0644\u0627 \u062A\u062D\u0648\u0651\u0644 \u0623\u064A \u0634\u064A\u0621 \u0625\u0644\u0649 \u0635\u0627\u0644\u0648\u0646\u0629.",
          "\u062D\u0636\u0651\u0631 \u0628\u0631\u0637\u0645\u0627\u0646 \u0645\u0627\u0633\u0627\u0644\u0627 \u0641\u064A \u0627\u0644\u0639\u0637\u0644\u0629 \u2014 \u0639\u0634\u0627\u0621 \u0641\u064A \u0661\u0665 \u062F\u0642\u064A\u0642\u0629 \u0637\u0648\u0627\u0644 \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",
          "\u062E\u0628\u0632 \u0631\u0648\u062A\u064A \u0645\u062A\u0628\u0642\u064D\u061F \u0627\u0635\u0646\u0639 \u0644\u0641\u0627\u0641\u0629 \u0628\u064A\u0636 \u0633\u0631\u064A\u0639\u0629."
        ]
      },
      ur: {
        title: "\u0641\u0631\u06CC\u062C \u0633\u06D2 \u062F\u06CC\u0633\u06CC \u06A9\u06BE\u0627\u0646\u06D2 \u2014 \u06A9\u0691\u0627\u06C1\u06CC\u060C \u062F\u0627\u0644\u060C \u0628\u0631\u06CC\u0627\u0646\u06CC",
        h1: "\u0641\u0631\u06CC\u062C \u0633\u06D2 \u062F\u06CC\u0633\u06CC \u0688\u0646\u0631",
        intro: "\u067E\u0627\u06A9\u0633\u062A\u0627\u0646\u06CC\u060C \u0627\u0646\u0688\u06CC\u0646 \u0627\u0648\u0631 \u0628\u0646\u06AF\u0627\u0644\u06CC \u06AF\u06BE\u0631 \u06A9\u0627 \u06A9\u06BE\u0627\u0646\u0627 \u2014 \u06A9\u0691\u0627\u06C1\u06CC\u060C \u062F\u0627\u0644 \u0686\u0627\u0648\u0644\u060C \u0622\u0644\u0648 \u06A9\u06CC \u0633\u0628\u0632\u06CC\u060C \u0642\u06CC\u0645\u06C1 \u0627\u0648\u0631 \u0628\u0631\u06CC\u0627\u0646\u06CC \u2014 \u062C\u0648 \u0622\u067E \u06A9\u06D2 \u0641\u0631\u06CC\u062C \u0645\u06CC\u06BA \u06C1\u06D2 \u0627\u0633\u06CC \u0633\u06D2\u06D4 \u062D\u0644\u0627\u0644\u060C \u0628\u063A\u06CC\u0631 \u0633\u0648\u0631 \u06A9\u06D2 \u06AF\u0648\u0634\u062A \u06A9\u06D2\u06D4",
        sections: {
          classics: { h: "\u062F\u06CC\u0633\u06CC \u067E\u0633\u0646\u062F\u06CC\u062F\u06C1 \u06A9\u06BE\u0627\u0646\u06D2", p: "\u0627\u0645\u06CC \u0648\u0627\u0644\u06D2 \u06A9\u06BE\u0627\u0646\u06D2 \u2014 \u0633\u0627\u0644\u0646\u060C \u062F\u0627\u0644 \u0627\u0648\u0631 \u0686\u0627\u0648\u0644\u06D4" },
          quick: { h: "\u06F3\u06F0 \u0645\u0646\u0679 \u0645\u06CC\u06BA \u062F\u06CC\u0633\u06CC", p: "\u0645\u0635\u0631\u0648\u0641 \u062F\u0646\u0648\u06BA \u06A9\u06D2 \u0644\u06CC\u06D2 \u0627\u0646\u0688\u0627 \u0628\u06BE\u0631\u062C\u06CC\u060C \u0642\u06CC\u0645\u06C1 \u0627\u0648\u0631 \u062F\u0627\u0644\u06D4" }
        },
        tips: [
          "\u067E\u06CC\u0627\u0632\u060C \u0679\u0645\u0627\u0679\u0631\u060C \u0627\u062F\u0631\u06A9 \u0644\u06C1\u0633\u0646 \u0627\u0648\u0631 \u06AF\u0631\u0645 \u0645\u0635\u0627\u0644\u062D\u06C1 \u2014 \u062A\u0642\u0631\u06CC\u0628\u0627\u064B \u06C1\u0631 \u0686\u06CC\u0632 \u06A9\u0627 \u0633\u0627\u0644\u0646 \u0628\u0646 \u062C\u0627\u062A\u0627 \u06C1\u06D2\u06D4",
          "\u0648\u06CC\u06A9 \u0627\u06CC\u0646\u0688 \u067E\u0631 \u0628\u06BE\u0646\u0627 \u0645\u0635\u0627\u0644\u062D\u06C1 \u062C\u0627\u0631 \u0645\u06CC\u06BA \u0631\u06A9\u06BE \u0644\u06CC\u06BA \u2014 \u067E\u0648\u0631\u0627 \u06C1\u0641\u062A\u06C1 \u06F1\u06F5 \u0645\u0646\u0679 \u0645\u06CC\u06BA \u0688\u0646\u0631\u06D4",
          "\u0631\u0648\u0679\u06CC \u0628\u0686 \u06AF\u0626\u06CC\u061F \u062C\u0644\u062F\u06CC \u0633\u06D2 \u0627\u0646\u0688\u0627 \u0631\u0648\u0644 \u0628\u0646\u0627 \u0644\u06CC\u06BA\u06D4"
        ]
      },
      es: {
        title: "Recetas desi con lo de tu nevera \u2014 karahi, daal, biryani",
        h1: "Cenas desi con lo de tu nevera",
        intro: "Cocina casera pakistan\xED, india y banglades\xED \u2014 karahi, daal con arroz, aloo sabzi, keema y biryani \u2014 con lo que ya tienes. Halal, sin cerdo.",
        sections: {
          classics: { h: "Cl\xE1sicos desi", p: "Las cenas de casa: currys, daal y arroz." },
          quick: { h: "Desi en 30 minutos", p: "Bhurji, keema y daal para noches con prisa." }
        },
        tips: [
          "Cebolla, tomate, jengibre-ajo y garam masala convierten casi todo en un salan.",
          "Prepara un frasco de masala el fin de semana: cena en 15 minutos toda la semana.",
          "\xBFSobr\xF3 roti? Haz un rollito r\xE1pido de huevo."
        ]
      },
      fr: {
        title: "Recettes desi avec votre frigo \u2014 karahi, daal, biryani",
        h1: "D\xEEners desi avec votre frigo",
        intro: "Cuisine maison pakistanaise, indienne et bangladaise \u2014 karahi, daal chawal, aloo sabzi, keema et biryani \u2014 selon ce que vous avez. Halal, sans porc.",
        sections: {
          classics: { h: "Classiques desi", p: "Les d\xEEners de la maison : currys, daal et riz." },
          quick: { h: "Desi en 30 minutes", p: "Bhurji, keema et daal pour les soirs press\xE9s." }
        },
        tips: [
          "Oignon, tomate, gingembre-ail et garam masala transforment presque tout en salan.",
          "Pr\xE9parez un bocal de masala le week-end : d\xEEner en 15 minutes toute la semaine.",
          "Des rotis en trop ? Faites un roul\xE9 \xE0 l\u2019\u0153uf express."
        ]
      },
      tr: {
        title: "Buzdolab\u0131ndan desi yemekleri \u2014 karahi, daal, biryani",
        h1: "Buzdolab\u0131ndan desi ak\u015Fam yemekleri",
        intro: "Pakistan, Hint ve Banglade\u015F ev yemekleri \u2014 karahi, daal chawal, aloo sabzi, keema ve biryani \u2014 dolab\u0131ndakilerle. Helal, domuz yok.",
        sections: {
          classics: { h: "Desi klasikleri", p: "Evin yemekleri \u2014 k\xF6riler, daal ve pilav." },
          quick: { h: "30 dakikada desi", p: "Yo\u011Fun ak\u015Famlar i\xE7in bhurji, keema ve daal." }
        },
        tips: [
          "So\u011Fan, domates, zencefil-sar\u0131msak ve garam masala neredeyse her \u015Feyi salana \xE7evirir.",
          "Hafta sonu bir kavanoz masala haz\u0131rla \u2014 b\xFCt\xFCn hafta 15 dakikada ak\u015Fam yeme\u011Fi.",
          "Roti mi artt\u0131? H\u0131zl\u0131 bir yumurtal\u0131 d\xFCr\xFCm yap."
        ]
      }
    }
  },
  {
    slug: "arabic",
    emoji: "\u{1F959}",
    keywords: "arabic recipes, middle eastern dinner, kabsa, mandi, shakshuka, hummus, arabic food from fridge",
    sections: [
      { key: "classics", rule: ARABIC_MAIN },
      { key: "quick", rule: ARABIC_QUICK }
    ],
    copy: {
      en: {
        title: "Arabic dinner recipes from your fridge \u2014 kabsa, mandi, shakshuka",
        h1: "Arabic dinners from your fridge",
        intro: "Gulf, Levantine and North African home cooking \u2014 kabsa, mandi, shawarma, fatteh, shakshuka and hummus bowls \u2014 matched to what you already have. Halal, no pork.",
        sections: {
          classics: { h: "Arabic classics", p: "Rice platters, grills and family-style dishes." },
          quick: { h: "Arabic in 30 minutes", p: "Shakshuka, hummus bowls and wraps for busy nights." }
        },
        tips: [
          "Baharat or kabsa spice + rice + any protein = a one-pot dinner.",
          "Leftover chicken becomes shawarma wraps with garlic sauce.",
          "Stale bread? Toast it for fatteh or fattoush."
        ]
      },
      ar: {
        title: "\u0648\u0635\u0641\u0627\u062A \u0639\u0634\u0627\u0621 \u0639\u0631\u0628\u064A\u0629 \u0645\u0646 \u062B\u0644\u0627\u062C\u062A\u0643 \u2014 \u0643\u0628\u0633\u0629\u060C \u0645\u0646\u062F\u064A\u060C \u0634\u0643\u0634\u0648\u0643\u0629",
        h1: "\u0639\u0634\u0627\u0621 \u0639\u0631\u0628\u064A \u0645\u0646 \u062B\u0644\u0627\u062C\u062A\u0643",
        intro: "\u0637\u0628\u062E \u0627\u0644\u0628\u064A\u062A \u0627\u0644\u062E\u0644\u064A\u062C\u064A \u0648\u0627\u0644\u0634\u0627\u0645\u064A \u0648\u0627\u0644\u0645\u063A\u0627\u0631\u0628\u064A \u2014 \u0643\u0628\u0633\u0629 \u0648\u0645\u0646\u062F\u064A \u0648\u0634\u0627\u0648\u0631\u0645\u0627 \u0648\u0641\u062A\u0629 \u0648\u0634\u0643\u0634\u0648\u0643\u0629 \u0648\u0623\u0637\u0628\u0627\u0642 \u062D\u0645\u0635 \u2014 \u062D\u0633\u0628 \u0645\u0627 \u0644\u062F\u064A\u0643. \u062D\u0644\u0627\u0644 \u0648\u0628\u062F\u0648\u0646 \u0644\u062D\u0645 \u062E\u0646\u0632\u064A\u0631.",
        sections: {
          classics: { h: "\u0623\u0637\u0628\u0627\u0642 \u0639\u0631\u0628\u064A\u0629 \u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629", p: "\u0635\u0648\u0627\u0646\u064A \u0623\u0631\u0632 \u0648\u0645\u0634\u0627\u0648\u064A \u0648\u0623\u0637\u0628\u0627\u0642 \u0639\u0627\u0626\u0644\u064A\u0629." },
          quick: { h: "\u0639\u0631\u0628\u064A \u0641\u064A \u0663\u0660 \u062F\u0642\u064A\u0642\u0629", p: "\u0634\u0643\u0634\u0648\u0643\u0629 \u0648\u062D\u0645\u0635 \u0648\u0644\u0641\u0627\u0626\u0641 \u0644\u0644\u0623\u064A\u0627\u0645 \u0627\u0644\u0645\u0632\u062F\u062D\u0645\u0629." }
        },
        tips: [
          "\u0628\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0643\u0628\u0633\u0629 + \u0623\u0631\u0632 + \u0623\u064A \u0628\u0631\u0648\u062A\u064A\u0646 = \u0639\u0634\u0627\u0621 \u0641\u064A \u0642\u062F\u0631 \u0648\u0627\u062D\u062F.",
          "\u0627\u0644\u062F\u062C\u0627\u062C \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u064A\u0635\u0628\u062D \u0644\u0641\u0627\u0626\u0641 \u0634\u0627\u0648\u0631\u0645\u0627 \u0645\u0639 \u0627\u0644\u062B\u0648\u0645\u064A\u0629.",
          "\u062E\u0628\u0632 \u064A\u0627\u0628\u0633\u061F \u062D\u0645\u0651\u0635\u0647 \u0644\u0644\u0641\u062A\u0629 \u0623\u0648 \u0627\u0644\u0641\u062A\u0648\u0634."
        ]
      },
      ur: {
        title: "\u0641\u0631\u06CC\u062C \u0633\u06D2 \u0639\u0631\u0628\u06CC \u06A9\u06BE\u0627\u0646\u06D2 \u2014 \u06A9\u0628\u0633\u06C1\u060C \u0645\u0646\u062F\u06CC\u060C \u0634\u06A9\u0634\u0648\u06A9\u06C1",
        h1: "\u0641\u0631\u06CC\u062C \u0633\u06D2 \u0639\u0631\u0628\u06CC \u0688\u0646\u0631",
        intro: "\u062E\u0644\u06CC\u062C\u06CC\u060C \u0634\u0627\u0645\u06CC \u0627\u0648\u0631 \u0634\u0645\u0627\u0644\u06CC \u0627\u0641\u0631\u06CC\u0642\u06CC \u06AF\u06BE\u0631 \u06A9\u0627 \u06A9\u06BE\u0627\u0646\u0627 \u2014 \u06A9\u0628\u0633\u06C1\u060C \u0645\u0646\u062F\u06CC\u060C \u0634\u0648\u0627\u0631\u0645\u0627\u060C \u0641\u062A\u06C1\u060C \u0634\u06A9\u0634\u0648\u06A9\u06C1 \u0627\u0648\u0631 \u062D\u0645\u0635 \u2014 \u062C\u0648 \u0622\u067E \u06A9\u06D2 \u067E\u0627\u0633 \u06C1\u06D2 \u0627\u0633\u06CC \u0633\u06D2\u06D4 \u062D\u0644\u0627\u0644\u060C \u0628\u063A\u06CC\u0631 \u0633\u0648\u0631 \u06A9\u06D2 \u06AF\u0648\u0634\u062A \u06A9\u06D2\u06D4",
        sections: {
          classics: { h: "\u0639\u0631\u0628\u06CC \u067E\u0633\u0646\u062F\u06CC\u062F\u06C1 \u06A9\u06BE\u0627\u0646\u06D2", p: "\u0686\u0627\u0648\u0644\u0648\u06BA \u06A9\u06D2 \u062A\u06BE\u0627\u0644\u060C \u06AF\u0631\u0644 \u0627\u0648\u0631 \u06AF\u06BE\u0631 \u0648\u0627\u0644\u0648\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE \u06A9\u06BE\u0627\u0646\u06D2 \u0648\u0627\u0644\u06D2 \u067E\u06A9\u0648\u0627\u0646\u06D4" },
          quick: { h: "\u06F3\u06F0 \u0645\u0646\u0679 \u0645\u06CC\u06BA \u0639\u0631\u0628\u06CC", p: "\u0645\u0635\u0631\u0648\u0641 \u0631\u0627\u062A\u0648\u06BA \u06A9\u06D2 \u0644\u06CC\u06D2 \u0634\u06A9\u0634\u0648\u06A9\u06C1\u060C \u062D\u0645\u0635 \u0627\u0648\u0631 \u0631\u0648\u0644\u06D4" }
        },
        tips: [
          "\u06A9\u0628\u0633\u06C1 \u0645\u0635\u0627\u0644\u062D\u06C1 + \u0686\u0627\u0648\u0644 + \u06A9\u0648\u0626\u06CC \u0628\u06BE\u06CC \u06AF\u0648\u0634\u062A = \u0627\u06CC\u06A9 \u062F\u06CC\u06AF\u0686\u06CC \u06A9\u0627 \u0688\u0646\u0631\u06D4",
          "\u0628\u0686\u0627 \u06C1\u0648\u0627 \u0686\u06A9\u0646 \u0644\u06C1\u0633\u0646 \u06A9\u06CC \u0686\u0679\u0646\u06CC \u06A9\u06D2 \u0633\u0627\u062A\u06BE \u0634\u0648\u0627\u0631\u0645\u0627 \u0631\u0648\u0644 \u0628\u0646 \u062C\u0627\u062A\u0627 \u06C1\u06D2\u06D4",
          "\u0628\u0627\u0633\u06CC \u0631\u0648\u0679\u06CC\u061F \u0641\u062A\u06C1 \u06CC\u0627 \u0641\u062A\u0648\u0634 \u06A9\u06D2 \u0644\u06CC\u06D2 \u0633\u06CC\u0646\u06A9 \u0644\u06CC\u06BA\u06D4"
        ]
      },
      es: {
        title: "Recetas \xE1rabes con lo de tu nevera \u2014 kabsa, mandi, shakshuka",
        h1: "Cenas \xE1rabes con lo de tu nevera",
        intro: "Cocina casera del Golfo, el Levante y el norte de \xC1frica \u2014 kabsa, mandi, shawarma, fatteh, shakshuka y bowls de hummus \u2014 con lo que ya tienes. Halal, sin cerdo.",
        sections: {
          classics: { h: "Cl\xE1sicos \xE1rabes", p: "Bandejas de arroz, parrilla y platos para compartir." },
          quick: { h: "\xC1rabe en 30 minutos", p: "Shakshuka, hummus y wraps para noches con prisa." }
        },
        tips: [
          "Especias kabsa + arroz + cualquier prote\xEDna = cena en una olla.",
          "El pollo sobrante se convierte en wraps de shawarma con salsa de ajo.",
          "\xBFPan duro? Tu\xE9stalo para fatteh o fattoush."
        ]
      },
      fr: {
        title: "Recettes arabes avec votre frigo \u2014 kabsa, mandi, chakchouka",
        h1: "D\xEEners arabes avec votre frigo",
        intro: "Cuisine maison du Golfe, du Levant et du Maghreb \u2014 kabsa, mandi, shawarma, fatteh, chakchouka et bols de houmous \u2014 selon ce que vous avez. Halal, sans porc.",
        sections: {
          classics: { h: "Classiques arabes", p: "Plateaux de riz, grillades et plats \xE0 partager." },
          quick: { h: "Arabe en 30 minutes", p: "Chakchouka, houmous et wraps pour les soirs press\xE9s." }
        },
        tips: [
          "\xC9pices kabsa + riz + n\u2019importe quelle prot\xE9ine = un d\xEEner en une cocotte.",
          "Le poulet restant devient des wraps shawarma sauce \xE0 l\u2019ail.",
          "Du pain rassis ? Grillez-le pour une fatteh ou un fattouche."
        ]
      },
      tr: {
        title: "Buzdolab\u0131ndan Arap yemekleri \u2014 kabsa, mandi, \u015Fak\u015Fuka",
        h1: "Buzdolab\u0131ndan Arap ak\u015Fam yemekleri",
        intro: "K\xF6rfez, Levant ve Kuzey Afrika ev yemekleri \u2014 kabsa, mandi, d\xF6ner d\xFCr\xFCm, fatteh, \u015Fak\u015Fuka ve humus kaseleri \u2014 elindekilerle. Helal, domuz yok.",
        sections: {
          classics: { h: "Arap klasikleri", p: "Pilav tepsileri, \u0131zgaralar ve payla\u015F\u0131ml\u0131k tabaklar." },
          quick: { h: "30 dakikada Arap mutfa\u011F\u0131", p: "Yo\u011Fun ak\u015Famlar i\xE7in \u015Fak\u015Fuka, humus ve d\xFCr\xFCm." }
        },
        tips: [
          "Kabsa baharat\u0131 + pirin\xE7 + herhangi bir protein = tek tencere ak\u015Fam yeme\u011Fi.",
          "Artan tavuk sar\u0131msak soslu d\xFCr\xFCm olur.",
          "Bayat ekmek mi? Fatteh ya da fattu\u015F i\xE7in k\u0131zart."
        ]
      }
    }
  }
];
function hubBySlug(slug) {
  return HUBS.find((h) => h.slug === slug);
}
__name(hubBySlug, "hubBySlug");
__name2(hubBySlug, "hubBySlug");
function curateHub(hub, catalog, perSection = 18) {
  const pool = catalog.filter(
    (e) => e.g.includes("halal") && !HALAL_EXCLUDE.test(`${e.t} ${e.i.join(" ")}`)
  );
  const used = /* @__PURE__ */ new Set();
  const out = {};
  for (const s of hub.sections) {
    const list = filterHub(pool, s.rule, perSection * 2).filter((e) => !used.has(e.id)).slice(0, perSection);
    for (const e of list) used.add(e.id);
    out[s.key] = list;
  }
  return out;
}
__name(curateHub, "curateHub");
__name2(curateHub, "curateHub");
var API_BASE = "https://tonightfromthis.hamad2k9.workers.dev";
var SITE = "https://dinnerfromfridge.com";
var LOGO = `${SITE}/app-icon.png`;
var OG_IMAGE = `${SITE}/og/default.jpg`;
var og = /* @__PURE__ */ __name2((slug) => `${SITE}/og/${slug}.jpg`, "og");
var BOT_RE = /Googlebot|Google-Extended|bingbot|BingPreview|DuckDuckBot|Baiduspider|YandexBot|Yandex|Slurp|Applebot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|GPTBot|ChatGPT-User|ClaudeBot|anthropic-ai|Claude-Web|PerplexityBot|Bytespider|CCBot|Amazonbot|meta-externalagent|ia_archiver|SemrushBot|AhrefsBot|DotBot|PetalBot|cohere-ai/i;
var COOK_LANDINGS = {
  "15-min": {
    label: "15-minute dinners",
    maxMinutes: 15,
    intro: "Fast dinners you can cook in about 15 minutes or less \u2014 perfect for busy weeknights."
  },
  "20-min": {
    label: "20-minute dinners",
    maxMinutes: 20,
    intro: "Quick meals ready in about 20 minutes. Great when you want dinner without the wait."
  },
  "30-min": {
    label: "30-minute dinners",
    maxMinutes: 30,
    intro: "Weeknight-friendly recipes ready in about 30 minutes from prep to plate."
  },
  "45-min": {
    label: "45-minute dinners",
    maxMinutes: 45,
    intro: "Heartier dinners that still fit a busy evening \u2014 about 45 minutes or less."
  }
};
var CUISINE_LANDINGS = {
  desi: {
    label: "Desi / South Asian",
    keywords: ["desi", "indian", "pakistani", "south asian", "curry"],
    intro: "Desi and South Asian dinner ideas \u2014 curries, dals, rice dishes, and more from your fridge."
  },
  arabic: {
    label: "Arabic / Middle Eastern",
    keywords: ["arabic", "middle eastern", "levantine", "mediterranean"],
    intro: "Arabic and Middle Eastern dinners \u2014 fragrant, shareable plates you can cook at home."
  },
  chinese: {
    label: "Chinese",
    keywords: ["chinese", "stir fry", "stir-fry", "wok"],
    intro: "Chinese-inspired dinners \u2014 stir-fries and pantry-friendly meals for tonight."
  },
  western: {
    label: "Western",
    keywords: ["western", "american", "italian", "european"],
    intro: "Western dinner classics \u2014 pasta, skillet meals, and familiar comfort food."
  },
  mexican: {
    label: "Mexican",
    keywords: ["mexican", "tex-mex", "taco", "burrito"],
    intro: "Mexican and Tex-Mex dinner ideas \u2014 tacos, bowls, and weeknight favorites."
  }
};
function isBot(ua) {
  return BOT_RE.test(ua);
}
__name(isBot, "isBot");
__name2(isBot, "isBot");
function shouldSkip(pathname) {
  if (pathname.startsWith("/assets")) return true;
  if (pathname.startsWith("/cdn-cgi")) return true;
  if (/\.[a-zA-Z0-9]{1,8}$/.test(pathname)) return true;
  return false;
}
__name(shouldSkip, "shouldSkip");
__name2(shouldSkip, "shouldSkip");
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escapeHtml, "escapeHtml");
__name2(escapeHtml, "escapeHtml");
function htmlDoc(opts) {
  const image = opts.image || OG_IMAGE;
  const imageAlt = opts.imageAlt || opts.title;
  const robots = opts.noIndex ? '<meta name="robots" content="noindex, follow" />' : "";
  const jsonLdBlock = opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd).replace(/</g, "\\u003c")}<\/script>` : "";
  const keywords = opts.keywords ? `<meta name="keywords" content="${escapeHtml(opts.keywords)}" />` : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  ${keywords}
  <link rel="canonical" href="${escapeHtml(opts.canonical)}" />
  ${robots}
  <meta property="og:type" content="${opts.type || "website"}" />
  <meta property="og:site_name" content="Dinner From Fridge" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:url" content="${escapeHtml(opts.canonical)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(opts.title)}" />
  <meta name="twitter:description" content="${escapeHtml(opts.description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="icon" type="image/png" href="/app-icon.png" />
  ${jsonLdBlock}
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:1.25rem;line-height:1.5;color:#1a1a1a;background:#faf6f1;max-width:42rem}
    a{color:#C45C26} h1{font-size:1.75rem;margin:0 0 .5rem} h2{font-size:1.15rem;margin:1.25rem 0 .5rem}
    ul{padding-left:1.2rem} .muted{color:#666;font-size:.95rem} nav a{margin-right:.75rem}
  </style>
</head>
<body>
${opts.bodyHtml}
<nav style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e8ddd3">
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/recipes">Recipes</a>
  <a href="/cook/30-min">Cook 30 min</a>
  <a href="/cuisine/desi">Cuisines</a>
  <a href="/leftover-rescue">Leftover rescue</a>
  <a href="/challenge">Fridge challenge</a>
  <a href="/ramadan">Ramadan</a>
  <a href="/eid">Eid</a>
  <a href="/desi">Desi</a>
  <a href="/arabic">Arabic</a>
  <a href="/legal/privacy">Privacy</a>
  <a href="/legal/terms">Terms</a>
</nav>
<p class="muted" style="margin-top:1rem">Dinner From Fridge \u2014 cook tonight from what you already have.</p>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-dff-bot-html": "1"
    }
  });
}
__name(htmlDoc, "htmlDoc");
__name2(htmlDoc, "htmlDoc");
async function fetchJson(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { accept: "application/json" }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
__name(fetchJson, "fetchJson");
__name2(fetchJson, "fetchJson");
function totalMinutes(r) {
  if (typeof r.minutes === "number" && r.minutes > 0) return r.minutes;
  return Math.max(0, (r.prepMinutes || 0) + (r.cookMinutes || 0)) || 30;
}
__name(totalMinutes, "totalMinutes");
__name2(totalMinutes, "totalMinutes");
function recipeJsonLd(r) {
  const url = `${SITE}/recipe/${encodeURIComponent(r.id)}`;
  const ingredients = (r.ingredients || []).map(
    (ing) => [ing.quantity, ing.unit, ing.name].filter(Boolean).join(" ").trim() || ing.name
  );
  const steps = (r.steps || []).map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    text: s.instruction
  }));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: r.title,
    description: r.description || r.title,
    image: [og("recipe"), LOGO],
    url,
    totalTime: `PT${Math.max(1, Math.round(totalMinutes(r)))}M`,
    recipeYield: String(r.servings || 4),
    recipeIngredient: ingredients,
    recipeInstructions: steps,
    keywords: (r.tags || []).join(", "),
    author: { "@type": "Organization", name: "Dinner From Fridge", url: SITE }
  };
  const n = r.nutrition;
  if (n && (n.calories || n.protein)) {
    ld.nutrition = {
      "@type": "NutritionInformation",
      calories: n.calories != null ? `${Math.round(n.calories)} calories` : void 0,
      proteinContent: n.protein != null ? `${n.protein} g` : void 0,
      carbohydrateContent: n.carbs != null ? `${n.carbs} g` : void 0,
      fatContent: n.fat != null ? `${n.fat} g` : void 0
    };
  }
  return ld;
}
__name(recipeJsonLd, "recipeJsonLd");
__name2(recipeJsonLd, "recipeJsonLd");
async function renderRecipe(id) {
  const data = await fetchJson(`/v1/recipes/${encodeURIComponent(id)}`);
  const r = data?.recipe;
  if (!r) {
    return htmlDoc({
      title: "Recipe not found | Dinner From Fridge",
      description: "This recipe was not found in the Dinner From Fridge catalog.",
      canonical: `${SITE}/recipe/${encodeURIComponent(id)}`,
      bodyHtml: `<h1>Recipe not found</h1><p class="muted">Try <a href="/recipes">browsing recipes</a> or <a href="/capture">scanning your fridge</a>.</p>`
    });
  }
  const mins = totalMinutes(r);
  const title = `${r.title} recipe (${mins} min) | Dinner From Fridge`;
  const description = r.description || `Cook ${r.title} in about ${mins} minutes with Dinner From Fridge \u2014 leftovers and fridge ingredients welcome.`;
  const ingList = (r.ingredients || []).map((ing) => {
    const line = [ing.quantity, ing.unit, ing.name].filter(Boolean).join(" ").trim() || ing.name;
    return `<li>${escapeHtml(line)}</li>`;
  }).join("");
  const stepList = (r.steps || []).map((s, i) => `<li><strong>Step ${i + 1}.</strong> ${escapeHtml(s.instruction)}</li>`).join("");
  const body = `
<h1>${escapeHtml(r.emoji || "\u{1F37D}\uFE0F")} ${escapeHtml(r.title)}</h1>
<p class="muted">~${mins} min \xB7 ${r.servings || 4} servings</p>
<p>${escapeHtml(r.description || "")}</p>
<h2>Ingredients</h2>
<ul>${ingList || "<li>See recipe on Dinner From Fridge</li>"}</ul>
<h2>Steps</h2>
<ol>${stepList || "<li>Open the recipe on Dinner From Fridge for full cook mode.</li>"}</ol>
<p><a href="/capture">Scan your fridge</a> for more dinners you can cook tonight.</p>`;
  return htmlDoc({
    title,
    description,
    canonical: `${SITE}/recipe/${encodeURIComponent(r.id)}`,
    keywords: (r.tags || []).join(", "),
    jsonLd: recipeJsonLd(r),
    image: og("recipe"),
    imageAlt: `${r.title} \u2014 Dinner From Fridge`,
    type: "article",
    bodyHtml: body
  });
}
__name(renderRecipe, "renderRecipe");
__name2(renderRecipe, "renderRecipe");
async function searchSample(q, limit = 12) {
  const data = await fetchJson(
    `/v1/recipes/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  return Array.isArray(data?.recipes) ? data.recipes : [];
}
__name(searchSample, "searchSample");
__name2(searchSample, "searchSample");
function itemListJsonLd(name, description, path, items) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE}${path}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/recipe/${encodeURIComponent(r.id)}`,
        name: r.title
      }))
    }
  };
}
__name(itemListJsonLd, "itemListJsonLd");
__name2(itemListJsonLd, "itemListJsonLd");
function recipeLinks(items) {
  if (!items.length) return '<p class="muted">Browse the full catalog for more ideas.</p>';
  return `<ul>${items.map(
    (r) => `<li><a href="/recipe/${encodeURIComponent(r.id)}">${escapeHtml(r.title)}</a> <span class="muted">(~${totalMinutes(r)} min)</span></li>`
  ).join("")}</ul>`;
}
__name(recipeLinks, "recipeLinks");
__name2(recipeLinks, "recipeLinks");
async function renderCook(slug) {
  const landing = COOK_LANDINGS[slug];
  if (!landing) {
    return htmlDoc({
      title: "Cook landings | Dinner From Fridge",
      description: "Easy dinners by cook time.",
      canonical: `${SITE}/cook/${slug}`,
      bodyHtml: `<h1>Cook time landings</h1><ul>${Object.keys(COOK_LANDINGS).map((s) => `<li><a href="/cook/${s}">${escapeHtml(COOK_LANDINGS[s].label)}</a></li>`).join("")}</ul>`
    });
  }
  const all = await searchSample("", 48);
  const items = all.filter((r) => totalMinutes(r) > 0 && totalMinutes(r) <= landing.maxMinutes).slice(0, 16);
  const title = `Easy dinners in ${landing.maxMinutes} minutes | Dinner From Fridge`;
  const path = `/cook/${slug}`;
  return htmlDoc({
    title,
    description: landing.intro,
    canonical: `${SITE}${path}`,
    keywords: `${landing.maxMinutes} minute meals, quick dinner, cook from fridge`,
    jsonLd: itemListJsonLd(landing.label, landing.intro, path, items),
    bodyHtml: `<h1>${escapeHtml(landing.label)}</h1><p>${escapeHtml(landing.intro)}</p><h2>Sample recipes</h2>${recipeLinks(items)}`
  });
}
__name(renderCook, "renderCook");
__name2(renderCook, "renderCook");
async function renderCuisine(slug) {
  const landing = CUISINE_LANDINGS[slug];
  if (!landing) {
    return htmlDoc({
      title: "Cuisine recipes | Dinner From Fridge",
      description: "Browse dinners by cuisine.",
      canonical: `${SITE}/cuisine/${slug}`,
      bodyHtml: `<h1>Cuisines</h1><ul>${Object.keys(CUISINE_LANDINGS).map((s) => `<li><a href="/cuisine/${s}">${escapeHtml(CUISINE_LANDINGS[s].label)}</a></li>`).join("")}</ul>`
    });
  }
  let items = await searchSample(landing.keywords[0] || slug, 24);
  const hayMatch = /* @__PURE__ */ __name2((r) => {
    const hay = `${r.title} ${r.description || ""} ${(r.tags || []).join(" ")}`.toLowerCase();
    return landing.keywords.some((k) => hay.includes(k.toLowerCase()));
  }, "hayMatch");
  items = items.filter(hayMatch).slice(0, 16);
  if (items.length < 6) {
    const broader = await searchSample("", 48);
    const ids = new Set(items.map((r) => r.id));
    for (const r of broader) {
      if (ids.has(r.id)) continue;
      if (hayMatch(r)) {
        items.push(r);
        ids.add(r.id);
      }
      if (items.length >= 16) break;
    }
  }
  const title = `${landing.label} recipes you can cook from your fridge | Dinner From Fridge`;
  const path = `/cuisine/${slug}`;
  return htmlDoc({
    title,
    description: landing.intro,
    canonical: `${SITE}${path}`,
    keywords: `${landing.label}, fridge recipes, leftover dinner`,
    jsonLd: itemListJsonLd(`${landing.label} recipes`, landing.intro, path, items),
    bodyHtml: `<h1>${escapeHtml(landing.label)} recipes</h1><p>${escapeHtml(landing.intro)}</p><h2>Sample recipes</h2>${recipeLinks(items)}`
  });
}
__name(renderCuisine, "renderCuisine");
__name2(renderCuisine, "renderCuisine");
function renderHome() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Dinner From Fridge",
      url: SITE,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE}/recipes?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Dinner From Fridge",
      url: SITE,
      logo: LOGO
    }
  ];
  return htmlDoc({
    title: "Dinner From Fridge \u2014 cook tonight from what you already have",
    description: "Scan your fridge or type ingredients. Match leftovers to world recipes, cook in 15\u201345 minutes, track nutrition, and plan the week. No pork.",
    canonical: `${SITE}/`,
    keywords: "fridge recipes, leftover dinner, what to cook tonight, 30 minute meals",
    jsonLd,
    bodyHtml: `<h1>Dinner From Fridge</h1>
<p>Cook tonight from what you already have. Scan your fridge, browse recipes, and get cook steps with scaled ingredients.</p>
<ul>
  <li><a href="/capture">Scan your fridge</a></li>
  <li><a href="/recipes">Browse recipes</a></li>
  <li><a href="/cook/30-min">Easy dinners in 30 minutes</a></li>
  <li><a href="/cuisine/desi">Desi recipes</a> \xB7 <a href="/cuisine/arabic">Arabic</a> \xB7 <a href="/cuisine/chinese">Chinese</a> \xB7 <a href="/cuisine/mexican">Mexican</a> \xB7 <a href="/cuisine/western">Western</a></li>
  <li><a href="/sample-fridge">Try a sample fridge</a> \u2014 see a scan result instantly</li>
  <li><a href="/leftover-rescue">Leftover rescue</a> \u2014 2\u20134 ingredient dinners, cook before you shop</li>
  <li><a href="/challenge">Fridge challenge</a> \u2014 dare a friend to make dinner from 2\u20135 ingredients</li>
  <li><a href="/ramadan">Ramadan iftar &amp; suhoor</a> \xB7 <a href="/eid">Eid leftovers</a> \xB7 <a href="/desi">Desi dinners</a> \xB7 <a href="/arabic">Arabic dinners</a></li>
  <li><a href="/about">About Dinner From Fridge</a></li>
</ul>`
  });
}
__name(renderHome, "renderHome");
__name2(renderHome, "renderHome");
function renderAbout() {
  return htmlDoc({
    title: "About Dinner From Fridge \u2014 fridge-to-dinner recipes",
    description: "Dinner From Fridge helps home cooks turn leftovers and fridge ingredients into dinner ideas, cook steps, nutrition info, and week plans. No pork in the catalog.",
    canonical: `${SITE}/about`,
    bodyHtml: `<h1>About Dinner From Fridge</h1>
<p>Dinner From Fridge is a web app for busy cooks who want dinner from what is already in the fridge \u2014 not another grocery run.</p>
<h2>Who it is for</h2>
<p>Home cooks facing leftovers, a half-empty fridge, or the nightly \u201Cwhat\u2019s for dinner?\u201D question. Useful if you want fast meals (15\u201345 minutes), world cuisines, or simple nutrition tracking.</p>
<h2>Key features</h2>
<ul>
  <li><strong>Fridge scan</strong> \u2014 photo your fridge or pantry for ingredient suggestions.</li>
  <li><strong>Manual ingredients</strong> \u2014 type what you have and match catalog recipes.</li>
  <li><strong>World recipes</strong> \u2014 Desi, Arabic, Chinese, Western, Mexican, and more.</li>
  <li><strong>Cook mode</strong> \u2014 step-by-step instructions with timers.</li>
  <li><strong>Nutrition &amp; goals</strong> \u2014 food calculator and optional calorie/protein plans.</li>
  <li><strong>Week plan &amp; shopping list</strong> \u2014 plan dinners and fill gaps.</li>
  <li><strong>No pork</strong> \u2014 the recipe catalog excludes pork products.</li>
</ul>
<p><a href="/capture">Start with a fridge scan</a> or <a href="/recipes">browse recipes</a>.</p>`
  });
}
__name(renderAbout, "renderAbout");
__name2(renderAbout, "renderAbout");
async function renderRecipes() {
  const items = (await searchSample("", 20)).slice(0, 16);
  return htmlDoc({
    title: "Recipes from your fridge | Dinner From Fridge",
    description: "Search leftover-friendly dinners and world recipes. Filter by diet preferences and cook tonight from what you have.",
    canonical: `${SITE}/recipes`,
    jsonLd: itemListJsonLd("Recipes", "Browse Dinner From Fridge recipes", "/recipes", items),
    bodyHtml: `<h1>Recipes</h1>
<p>Search the Dinner From Fridge catalog \u2014 leftovers welcome. Try <a href="/recipes?q=chicken">chicken</a>, <a href="/recipes?q=pasta">pasta</a>, or <a href="/recipes?q=dal">dal</a>.</p>
<h2>Sample recipes</h2>${recipeLinks(items)}`
  });
}
__name(renderRecipes, "renderRecipes");
__name2(renderRecipes, "renderRecipes");
async function loadCatalog(context) {
  try {
    const assets = context.env.ASSETS;
    const req = new Request(new URL("/catalog-index.json", context.request.url).toString());
    const res = assets ? await assets.fetch(req) : await fetch(req);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
__name(loadCatalog, "loadCatalog");
__name2(loadCatalog, "loadCatalog");
function entryLinks(items) {
  if (!items.length) return '<p class="muted">Browse the full catalog for more ideas.</p>';
  return `<ul>${items.map(
    (e) => `<li><a href="/recipe/${encodeURIComponent(e.id)}">${escapeHtml(e.e)} ${escapeHtml(e.t)}</a> <span class="muted">(~${e.m} min)</span></li>`
  ).join("")}</ul>`;
}
__name(entryLinks, "entryLinks");
__name2(entryLinks, "entryLinks");
function entryListJsonLd(name, description, path, items) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE}${path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/recipe/${encodeURIComponent(e.id)}`,
        name: e.t
      }))
    }
  };
}
__name(entryListJsonLd, "entryListJsonLd");
__name2(entryListJsonLd, "entryListJsonLd");
async function renderChallenge(context, url) {
  const items = parseChallengeParam(url.searchParams.get("i"));
  if (items.length < 2) {
    return htmlDoc({
      title: "Fridge challenge \u2014 can you make dinner from these? | Dinner From Fridge",
      description: "Pick 2\u20135 ingredients and dare a friend to make dinner from them. See matching recipes instantly.",
      canonical: `${SITE}/challenge`,
      image: og("challenge"),
      bodyHtml: `<h1>Fridge challenge</h1><p>Pick 2\u20135 ingredients and dare a friend to make dinner from them. Example: <a href="/challenge?i=eggs,spinach,rice">Can you make dinner from eggs, spinach and rice?</a></p>`
    });
  }
  const catalog = await loadCatalog(context);
  const matches = matchCatalog(catalog, items, { minUsed: Math.min(2, items.length), limit: 12 });
  const list = joinList(items);
  const title = `Can you make dinner from ${list}?`;
  const description = `\u{1F9D1}\u200D\u{1F373} Fridge challenge: dinner from ${list}. ${matches.length ? `${matches.length} recipes can do it \u2014 ` : ""}accept the challenge on Dinner From Fridge.`;
  const path = `/challenge?i=${challengeQuery(items)}`;
  return htmlDoc({
    title,
    description,
    canonical: `${SITE}${path}`,
    image: og("challenge"),
    imageAlt: title,
    noIndex: true,
    jsonLd: entryListJsonLd(title, description, path, matches.map((m) => m.entry)),
    bodyHtml: `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><h2>Recipes that use ${escapeHtml(list)}</h2>${entryLinks(matches.map((m) => m.entry))}<p><a href="/challenge">Make your own challenge</a> \xB7 <a href="/capture">Snap your fridge</a></p>`
  });
}
__name(renderChallenge, "renderChallenge");
__name2(renderChallenge, "renderChallenge");
async function renderLeftovers(context, url) {
  const catalog = await loadCatalog(context);
  const have = parseChallengeParam(url.searchParams.get("i"), 15);
  const items = have.length ? matchCatalog(catalog, have, { maxCore: 4, limit: 16 }).map((m) => m.entry) : smallRecipes(catalog, 3, 24);
  const title = have.length ? `Leftover rescue: dinner from ${joinList(have)} | Dinner From Fridge` : "Leftover rescue: 2\u20134 ingredient dinners \u2014 cook before you shop | Dinner From Fridge";
  const description = "Empty fridge? Find dinners that need only 2\u20134 main ingredients (salt, oil and spices assumed). Cook before you shop and save money.";
  const path = have.length ? `/leftover-rescue?i=${challengeQuery(have)}` : "/leftover-rescue";
  return htmlDoc({
    title,
    description,
    canonical: `${SITE}${path}`,
    keywords: "leftover recipes, few ingredient dinners, empty fridge meals, 3 ingredient dinner, cook before you shop, save money on food",
    image: og("leftovers"),
    noIndex: have.length > 0,
    jsonLd: entryListJsonLd("Leftover rescue \u2014 dinners with 2\u20134 ingredients", description, "/leftover-rescue", items),
    bodyHtml: `<h1>Leftover rescue: cook before you shop</h1><p>${escapeHtml(description)}</p><h2>${have.length ? `Dinners using ${escapeHtml(joinList(have))}` : "Dinners with 3 or fewer main ingredients"}</h2><ul>${items.map(
      (e) => `<li><a href="/recipe/${encodeURIComponent(e.id)}">${escapeHtml(e.e)} ${escapeHtml(e.t)}</a> <span class="muted">(~${e.m} min \xB7 ${escapeHtml(coreIngredients(e).join(", "))})</span></li>`
    ).join("")}</ul>`
  });
}
__name(renderLeftovers, "renderLeftovers");
__name2(renderLeftovers, "renderLeftovers");
async function renderHub(context, slug) {
  const hub = hubBySlug(slug);
  if (!hub) return null;
  const catalog = await loadCatalog(context);
  const sections = curateHub(hub, catalog);
  const en = hub.copy.en;
  const all = Object.values(sections).flat();
  const local = ["ar", "ur"].map((l) => {
    const c = hub.copy[l];
    return `<section lang="${l}" dir="rtl"><h2>${escapeHtml(c.h1)}</h2><p>${escapeHtml(c.intro)}</p></section>`;
  }).join("");
  const body = `<h1>${escapeHtml(hub.emoji)} ${escapeHtml(en.h1)}</h1>
<p>${escapeHtml(en.intro)}</p>
${hub.sections.map((s) => `<h2>${escapeHtml(en.sections[s.key].h)}</h2><p class="muted">${escapeHtml(en.sections[s.key].p)}</p>${entryLinks(sections[s.key] ?? [])}`).join("\n")}
<h2>Tips</h2><ul>${en.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
${local}
<p>More collections: ${HUBS.filter((h) => h.slug !== hub.slug).map((h) => `<a href="/${h.slug}">${escapeHtml(h.copy.en.h1)}</a>`).join(" \xB7 ")}</p>
<p class="muted">All recipes are halal-friendly. No pork.</p>`;
  return htmlDoc({
    title: `${en.title} | Dinner From Fridge`,
    description: en.intro,
    canonical: `${SITE}/${hub.slug}`,
    keywords: hub.keywords,
    image: og(hub.slug),
    jsonLd: entryListJsonLd(en.h1, en.intro, `/${hub.slug}`, all),
    bodyHtml: body
  });
}
__name(renderHub, "renderHub");
__name2(renderHub, "renderHub");
function renderSample() {
  return htmlDoc({
    title: "Try a sample fridge \u2014 see Dinner From Fridge in one tap",
    description: "See how one fridge photo turns into 3 dinners you can cook tonight. Free demo \u2014 no sign-up.",
    canonical: `${SITE}/sample-fridge`,
    image: og("sample"),
    bodyHtml: `<h1>Try a sample fridge</h1><p>A real fridge photo \u2014 eggs, tomatoes, yogurt, greens, rice \u2014 and the 3 dinners it suggests: Tomato Egg Scramble, Egg Masala Dinner and Fridge Fried Rice.</p><p><a href="/capture">Now snap your own fridge</a></p>`
  });
}
__name(renderSample, "renderSample");
__name2(renderSample, "renderSample");
function renderStreak() {
  return htmlDoc({
    title: "Home-cooked streak & money saved | Dinner From Fridge",
    description: "Keep a weekly home-cooking streak and see an estimate of money saved versus takeout. Cook tonight from your fridge.",
    canonical: `${SITE}/streak`,
    image: og("streak"),
    bodyHtml: `<h1>Home-cooked streak</h1><p>Count home-cooked dinners, keep a weekly streak and see an estimate of what you saved versus takeout.</p><p><a href="/capture">Find tonight\u2019s dinner</a></p>`
  });
}
__name(renderStreak, "renderStreak");
__name2(renderStreak, "renderStreak");
function decodeShare(raw) {
  try {
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - padded.length % 4);
    const bin = atob(padded + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || data.v !== 1 || !Array.isArray(data.meals) || !data.meals.length) return null;
    return data;
  } catch {
    return null;
  }
}
__name(decodeShare, "decodeShare");
__name2(decodeShare, "decodeShare");
function renderShare(raw, prefix) {
  const data = decodeShare(raw);
  const canonical = `${SITE}/${prefix}/${raw}`;
  if (!data) {
    return htmlDoc({
      title: "Shared dinners | Dinner From Fridge",
      description: "Dinner ideas from what\u2019s already in the fridge.",
      canonical,
      image: og("share"),
      noIndex: true,
      bodyHtml: `<h1>Shared dinners</h1><p><a href="/capture">Snap your fridge</a> for dinner ideas.</p>`
    });
  }
  const meals = data.meals.slice(0, 3);
  const names = meals.map((m) => `${m.e ? `${m.e} ` : ""}${m.t}`);
  const title = meals.length === 1 ? `${names[0]} \u2014 tonight\u2019s dinner` : `Tonight\u2019s dinners: ${names.join(" \xB7 ")}`;
  const description = data.note || (meals.length === 1 ? `Cook ${meals[0].t}${meals[0].m ? ` in about ${meals[0].m} minutes` : ""} from what\u2019s in your fridge. Open the recipe on Dinner From Fridge.` : `Dinner ideas picked from a real fridge: ${meals.map((m) => m.t).join(", ")}. Open them or snap your own fridge.`);
  return htmlDoc({
    title,
    description,
    canonical,
    image: og("share"),
    imageAlt: title,
    noIndex: true,
    bodyHtml: `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><ul>${meals.map((m) => `<li><a href="/recipe/${encodeURIComponent(m.id)}">${escapeHtml(m.t)}</a>${m.m ? ` <span class="muted">(~${m.m} min)</span>` : ""}</li>`).join("")}</ul><p><a href="/capture">Snap your fridge</a></p>`
  });
}
__name(renderShare, "renderShare");
__name2(renderShare, "renderShare");
var onRequest = /* @__PURE__ */ __name2(async (context) => {
  const url = new URL(context.request.url);
  const { pathname } = url;
  if (shouldSkip(pathname)) {
    return context.next();
  }
  if (pathname === "/leftovers" || pathname === "/leftovers/" || pathname === "/leftover-rescue/") {
    return Response.redirect(`${url.origin}/leftover-rescue${url.search}`, 301);
  }
  const ua = context.request.headers.get("user-agent") || "";
  if (!isBot(ua)) {
    return context.next();
  }
  try {
    if (pathname === "/" || pathname === "") {
      return renderHome();
    }
    if (pathname === "/about") {
      return renderAbout();
    }
    if (pathname === "/recipes") {
      return await renderRecipes();
    }
    if (pathname === "/challenge" || pathname === "/challenge/") {
      return await renderChallenge(context, url);
    }
    if (pathname === "/leftover-rescue") {
      return await renderLeftovers(context, url);
    }
    const hubMatch = pathname.match(/^\/(ramadan|eid|desi|arabic)\/?$/);
    if (hubMatch) {
      const res = await renderHub(context, hubMatch[1]);
      if (res) return res;
    }
    if (pathname === "/sample-fridge") {
      return renderSample();
    }
    if (pathname === "/streak") {
      return renderStreak();
    }
    const shareMatch = pathname.match(/^\/(s|share)\/([^/]+)\/?$/);
    if (shareMatch) {
      return renderShare(shareMatch[2], shareMatch[1]);
    }
    const recipeMatch = pathname.match(/^\/recipe\/([^/]+)\/?$/);
    if (recipeMatch) {
      return await renderRecipe(decodeURIComponent(recipeMatch[1]));
    }
    const cookMatch = pathname.match(/^\/cook\/([^/]+)\/?$/);
    if (cookMatch && COOK_LANDINGS[cookMatch[1]]) {
      return await renderCook(cookMatch[1]);
    }
    const cuisineMatch = pathname.match(/^\/cuisine\/([^/]+)\/?$/);
    if (cuisineMatch && CUISINE_LANDINGS[cuisineMatch[1]]) {
      return await renderCuisine(cuisineMatch[1]);
    }
  } catch {
  }
  return context.next();
}, "onRequest");
var routes = [
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../home/box/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../home/box/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-vC5mHN/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../home/box/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-vC5mHN/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.21286683044721477.js.map
