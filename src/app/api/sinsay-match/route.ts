import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cached memory index of Sinsay phrases
let cachedEntries: any[] | null = null;

function getSinsayEntries() {
  if (cachedEntries) return cachedEntries;
  try {
    const filePath = path.join(process.cwd(), "src", "data", "sinsayTranslations.json");
    const content = fs.readFileSync(filePath, "utf-8");
    cachedEntries = JSON.parse(content);
    return cachedEntries;
  } catch (err) {
    console.error("Failed to load sinsayTranslations.json:", err);
    return [];
  }
}

// Tokenize and clean text into normalized words
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Fashion & Retail Keyword Category Dictionaries for Context Matching
const CATEGORY_MAP: Record<string, string[]> = {
  "Trendy & Nowości": ["nowości", "nowa", "nowy", "nowe", "trend", "trendy", "must", "have", "kolekcja", "capsule", "hit", "top"],
  "Promocje & Ceny": ["cena", "cenach", "rabat", "promocja", "wyprzedaż", "okazja", "tylko", "teraz", "kup", "taniej", "super"],
  "Sezon & Święta": ["jesień", "jesienne", "zima", "zimowe", "wiosna", "lato", "święta", "wielkanoc", "matki", "kobiet", "walentynki", "halloween"],
  "Kategorie & Styl": ["sukienka", "płaszcz", "kurtka", "koszula", "spodnie", "jeans", "denim", "buty", "kaszmir", "jedwab", "wełna", "elegancki", "casual"],
  "Dla Kogo": ["dla ciebie", "dla niej", "dla niego", "dziecko", "dzieci", "ona", "on", "mama"],
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, categoryHint, limit = 20 } = body;

    const entries = getSinsayEntries();
    if (!entries || entries.length === 0) {
      return NextResponse.json({ status: "error", message: "Baza haseł jest pusta" }, { status: 500 });
    }

    const cleanQuery = (query || "").trim();
    const queryTokens = tokenize(cleanQuery);

    // If query is empty, return 20 popular flagship Sinsay slogans
    if (queryTokens.length === 0) {
      const topDefaults = entries.slice(0, limit).map((e: any, idx: number) => ({
        id: e.id,
        pl: e.pl,
        en: e.en,
        score: Math.max(75, 99 - idx * 2),
        category: "Bestseller Sinsay",
        translations: e.translations,
      }));
      return NextResponse.json({
        status: "success",
        query: "",
        totalMatched: topDefaults.length,
        results: topDefaults,
      });
    }

    // Scoring algorithm for each entry
    const scored = entries.map((entry: any) => {
      let score = 0;
      const plLower = entry.pl.toLowerCase();
      const enLower = (entry.en || "").toLowerCase();
      const entryTokens = tokenize(entry.pl + " " + (entry.en || ""));

      // 1. Direct exact or substring phrase match (+50..80 points)
      if (plLower.includes(cleanQuery.toLowerCase())) {
        score += 70;
      }
      if (enLower.includes(cleanQuery.toLowerCase())) {
        score += 50;
      }

      // 2. Token overlap (+15 points per matched word)
      queryTokens.forEach((qt) => {
        if (plLower.includes(qt)) score += 20;
        if (enLower.includes(qt)) score += 12;
        if (entryTokens.includes(qt)) score += 10;
      });

      // 3. Category hint boost
      let matchedCategory = "Ogólne";
      for (const [catName, keywords] of Object.entries(CATEGORY_MAP)) {
        const queryHasCat = keywords.some((kw) => cleanQuery.toLowerCase().includes(kw));
        const entryHasCat = keywords.some((kw) => plLower.includes(kw));
        if (queryHasCat && entryHasCat) {
          score += 25;
          matchedCategory = catName;
          break;
        } else if (entryHasCat) {
          matchedCategory = catName;
        }
      }

      // Length penalty for excessively long text when looking for short copy slogans
      if (entry.pl.length > 60) score -= 8;

      return {
        id: entry.id,
        pl: entry.pl,
        en: entry.en,
        rawScore: score,
        category: matchedCategory,
        translations: entry.translations,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.rawScore - a.rawScore);

    // Pick top 20
    const top20 = scored.slice(0, limit).map((item, idx) => {
      // Normalize score into realistic percentage 78%..99%
      const normalizedPercentage = Math.min(99, Math.max(70, 98 - idx * 2 + (item.rawScore > 60 ? 2 : 0)));
      return {
        id: item.id,
        pl: item.pl,
        en: item.en,
        score: normalizedPercentage,
        category: item.category,
        translations: item.translations,
      };
    });

    return NextResponse.json({
      status: "success",
      query: cleanQuery,
      totalMatched: top20.length,
      results: top20,
    });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
