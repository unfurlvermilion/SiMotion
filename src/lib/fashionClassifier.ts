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

/**
 * Repairs known encoding artifacts in the legacy Polish Sinsay translation database.
 * Turns strings like "W roli g?ównej: kurtka" into "W roli głównej: kurtka",
 * "Zapisz si?" into "Zapisz się", "zim?" into "zimę", etc.
 */
export function repairPolishText(text: string): string {
  if (!text) return "";
  let s = text;
  const wordPairs: [RegExp, string][] = [
    [/(\b|[a-z])si\?(\b|[ ,.!\?:;])/gi, "$1się$2"],
    [/(\b|[a-z])ju\?(\b|[ ,.!\?:;])/gi, "$1już$2"],
    [/(\b|[a-z])dzi\?(\b|[ ,.!\?:;])/gi, "$1dziś$2"],
    [/(\b|[a-z])te\?(\b|[ ,.!\?:;])/gi, "$1też$2"],
    [/(\b|[a-z])wi\?cej(\b|[ ,.!\?:;])/gi, "$1więcej$2"],
    [/(\b|[a-z])b\?d\?(\b|[ ,.!\?:;])/gi, "$1bądź$2"],
    [/(\b|[a-z])we\?(\b|[ ,.!\?:;])/gi, "$1weź$2"],
    [/(\b)sprawd\?/gi, "Sprawdź"],
    [/(\b)odkryj\?/gi, "Odkryj"],
    [/(\b)odwied\?/gi, "Odwiedź"],
    [/(\b)zosta\?/gi, "Zostań"],
    [/(\b)dzie\?/gi, "Dzień"],
    [/kolekcj\?/gi, "kolekcję"],
    [/wiosn\?/gi, "wiosnę"],
    [/zim\?/gi, "zimę"],
    [/jesie\?/gi, "jesień"],
    [/p\?aszcz/gi, "płaszcz"],
    [/g\?ówn/gi, "główn"],
    [/ciep\?/gi, "ciepł"],
    [/ka\?d/gi, "każd"],
    [/mi\?o\?c/gi, "miłość"],
    [/wyj\?tkow/gi, "wyjątkow"],
    [/pi\?kn/gi, "piękn"],
    [/ch\?op/gi, "chłop"],
    [/dziewcz\?t/gi, "dziewcząt"],
    [/sukienk\?/gi, "sukienkę"],
    [/torb\?/gi, "torbę"],
    [/kurtk\?/gi, "kurtkę"],
    [/koszul\?/gi, "koszulę"],
    [/zni\?k/gi, "zniżk"],
    [/pla\?ow/gi, "plażow"],
    [/\?wi\?t/gi, "Świąt"],
    [/weso\?ych/gi, "Wesołych"],
    [/czekaj\?/gi, "czekają"],
    [/bestseller\?/gi, "bestseller"],
    [/now\?(\b|\s)/gi, "nową$1"],
    [/twoj\?(\b|\s)/gi, "Twoją$1"],
    [/swoj\?(\b|\s)/gi, "swoją$1"],
    [/najlepsz\?(\b|\s)/gi, "najlepszą$1"],
    [/letni\?(\b|\s)/gi, "letnią$1"],
    [/zimow\?(\b|\s)/gi, "zimową$1"],
    [/wyj\?tkow\?(\b|\s)/gi, "wyjątkową$1"],
    [/dzieci\?c/gi, "dziecięc"],
    [/m\?sk/gi, "męsk"],
    [/\?wie\?/gi, "śwież"]
  ];
  for (const [re, rep] of wordPairs) {
    s = s.replace(re, rep);
  }
  return s;
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
