/**
 * Fashion Knowledge & Seasonal Classification Matrix for Sinsay
 * Maps garment types, accessories, filenames, and product attributes to seasons and Sinsay slogan queries.
 */

export interface FashionCategory {
  id: string;
  label: string;
  shortLabel: string;
  seasonId: "spring_summer" | "autumn_winter" | "party_evening" | "all_season" | "promotions";
  seasonLabel: string;
  seasonIcon: string;
  icon: string;
  triggers: string[];
  sinsayQueryKeywords: string[];
  boostKeywords: string[];
  suggestedQuery: string;
  colorHints?: string[];
}

export const FASHION_CATEGORIES: FashionCategory[] = [
  {
    id: "sunglasses_accessories",
    label: "Okulary & Akcesoria Letnie",
    shortLabel: "🕶 Okulary / Lato",
    seasonId: "spring_summer",
    seasonLabel: "Wiosna / Lato",
    seasonIcon: "☀️",
    icon: "🕶",
    triggers: [
      "okulary", "przeciwsloneczne", "przeciwsłoneczne", "sunglasses", "sunglass",
      "shades", "oprawki", "kapelusz", "kapelusze", "daszek", "czapka z daszkiem",
      "torba plażowa", "torby plażowe", "koszyk", "okular", "eyewear"
    ],
    sinsayQueryKeywords: ["okulary", "kapelusze", "torby", "akcesoria", "lato", "letnia", "letnie", "summer", "beach", "słoneczne"],
    boostKeywords: ["okular", "kapelusz", "torb", "lato", "letn", "summer", "beach", "sunglass"],
    suggestedQuery: "Okulary przeciwsłoneczne, kapelusze i letnie dodatki",
    colorHints: ["jasne", "słoneczne", "pastelowe", "błękit", "żółty"]
  },
  {
    id: "winter_jackets",
    label: "Kurtki Zimowe & Puchowe Puffer",
    shortLabel: "❄ Kurtki / Zima",
    seasonId: "autumn_winter",
    seasonLabel: "Zima",
    seasonIcon: "❄️",
    icon: "❄️",
    triggers: [
      "kurtka", "kurtki", "puffer", "puchowa", "puchowka", "puchówka", "jacket",
      "jackets", "parka", "kożuch", "narciarska", "ocieplana", "ocieplacz", "zimowa", "zimowe"
    ],
    sinsayQueryKeywords: ["kurtka", "kurtki", "jacket", "zima", "zimowa", "zimowe", "winter", "ciepłe", "otul", "puchowa", "mroźne"],
    boostKeywords: ["kurtk", "jacket", "zima", "zimow", "winter", "ciepł", "otul", "mroźn"],
    suggestedQuery: "Ciepłe kurtki zimowe i fasony puffer na mroźne dni",
    colorHints: ["stonowane", "ciemne", "czarny", "oliwkowy", "beż", "biel"]
  },
  {
    id: "winter_boots",
    label: "Buty Zimowe & Kozaki / Śniegowce",
    shortLabel: "👢 Buty Zimowe",
    seasonId: "autumn_winter",
    seasonLabel: "Zima",
    seasonIcon: "❄️",
    icon: "👢",
    triggers: [
      "buty zimowe", "kozaki", "kozak", "śniegowce", "sniegowce", "botki", "trapery",
      "traper", "sztyblety", "winter boots", "boots", "ocieplane buty", "futerko"
    ],
    sinsayQueryKeywords: ["buty", "shoes", "zima", "zimowa", "winter", "kozaki", "śniegowce", "kolekcja", "nowości"],
    boostKeywords: ["buty", "shoes", "zima", "zimow", "winter", "kozak", "botk", "traper"],
    suggestedQuery: "Zimowe buty, kozaki i botki na chłodne dni",
    colorHints: ["brąz", "czarny", "karmel", "beż"]
  },
  {
    id: "summer_shoes",
    label: "Klapki, Sandały & Buty Letnie",
    shortLabel: "🩴 Klapki / Plaża",
    seasonId: "spring_summer",
    seasonLabel: "Wiosna / Lato",
    seasonIcon: "☀️",
    icon: "🩴",
    triggers: [
      "klapki", "klapek", "sandały", "sandaly", "sandals", "japonki", "espadryle",
      "letnie buty", "flip flops", "slides", "koturny", "plażowe buty"
    ],
    sinsayQueryKeywords: ["klapki", "sandały", "buty", "lato", "letnia", "summer", "plaża", "beach", "lekkie"],
    boostKeywords: ["klapk", "sandał", "buty", "shoes", "lato", "letn", "summer", "beach"],
    suggestedQuery: "Klapki i sandały na plażę oraz letnie spacery",
    colorHints: ["piasek", "złoto", "biel", "pastel"]
  },
  {
    id: "beachwear",
    label: "Stroje Kąpielowe & Beachwear",
    shortLabel: "👙 Stroje & Plaża",
    seasonId: "spring_summer",
    seasonLabel: "Lato / Plaża",
    seasonIcon: "🌊",
    icon: "👙",
    triggers: [
      "strój kąpielowy", "stroj kapielowy", "bikini", "kostium", "kąpielówki",
      "swimsuit", "swimwear", "pareo", "monokini", "plaża", "plaza", "beachwear"
    ],
    sinsayQueryKeywords: ["stroje", "kąpielowe", "bikini", "swim", "swimsuit", "beach", "plażowe", "lato", "summer", "wakacje"],
    boostKeywords: ["strój", "k?pielow", "kąpielow", "swim", "beach", "plaż", "lato", "summer"],
    suggestedQuery: "Stroje kąpielowe, bikini i moda plażowa Sinsay",
    colorHints: ["neon", "koral", "turkus", "słońce"]
  },
  {
    id: "coats_trenches",
    label: "Płaszcze & Trencze / Kolekcja Jesienna",
    shortLabel: "🧥 Płaszcze / Jesień",
    seasonId: "autumn_winter",
    seasonLabel: "Jesień / Zima",
    seasonIcon: "🍂",
    icon: "🧥",
    triggers: [
      "płaszcz", "plaszcz", "trencz", "trench", "prochowiec", "coat", "coats",
      "wełniany płaszcz", "camel", "dyplomatka", "jesienny płaszcz"
    ],
    sinsayQueryKeywords: ["płaszcze", "trencze", "coat", "jesień", "autumn", "nowości", "trend", "kurtka", "warstwy"],
    boostKeywords: ["p?aszcz", "płaszcz", "trencz", "coat", "jesie", "autumn", "kolekcj"],
    suggestedQuery: "Klasyczne trencze i stylowe płaszcze na nowy sezon",
    colorHints: ["camel", "beż", "khaki", "karmel", "czerń"]
  },
  {
    id: "sweaters_knitwear",
    label: "Swetry & Dzianiny / Otul się ciepłem",
    shortLabel: "🧶 Swetry / Dzianiny",
    seasonId: "autumn_winter",
    seasonLabel: "Jesień / Zima",
    seasonIcon: "🧶",
    icon: "🧶",
    triggers: [
      "sweter", "swetry", "sweater", "sweaters", "golf", "półgolf", "kardigan",
      "cardigan", "dzianina", "dzianiny", "knitwear", "wełna", "wool", "polar", "fleece"
    ],
    sinsayQueryKeywords: ["sweter", "swetry", "dzianiny", "ciepłe", "otul", "jesień", "autumn", "zima", "winter", "fasony"],
    boostKeywords: ["sweter", "sweater", "dzianin", "knit", "ciepł", "otul", "jesie", "autumn", "zima"],
    suggestedQuery: "Ciepłe swetry, golfy i otulające dzianiny",
    colorHints: ["ecru", "szary", "czekolada", "kremowy"]
  },
  {
    id: "dresses_party",
    label: "Sukienki & Kolekcja Party / Elegancja",
    shortLabel: "👗 Sukienki / Party",
    seasonId: "party_evening",
    seasonLabel: "Party / Wieczór",
    seasonIcon: "✨",
    icon: "👗",
    triggers: [
      "sukienka", "sukienki", "dress", "dresses", "wieczorowa", "koktajlowa",
      "satyna", "satynowa", "satin", "cekiny", "cekinowa", "sequin", "garnitur",
      "marynarka", "blazer", "szpilki", "mała czarna", "party"
    ],
    sinsayQueryKeywords: ["sukienki", "sukienka", "dress", "dresses", "party", "wieczór", "elegancja", "nowości", "okazje", "święta"],
    boostKeywords: ["sukienk", "dress", "party", "wieczór", "eleganck", "okazj", "błyszcz"],
    suggestedQuery: "Sukienki na każdą okazję, stylizacje party i wieczorowe",
    colorHints: ["czerń", "czerwień", "złoto", "srebro", "bordo"]
  },
  {
    id: "denim_jeans",
    label: "Jeans & Kolekcja Denim",
    shortLabel: "👖 Jeans & Denim",
    seasonId: "all_season",
    seasonLabel: "Całoroczne",
    seasonIcon: "🌿",
    icon: "👖",
    triggers: [
      "jeans", "jeansy", "denim", "katana", "spodnie jeansowe", "skinny", "wide leg",
      "mom jeans", "biodrówki", "dżins", "dżinsy"
    ],
    sinsayQueryKeywords: ["jeans", "denim", "spodnie", "trousers", "kolekcja", "nowości", "trendy"],
    boostKeywords: ["jeans", "denim", "spodni", "trousers"],
    suggestedQuery: "Z miłości do jeansu – kultowe fasony i nowości denim",
    colorHints: ["indygo", "błękit", "grafit", "spierany błękit"]
  },
  {
    id: "best_prices",
    label: "Super Ceny & Hity Tygodnia",
    shortLabel: "🏷 Super Ceny",
    seasonId: "promotions",
    seasonLabel: "Promocje",
    seasonIcon: "🏷️",
    icon: "🏷️",
    triggers: [
      "cena", "ceny", "rabat", "promocja", "wyprzedaż", "okazja", "taniej", "hit", "bestseller",
      "super ceny", "wielka wyprzedaż", "special price", "sale"
    ],
    sinsayQueryKeywords: ["cenach", "ceny", "super", "rabat", "okazja", "wyprzedaż", "hity", "taniej", "specjalnie"],
    boostKeywords: ["cen", "super", "okazj", "promocj", "wyprzeda", "rabat"],
    suggestedQuery: "Najlepsze ceny i hity sezonu czekają w Sinsay",
    colorHints: ["czerwień", "biel", "żółty"]
  }
];

/**
 * Normalizes text removing Polish diacritics and symbols for robust search comparison.
 */
export function normalizeForSearch(str: string): string {
  const polishMap: Record<string, string> = {
    ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
    Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n", Ó: "o", Ś: "s", Ź: "z", Ż: "z"
  };
  return (str || "")
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (m) => polishMap[m] || m)
    .toLowerCase()
    .replace(/\?/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fixWordCase(match: string, replacement: string): string {
  if (match[0] === match[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Repairs known encoding artifacts in legacy Sinsay multilingual translations (PL, RO, CZ, SK, DE)
 * and detects corrupted non-Latin scripts (Cyrillic/Greek exported as "???? ???") to trigger clean fallbacks.
 */
export function repairMultilingualText(text: string, lang: string = "PL"): string {
  if (!text || typeof text !== "string") return "";
  let s = text.trim();
  if (!s) return "";

  // Check if completely corrupted non-Latin script (UA, BG, GR, MK, KZ, GE) exported as "??? ????"
  const qCount = (s.match(/\?/g) || []).length;
  if (
    s.includes("???") ||
    (s.length > 3 && qCount / s.length > 0.25) ||
    (qCount >= 3 && s.split(/\s+/).every((w) => w.includes("?")))
  ) {
    return ""; // signal corruption to trigger clean fallback (e.g. ENG or PL)
  }

  const upperLang = (lang || "PL").toUpperCase();

  // POLISH
  if (upperLang === "PL" || upperLang === "PL-PL") {
    // 1. Abstract nouns ending in -ość
    s = s.replace(/([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)o\?\?/gi, (_m, root) => root + "ość");

    // 2. Imperatives ending in -dź, -ź, -ń
    s = s.replace(/([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)d\?([ ,.!?:;]|$)/gi, (_m, root, punct) => root + "dź" + punct);
    s = s.replace(/(^|\s)we\?([ ,.!?:;]|$)/gi, "$1weź$2");
    s = s.replace(/(^|\s)zosta\?([ ,.!?:;]|$)/gi, "$1zostań$2");
    s = s.replace(/(^|\s)b\?d\?([ ,.!?:;]|$)/gi, "$1bądź$2");

    // 3. Whole words and high-frequency stems
    s = s.replace(/ca\?ej/gi, (m) => fixWordCase(m, "całej"));
    s = s.replace(/ca\?y/gi, (m) => fixWordCase(m, "cały"));
    s = s.replace(/ca\?a/gi, (m) => fixWordCase(m, "cała"));
    s = s.replace(/ca\?e/gi, (m) => fixWordCase(m, "całe"));
    s = s.replace(/ca\?ego/gi, (m) => fixWordCase(m, "całego"));
    s = s.replace(/ca\?ym/gi, (m) => fixWordCase(m, "całym"));
    s = s.replace(/pe\?ne/gi, (m) => fixWordCase(m, "pełne"));
    s = s.replace(/pe\?na/gi, (m) => fixWordCase(m, "pełna"));
    s = s.replace(/pe\?en/gi, (m) => fixWordCase(m, "pełen"));
    s = s.replace(/pe\?ny/gi, (m) => fixWordCase(m, "pełny"));
    s = s.replace(/ciep\?e/gi, (m) => fixWordCase(m, "ciepłe"));
    s = s.replace(/ciep\?o/gi, (m) => fixWordCase(m, "ciepło"));
    s = s.replace(/ciep\?y/gi, (m) => fixWordCase(m, "ciepły"));
    s = s.replace(/ciep\?a/gi, (m) => fixWordCase(m, "ciepła"));
    s = s.replace(/szko\?y/gi, (m) => fixWordCase(m, "szkoły"));
    s = s.replace(/szko\?a/gi, (m) => fixWordCase(m, "szkoła"));
    s = s.replace(/szko\?e/gi, (m) => fixWordCase(m, "szkole"));
    s = s.replace(/ka\?deg/gi, (m) => fixWordCase(m, "każdeg"));
    s = s.replace(/ka\?dej/gi, (m) => fixWordCase(m, "każdej"));
    s = s.replace(/ka\?dym/gi, (m) => fixWordCase(m, "każdym"));
    s = s.replace(/ka\?dy/gi, (m) => fixWordCase(m, "każdy"));
    s = s.replace(/ka\?da/gi, (m) => fixWordCase(m, "każda"));
    s = s.replace(/ka\?de/gi, (m) => fixWordCase(m, "każde"));
    s = s.replace(/ka\?d\?/gi, (m) => fixWordCase(m, "każdą"));
    s = s.replace(/(^|\s|[(\["'])co\?([ ,.!?:;]|$)/gi, "$1coś$2");
    s = s.replace(/(^|\s|[(\["'])kto\?([ ,.!?:;]|$)/gi, "$1ktoś$2");
    s = s.replace(/(^|\s|[(\["'])komu\?([ ,.!?:;]|$)/gi, "$1komuś$2");
    s = s.replace(/(^|\s|[(\["'])\?e([ ,.!?:;]|$)/gi, "$1że$2");
    s = s.replace(/jesie\?/gi, (m) => fixWordCase(m, "jesień"));
    s = s.replace(/dzie\?/gi, (m) => fixWordCase(m, "dzień"));
    s = s.replace(/przestrze\?/gi, (m) => fixWordCase(m, "przestrzeń"));
    s = s.replace(/niezb\?dn/gi, (m) => fixWordCase(m, "niezbędn"));
    s = s.replace(/wn\?trz/gi, (m) => fixWordCase(m, "wnętrz"));
    s = s.replace(/zewn\?trz/gi, (m) => fixWordCase(m, "zewnętrz"));
    s = s.replace(/wyj\?tkow/gi, (m) => fixWordCase(m, "wyjątkow"));
    s = s.replace(/przyj\?c/gi, (m) => fixWordCase(m, "przyjęc"));
    s = s.replace(/(^|\s|[(\["'])\?lub/gi, "$1ślub");
    s = s.replace(/(^|\s|[(\["'])\?wi\?t/gi, "$1święt");
    s = s.replace(/(^|\s|[(\["'])\?wie\?/gi, "$1śwież");
    s = s.replace(/(^|\s|[(\["'])\?wiec/gi, "$1świec");
    s = s.replace(/(^|\s|[(\["'])\?wiat/gi, "$1świat");
    s = s.replace(/(^|\s|[(\["'])\?niadan/gi, "$1śniadan");
    s = s.replace(/(^|\s|[(\["'])\?led/gi, "$1śled");
    s = s.replace(/(^|\s|[(\["'])\?yci/gi, "$1życi");
    s = s.replace(/(^|\s|[(\["'])\?yj/gi, "$1żyj");
    s = s.replace(/(^|\s|[(\["'])\?ycz/gi, "$1życz");
    s = s.replace(/czu\?o\?ci/gi, (m) => fixWordCase(m, "czułości"));
    s = s.replace(/czu\?o\?c/gi, (m) => fixWordCase(m, "czułość"));
    s = s.replace(/korzy\?ci/gi, (m) => fixWordCase(m, "korzyści"));
    s = s.replace(/korzy\?c/gi, (m) => fixWordCase(m, "korzyść"));
    s = s.replace(/mi\?o\?ci/gi, (m) => fixWordCase(m, "miłości"));
    s = s.replace(/mi\?o\?c/gi, (m) => fixWordCase(m, "miłość"));
    s = s.replace(/mi\?kk/gi, (m) => fixWordCase(m, "miękk"));
    s = s.replace(/pla\?ow/gi, (m) => fixWordCase(m, "plażow"));
    s = s.replace(/pla\?([ ,.!?:;]|$)/gi, "plaż$1");
    s = s.replace(/sprzeda\?([ ,.!?:;]|$)/gi, "sprzedaż$1");
    s = s.replace(/bieli\?n/gi, (m) => fixWordCase(m, "bielizn"));
    s = s.replace(/bi\?uter/gi, (m) => fixWordCase(m, "biżuter"));
    s = s.replace(/p\?aszcz/gi, (m) => fixWordCase(m, "płaszcz"));
    s = s.replace(/g\?ówn/gi, (m) => fixWordCase(m, "główn"));
    s = s.replace(/po\?\?cz/gi, (m) => fixWordCase(m, "połącz"));
    s = s.replace(/(^|\s)\?\?cz/gi, "$1łącz");
    s = s.replace(/w\?\?cz/gi, (m) => fixWordCase(m, "włącz"));
    s = s.replace(/jeste\?my/gi, (m) => fixWordCase(m, "jesteśmy"));
    s = s.replace(/niemowl\?t/gi, (m) => fixWordCase(m, "niemowląt"));
    s = s.replace(/dziewcz\?t/gi, (m) => fixWordCase(m, "dziewcząt"));
    s = s.replace(/ch\?op/gi, (m) => fixWordCase(m, "chłop"));
    s = s.replace(/najm\?odsz/gi, (m) => fixWordCase(m, "najmłodsz"));
    s = s.replace(/stó\?/gi, (m) => fixWordCase(m, "stół"));
    s = s.replace(/porz\?dk/gi, (m) => fixWordCase(m, "porządk"));
    s = s.replace(/pi\?am/gi, (m) => fixWordCase(m, "piżam"));
    s = s.replace(/dzieci\?c/gi, (m) => fixWordCase(m, "dziecięc"));
    s = s.replace(/m\?sk/gi, (m) => fixWordCase(m, "męsk"));
    s = s.replace(/czekaj\?/gi, (m) => fixWordCase(m, "czekają"));
    s = s.replace(/si\?([ ,.!?:;]|$)/gi, "się$1");
    s = s.replace(/ju\?([ ,.!?:;]|$)/gi, "już$1");
    s = s.replace(/dzi\?([ ,.!?:;]|$)/gi, "dziś$1");
    s = s.replace(/te\?([ ,.!?:;]|$)/gi, "też$1");
    s = s.replace(/wiosn\?([ ,.!?:;]|$)/gi, "wiosnę$1");
    s = s.replace(/zim\?([ ,.!?:;]|$)/gi, "zimę$1");
    s = s.replace(/ofert\?([ ,.!?:;]|$)/gi, "ofertę$1");
    s = s.replace(/zabaw\?([ ,.!?:;]|$)/gi, "zabawę$1");
    s = s.replace(/okazj\?([ ,.!?:;]|$)/gi, "okazję$1");
    s = s.replace(/pogod\?([ ,.!?:;]|$)/gi, "pogodę$1");
    s = s.replace(/swoj\?([ ,.!?:;]|$)/gi, "swoją$1");
    s = s.replace(/twoj\?([ ,.!?:;]|$)/gi, "Twoją$1");
    s = s.replace(/now\?([ ,.!?:;]|$)/gi, "nową$1");
    s = s.replace(/r\?k/gi, (m) => fixWordCase(m, "ręk"));
    s = s.replace(/wy\?wietl/gi, (m) => fixWordCase(m, "wyświetl"));
    s = s.replace(/przegl\?d/gi, (m) => fixWordCase(m, "przegląd"));
    s = s.replace(/pomys\?/gi, (m) => fixWordCase(m, "pomysł"));
    s = s.replace(/zmys\?/gi, (m) => fixWordCase(m, "zmysł"));
    s = s.replace(/w\?asn/gi, (m) => fixWordCase(m, "własn"));
    s = s.replace(/zasi\?g/gi, (m) => fixWordCase(m, "zasięg"));
    s = s.replace(/niespodziank\?/gi, (m) => fixWordCase(m, "niespodziankę"));
    s = s.replace(/bie\?\?co/gi, (m) => fixWordCase(m, "bieżąco"));
    s = s.replace(/nasz\?([ ,.!?:;]|$)/gi, "naszą$1");
    s = s.replace(/wasz\?([ ,.!?:;]|$)/gi, "waszą$1");
    s = s.replace(/kobiet\?([ ,.!?:;]|$)/gi, "kobietą$1");
    s = s.replace(/szaf\?([ ,.!?:;]|$)/gi, "szafę$1");
    s = s.replace(/list\?([ ,.!?:;]|$)/gi, "listę$1");
    s = s.replace(/urz\?d/gi, (m) => fixWordCase(m, "urząd"));
    s = s.replace(/k\?t([ ,.!?:;]|$)/gi, "kąt$1");
    s = s.replace(/wi\?c([ ,.!?:;]|$)/gi, "więc$1");
    s = s.replace(/wi\?cej/gi, (m) => fixWordCase(m, "więcej"));
    s = s.replace(/dzi\?k/gi, (m) => fixWordCase(m, "dzięk"));
    s = s.replace(/b\?d/gi, (m) => fixWordCase(m, "będ"));
    s = s.replace(/pi\?kn/gi, (m) => fixWordCase(m, "piękn"));
    s = s.replace(/kupuj\?([ ,.!?:;]|$)/gi, "kupuję$1");
    s = s.replace(/z\s+aplikacj\?/gi, "z aplikacją");
    s = s.replace(/aplikacj\?([ ,.!?:;]|$)/gi, "aplikację$1");
    s = s.replace(/kolekcj\?([ ,.!?:;]|$)/gi, "kolekcję$1");
    s = s.replace(/stylizacj\?([ ,.!?:;]|$)/gi, "stylizację$1");
    s = s.replace(/promocj\?([ ,.!?:;]|$)/gi, "promocję$1");
    s = s.replace(/inspiracj\?([ ,.!?:;]|$)/gi, "inspirację$1");
    s = s.replace(/([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)n\?([ ,.!?:;]|$)/gi, (_m, root, p) => root + "ną" + p);
    s = s.replace(/([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)k\?([ ,.!?:;]|$)/gi, (_m, root, p) => root + "kę" + p);
    s = s.replace(/by\?o([ ,.!?:;]|$)/gi, "było$1");
    s = s.replace(/by\?a([ ,.!?:;]|$)/gi, "była$1");
    s = s.replace(/by\?([ ,.!?:;]|$)/gi, "był$1");
    s = s.replace(/marze\?([ ,.!?:;]|$)/gi, "marzeń$1");
    s = s.replace(/(^|\s)\?azienk/gi, "$1łazienk");
  }

  // ROMANIAN
  if (upperLang === "RO") {
    s = s.replace(/(^|\s|[(\["'])\?i([ ,.!?:;]|$)/gi, "$1și$2");
    s = s.replace(/var\?([ ,.!?:;]|$)/gi, "vară$1");
    s = s.replace(/iarn\?([ ,.!?:;]|$)/gi, "iarnă$1");
    s = s.replace(/toamn\?([ ,.!?:;]|$)/gi, "toamnă$1");
    s = s.replace(/prim\?var\?([ ,.!?:;]|$)/gi, "primăvară$1");
    s = s.replace(/prim\?var/gi, (m) => fixWordCase(m, "primăvar"));
    s = s.replace(/tendin\?e/gi, (m) => fixWordCase(m, "tendințe"));
    s = s.replace(/tendin\?a/gi, (m) => fixWordCase(m, "tendința"));
    s = s.replace(/colec\?ia/gi, (m) => fixWordCase(m, "colecția"));
    s = s.replace(/colec\?ie/gi, (m) => fixWordCase(m, "colecție"));
    s = s.replace(/colec\?ii/gi, (m) => fixWordCase(m, "colecții"));
    s = s.replace(/cr\?ciun/gi, (m) => fixWordCase(m, "crăciun"));
    s = s.replace(/(^|\s|[(\["'])\?inut/gi, "$1ținut");
    s = s.replace(/(^|\s|[(\["'])\?coal/gi, "$1școal");
    s = s.replace(/(^|\s|[(\["'])s\?([ ,.!?:;]|$)/gi, "$1să$2");
    s = s.replace(/t\?u([ ,.!?:;]|$)/gi, "tău$1");
    s = s.replace(/plaj\?([ ,.!?:;]|$)/gi, "plajă$1");
    s = s.replace(/cas\?([ ,.!?:;]|$)/gi, "casă$1");
    s = s.replace(/acas\?([ ,.!?:;]|$)/gi, "acasă$1");
    s = s.replace(/mod\?([ ,.!?:;]|$)/gi, "modă$1");
    s = s.replace(/descoper\?([ ,.!?:;]|$)/gi, "descoperă$1");
    s = s.replace(/pa\?te/gi, (m) => fixWordCase(m, "paște"));
    s = s.replace(/distrac\?ie/gi, (m) => fixWordCase(m, "distracție"));
    s = s.replace(/decora\?iun/gi, (m) => fixWordCase(m, "decorațiun"));
    s = s.replace(/plin\?([ ,.!?:;]|$)/gi, "plină$1");
    s = s.replace(/pre\?uri/gi, (m) => fixWordCase(m, "prețuri"));
    s = s.replace(/pre\?([ ,.!?:;]|$)/gi, "preț$1");
    s = s.replace(/creeaz\?([ ,.!?:;]|$)/gi, "creează$1");
    s = s.replace(/vacan\?\?([ ,.!?:;]|$)/gi, "vacanță$1");
    s = s.replace(/(^|\s)î\?i([ ,.!?:;]|$)/gi, "$1îți$2");
    s = s.replace(/c\?ldur/gi, (m) => fixWordCase(m, "căldur"));
    s = s.replace(/verific\?([ ,.!?:;]|$)/gi, "verifică$1");
    s = s.replace(/atmosfer\?([ ,.!?:;]|$)/gi, "atmosferă$1");
    s = s.replace(/elegant\?([ ,.!?:;]|$)/gi, "elegantă$1");
    s = s.replace(/elegan\?\?([ ,.!?:;]|$)/gi, "eleganță$1");
    s = s.replace(/buc\?t\?ri/gi, (m) => fixWordCase(m, "bucătări"));
    s = s.replace(/perfect\?([ ,.!?:;]|$)/gi, "perfectă$1");
    s = s.replace(/îmbr\?c\?mint/gi, (m) => fixWordCase(m, "îmbrăcămint"));
    s = s.replace(/gr\?din\?([ ,.!?:;]|$)/gi, "grădină$1");
    s = s.replace(/b\?rba\?i/gi, (m) => fixWordCase(m, "bărbați"));
    s = s.replace(/b\?iat([ ,.!?:;]|$)/gi, "băiat$1");
    s = s.replace(/b\?ie\?i/gi, (m) => fixWordCase(m, "băieți"));
    s = s.replace(/feti\?e/gi, (m) => fixWordCase(m, "fetițe"));
    s = s.replace(/cump\?r/gi, (m) => fixWordCase(m, "cumpăr"));
    s = s.replace(/preg\?te\?te/gi, (m) => fixWordCase(m, "pregătește"));
    s = s.replace(/nou\?([ ,.!?:;]|$)/gi, "nouă$1");
    s = s.replace(/nout\?\?i/gi, (m) => fixWordCase(m, "noutăți"));
    s = s.replace(/confortabil\?([ ,.!?:;]|$)/gi, "confortabilă$1");
    s = s.replace(/bebelu\?i/gi, (m) => fixWordCase(m, "bebeluși"));
    s = s.replace(/edi\?ie/gi, (m) => fixWordCase(m, "ediție"));
    s = s.replace(/spa\?iu/gi, (m) => fixWordCase(m, "spațiu"));
    s = s.replace(/e\?ti([ ,.!?:;]|$)/gi, "ești$1");
    s = s.replace(/aplica\?ie/gi, (m) => fixWordCase(m, "aplicație"));
    s = s.replace(/toat\?([ ,.!?:;]|$)/gi, "toată$1");
    s = s.replace(/f\?r\?([ ,.!?:;]|$)/gi, "fără$1");
    s = s.replace(/mam\?([ ,.!?:;]|$)/gi, "mamă$1");
    s = s.replace(/g\?se\?te/gi, (m) => fixWordCase(m, "găsește"));
    s = s.replace(/g\?se\?ti/gi, (m) => fixWordCase(m, "găsești"));
    s = s.replace(/înc\?l\?\?minte/gi, (m) => fixWordCase(m, "încălțăminte"));
    s = s.replace(/garderob\?([ ,.!?:;]|$)/gi, "garderobă$1");
    s = s.replace(/tandre\?e/gi, (m) => fixWordCase(m, "tandrețe"));
    s = s.replace(/nun\?i/gi, (m) => fixWordCase(m, "nunți"));
  }

  // CZECH / SLOVAK
  if (upperLang === "CZ" || upperLang === "SK") {
    s = s.replace(/speciáln\?/gi, (m) => fixWordCase(m, "speciálně"));
    s = s.replace(/d\?ti/gi, (m) => fixWordCase(m, "děti"));
    s = s.replace(/ve\?k/gi, (m) => fixWordCase(m, "veľk"));
    s = s.replace(/novink\?/gi, (m) => fixWordCase(m, "novinky"));
    s = s.replace(/kolekc\?/gi, (m) => fixWordCase(m, "kolekci"));
  }

  // GERMAN
  if (upperLang === "DE") {
    s = s.replace(/m\?dchen/gi, (m) => fixWordCase(m, "Mädchen"));
    s = s.replace(/(^|\s)f\?r([ ,.!?:;]|$)/gi, "$1für$2");
    s = s.replace(/sch\?n/gi, (m) => fixWordCase(m, "schön"));
    s = s.replace(/gro\?/gi, (m) => fixWordCase(m, "groß"));
  }

  // Strip residual internal question mark between letters (e.g. "a?b" -> "ab")
  s = s.replace(/([a-zA-Z\u00C0-\u024F])\?([a-zA-Z\u00C0-\u024F])/g, "$1$2");

  // If ends with a question mark that is not an actual question (fashion promo banners), remove trailing ?
  const isQuestion = /^(co|jak|gdzie|kiedy|czy|de ce|cum|unde|what|how|why|where)\b/i.test(s);
  if (!isQuestion && s.endsWith("?")) {
    s = s.slice(0, -1).trim();
  }

  return s;
}

/**
 * Repairs known encoding artifacts in the legacy Polish Sinsay translation database.
 * Preserved for backwards compatibility, delegating to repairMultilingualText.
 */
export function repairPolishText(text: string): string {
  return repairMultilingualText(text, "PL");
}

export interface DetectedFashionContext {
  category: FashionCategory;
  seasonLabel: string;
  seasonIcon: string;
  confidence: number;
  matchReason: string;
  recommendedQuery: string;
  tags: string[];
}

/**
 * Detects fashion product category, season, and Sinsay query expansion
 * from filename, description prompt, and visual color palette.
 */
export function detectFashionContext(input: {
  filename?: string;
  prompt?: string;
  colorTone?: string;
}): DetectedFashionContext {
  const rawText = `${input.filename || ""} ${input.prompt || ""}`;
  const normalized = normalizeForSearch(rawText);

  let bestCategory = FASHION_CATEGORIES[0];
  let highestScore = 0;
  let matchedKeyword = "";
  let matchedSource = "";

  for (const cat of FASHION_CATEGORIES) {
    let catScore = 0;
    for (const trig of cat.triggers) {
      const normTrig = normalizeForSearch(trig);
      if (normalized.includes(normTrig)) {
        // Filename exact match has highest priority; longer, more specific matches (e.g. "buty zimowe" vs "zimowe") score higher
        const inFilename = input.filename && normalizeForSearch(input.filename).includes(normTrig);
        const specificityBonus = Math.min(25, normTrig.length * 2);
        const points = (inFilename ? 50 : 30) + specificityBonus;
        if (points > catScore) {
          catScore = points;
          matchedKeyword = trig;
          matchedSource = inFilename ? `nazwy pliku "${input.filename}"` : `opisu promptu`;
        }
      }
    }

    if (catScore > highestScore) {
      highestScore = catScore;
      bestCategory = cat;
    }
  }

  // If no specific match was found, fall back to default or seasonal cues
  if (highestScore === 0) {
    // Check if user uploaded something with "lato" / "summer" or "zima" / "winter"
    if (normalized.includes("lato") || normalized.includes("summer") || normalized.includes("sun")) {
      bestCategory = FASHION_CATEGORIES.find((c) => c.id === "sunglasses_accessories") || FASHION_CATEGORIES[0];
      highestScore = 15;
      matchedKeyword = "lato / słońce";
      matchedSource = "ogólnej tematyki letniej";
    } else if (normalized.includes("zima") || normalized.includes("winter") || normalized.includes("cold")) {
      bestCategory = FASHION_CATEGORIES.find((c) => c.id === "winter_jackets") || FASHION_CATEGORIES[1];
      highestScore = 15;
      matchedKeyword = "zima / chłodne dni";
      matchedSource = "ogólnej tematyki zimowej";
    } else {
      // Default to New Trends / Super Ceny
      bestCategory = FASHION_CATEGORIES.find((c) => c.id === "best_prices") || FASHION_CATEGORIES[0];
      highestScore = 10;
      matchedKeyword = "Nowości & Hity";
      matchedSource = "kolekcji ogólnej Sinsay";
    }
  }

  const confidence = Math.min(99, 75 + highestScore);
  const matchReason = `Rozpoznano z ${matchedSource} [słowo kluczowe: "${matchedKeyword}"] → ${bestCategory.seasonLabel} (${bestCategory.label})`;

  return {
    category: bestCategory,
    seasonLabel: bestCategory.seasonLabel,
    seasonIcon: bestCategory.seasonIcon,
    confidence,
    matchReason,
    recommendedQuery: `${bestCategory.suggestedQuery} ${bestCategory.sinsayQueryKeywords.slice(0, 4).join(" ")}`,
    tags: [
      bestCategory.icon + " " + bestCategory.shortLabel,
      bestCategory.seasonIcon + " " + bestCategory.seasonLabel,
      confidence + "% Trafności AI"
    ]
  };
}
