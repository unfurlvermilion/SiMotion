import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  FASHION_CATEGORIES,
  normalizeForSearch,
  repairPolishText,
  detectFashionContext,
  FashionCategory,
} from "@/lib/fashionClassifier";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      query = "",
      categoryId = null,
      filename = "",
      colorTone = "",
      limit = 20,
    } = body;

    const entries = getSinsayEntries();
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Baza haseł Sinsay jest pusta" },
        { status: 500 }
      );
    }

    // 1. Detect or apply fashion context & season
    let activeCategory: FashionCategory | undefined;
    if (categoryId) {
      activeCategory = FASHION_CATEGORIES.find((c) => c.id === categoryId);
    }

    const detectedContext = detectFashionContext({
      filename,
      prompt: query,
      colorTone,
    });

    if (!activeCategory) {
      activeCategory = detectedContext.category;
    }

    const cleanQuery = (query || "").trim();
    const normalizedQuery = normalizeForSearch(cleanQuery);
    const queryTokens = normalizedQuery.split(/\s+/).filter((w) => w.length > 2);

    // 2. Score each phrase from the 4,524 database entries
    const scored = entries.map((entry: any) => {
      let score = 0;
      const plRepaired = repairPolishText(entry.pl);
      const plNorm = normalizeForSearch(plRepaired);
      const enNorm = normalizeForSearch(entry.en || "");
      const combinedNorm = `${plNorm} ${enNorm}`;

      // A. Category & Season Boosting (The core requirement for sunglasses -> summer, winter boots/jacket -> winter)
      if (activeCategory) {
        // Boost keywords (e.g. kurtk, jacket, zima, zimow, okulary, summer, etc.)
        for (const bk of activeCategory.boostKeywords) {
          const normBk = normalizeForSearch(bk);
          if (plNorm.includes(normBk) || enNorm.includes(normBk)) {
            score += 55;
            break;
          }
        }

        // Secondary category keywords
        for (const kw of activeCategory.sinsayQueryKeywords) {
          const normKw = normalizeForSearch(kw);
          if (combinedNorm.includes(normKw)) {
            score += 20;
          }
        }
      }

      // B. Query matching if user typed a specific query
      if (cleanQuery.length > 0 && cleanQuery !== activeCategory?.suggestedQuery) {
        if (plNorm.includes(normalizedQuery)) {
          score += 60;
        } else if (enNorm.includes(normalizedQuery)) {
          score += 45;
        }

        queryTokens.forEach((qt) => {
          if (plNorm.includes(qt)) score += 18;
          if (enNorm.includes(qt)) score += 12;
        });
      }

      // C. Market coverage bonus (phrases translated to many markets are better)
      const marketCount = entry.translations ? Object.keys(entry.translations).length : 1;
      if (marketCount >= 20) score += 12;
      else if (marketCount >= 10) score += 6;

      // D. Clean slogan length bonus (fashion copy should be catchy, not an essay)
      if (plRepaired.length >= 8 && plRepaired.length <= 48) {
        score += 8;
      } else if (plRepaired.length > 65) {
        score -= 10;
      }

      return {
        id: entry.id,
        pl: plRepaired,
        en: entry.en || "",
        rawScore: score,
        category: activeCategory?.label || "Bestsellery Sinsay",
        season: activeCategory?.seasonLabel || "Całoroczne",
        seasonIcon: activeCategory?.seasonIcon || "✨",
        translations: entry.translations || {},
      };
    });

    // 3. Sort descending by score
    scored.sort((a, b) => b.rawScore - a.rawScore);

    // 4. Return top recommendations with clean scores 80..99%
    const results = scored.slice(0, limit).map((item, idx) => {
      const normalizedPercentage = Math.min(
        99,
        Math.max(78, 98 - idx * 1.5 + (item.rawScore > 80 ? 2 : 0))
      );
      return {
        id: item.id,
        pl: item.pl,
        en: item.en,
        score: Math.round(normalizedPercentage),
        category: item.category,
        season: item.season,
        seasonIcon: item.seasonIcon,
        translations: item.translations,
      };
    });

    return NextResponse.json({
      status: "success",
      query: cleanQuery,
      activeCategory: {
        id: activeCategory.id,
        label: activeCategory.label,
        shortLabel: activeCategory.shortLabel,
        seasonId: activeCategory.seasonId,
        seasonLabel: activeCategory.seasonLabel,
        seasonIcon: activeCategory.seasonIcon,
        icon: activeCategory.icon,
      },
      detectedContext,
      totalMatched: results.length,
      results,
    });
  } catch (err: any) {
    console.error("sinsay-match route error:", err);
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
