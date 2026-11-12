"use client";

import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { BrandAsset } from "@/app/page";
import SinsayPhraseAssistant, { SINSAY_MARKETS, SinsayMatchItem } from "./SinsayPhraseAssistant";
import { repairMultilingualText } from "@/lib/fashionClassifier";

export const STATIC_RATIOS = [
  { id: "1:1", label: "1:1 · Kwadrat", width: 1080, height: 1080, aspectClass: "aspect-square" },
  { id: "3:4", label: "3:4 · Lookbook / Moda", width: 1080, height: 1440, aspectClass: "aspect-[3/4]" },
  { id: "4:5", label: "4:5 · Portret IG Feed", width: 1080, height: 1350, aspectClass: "aspect-[4/5]" },
  { id: "9:16", label: "9:16 · Story / Rolka / TikTok", width: 1080, height: 1920, aspectClass: "aspect-[9/16]" },
  { id: "4:3", label: "4:3 · Katalog poziomy", width: 1440, height: 1080, aspectClass: "aspect-[4/3]" },
  { id: "5:4", label: "5:4 · Poziomy", width: 1350, height: 1080, aspectClass: "aspect-[5/4]" },
  { id: "16:9", label: "16:9 · Poziomy Web / Banner", width: 1920, height: 1080, aspectClass: "aspect-[16/9]" },
  { id: "original", label: "Oryginał · Bez kadrowania", width: 0, height: 0, aspectClass: "aspect-auto" },
];

export type BackdropStyle = "clean" | "gradient" | "box-dark" | "box-white" | "box-sinsay";

interface StaticGraphicsViewProps {
  staticTexts: Record<string, { headline: string; subline: string }>;
  setStaticTexts: React.Dispatch<
    React.SetStateAction<Record<string, { headline: string; subline: string }>>
  >;
  activeStaticLang: string;
  setActiveStaticLang: (lang: string) => void;
  staticRatio: string;
  setStaticRatio: (ratio: string) => void;
  selectedStaticAssetId: string | null;
  assets: BrandAsset[];
  showToast: (msg: string) => void;
}

export const StaticGraphicsView: React.FC<StaticGraphicsViewProps> = ({
  staticTexts,
  setStaticTexts,
  activeStaticLang,
  setActiveStaticLang,
  staticRatio,
  setStaticRatio,
  selectedStaticAssetId,
  assets,
  showToast,
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedBgStyle, setSelectedBgStyle] = useState<"atelier" | "silk" | "obsidian" | "black">("atelier");
  
  // Layout customization state
  const [backdropStyle, setBackdropStyle] = useState<BackdropStyle>("box-dark");
  const [backdropWidth, setBackdropWidth] = useState<"fit" | "full">("fit");
  const [textYPercent, setTextYPercent] = useState<number>(76); // 10% - 90%
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0); // 0.6 to 1.5
  const [brandTagText, setBrandTagText] = useState<string>("SINSAY / NEW ARRIVALS");
  const [showBrandTag, setShowBrandTag] = useState<boolean>(true);

  // Markets selection for multi-language ZIP export
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["PL", "ENG", "DE", "RO", "CZ", "SK", "HU", "IT"]);
  const [showPhraseAssistant, setShowPhraseAssistant] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  const activeAsset = assets.find((a) => a.id === selectedStaticAssetId);

  // Active market normalized key
  const normalizedActiveLang = activeStaticLang.replace("-PL", "").replace("-US", "").replace("-DE", "").replace("-CZ", "").toUpperCase();
  const activeCopy = staticTexts[activeStaticLang] || staticTexts[normalizedActiveLang] || {
    headline: "Nowa kolekcja",
    subline: "Odkryj swój styl",
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
      showToast(`Wczytano zdjęcie: ${file.name}`);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setOriginalDimensions(null);
    showToast("Usunięto zdjęcie. Aktywne tło gradientowe.");
  };

  // Toggle market inclusion for export
  const toggleMarketSelection = (code: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(code) ? (prev.length > 1 ? prev.filter((c) => c !== code) : prev) : [...prev, code]
    );
  };

  // Apply phrase from Sinsay 4524 phrases database to all markets
  const handleApplyPhrase = (item: SinsayMatchItem) => {
    const newTexts: Record<string, { headline: string; subline: string }> = { ...staticTexts };
    
    // Polish
    const plClean = repairMultilingualText(item.pl, "PL");
    newTexts["PL"] = { headline: plClean, subline: "Kolekcja na Twój sposób · Sinsay" };
    newTexts["pl-PL"] = { headline: plClean, subline: "Kolekcja na Twój sposób · Sinsay" };

    // English
    const enText = repairMultilingualText(item.en || item.translations["ENG"] || item.pl, "ENG") || plClean;
    newTexts["ENG"] = { headline: enText, subline: "New Collection, your way · Sinsay" };
    newTexts["en-US"] = { headline: enText, subline: "New Collection, your way · Sinsay" };

    // All available translations
    if (item.translations) {
      Object.entries(item.translations).forEach(([mCode, translatedText]) => {
        if (translatedText) {
          const repaired = repairMultilingualText(translatedText, mCode);
          newTexts[mCode] = {
            headline: (repaired && !repaired.includes("?")) ? repaired : enText,
            subline: "Sinsay · Nowości",
          };
        }
      });
    }

    setStaticTexts(newTexts);
    setShowPhraseAssistant(false);
    showToast(`Zastosowano hasło Sinsay: "${plClean}" dla wszystkich rynków!`);
  };

  // Compute target canvas width and height based on selected ratio
  const getCanvasDimensions = () => {
    if (staticRatio === "original" && originalDimensions) {
      return { width: originalDimensions.width, height: originalDimensions.height };
    }
    const ratioConfig = STATIC_RATIOS.find((r) => r.id === staticRatio) || STATIC_RATIOS[0];
    return { width: ratioConfig.width || 1080, height: ratioConfig.height || 1080 };
  };

  // Core canvas render function used for both single PNG and multi-language ZIP
  const renderCanvasFrame = (
    canvas: HTMLCanvasElement,
    imgObj: HTMLImageElement | null,
    headline: string,
    subline: string
  ) => {
    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw Background
    if (imgObj) {
      if (staticRatio === "original") {
        ctx.drawImage(imgObj, 0, 0, width, height);
      } else {
        const imgRatio = imgObj.width / imgObj.height;
        const targetRatio = width / height;
        let sx = 0, sy = 0, sw = imgObj.width, sh = imgObj.height;
        if (imgRatio > targetRatio) {
          sw = imgObj.height * targetRatio;
          sx = (imgObj.width - sw) / 2;
        } else {
          sh = imgObj.width / targetRatio;
          sy = (imgObj.height - sh) / 2;
        }
        ctx.drawImage(imgObj, sx, sy, sw, sh, 0, 0, width, height);
      }
    } else {
      // Solid / Gradient backdrop
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (selectedBgStyle === "atelier") {
        grad.addColorStop(0, "#e8d7c3");
        grad.addColorStop(0.55, "#b58c75");
        grad.addColorStop(1, "#541826");
      } else if (selectedBgStyle === "silk") {
        grad.addColorStop(0, "#f7eee3");
        grad.addColorStop(0.6, "#c84b31");
        grad.addColorStop(1, "#2b1016");
      } else if (selectedBgStyle === "black") {
        grad.addColorStop(0, "#111111");
        grad.addColorStop(1, "#000000");
      } else {
        grad.addColorStop(0, "#211d1a");
        grad.addColorStop(0.7, "#14110f");
        grad.addColorStop(1, "#0a0807");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Text layout calculations
    const hSize = Math.round(Math.min(width, height) * 0.065 * fontSizeScale);
    const sSize = Math.round(hSize * 0.48);
    const tagSize = Math.round(hSize * 0.36);

    const targetY = height * (textYPercent / 100);
    const paddingX = Math.round(width * 0.07);

    // Measure texts for custom box/patch backdrop
    ctx.font = `700 ${hSize}px "Euclid Circular B", -apple-system, sans-serif`;
    const hMetrics = ctx.measureText(headline);
    ctx.font = `500 ${sSize}px "Euclid Circular B", -apple-system, sans-serif`;
    const sMetrics = ctx.measureText(subline);
    const maxTextWidth = Math.max(hMetrics.width, sMetrics.width);

    // 3. Draw Backdrop / Masking (to cover existing image text if requested)
    const isLightBox = backdropStyle === "box-white";
    const isDarkBox = backdropStyle === "box-dark";
    const isSinsayBox = backdropStyle === "box-sinsay";

    if (backdropStyle === "gradient") {
      const shadeY = Math.max(0, targetY - hSize * 2.5);
      const shade = ctx.createLinearGradient(0, shadeY, 0, height);
      shade.addColorStop(0, "rgba(10, 8, 7, 0)");
      shade.addColorStop(1, "rgba(10, 8, 7, 0.90)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, shadeY, width, height - shadeY);
    } else if (isDarkBox || isLightBox || isSinsayBox) {
      // Solid masking box (covers old text completely!)
      const boxPadY = Math.round(hSize * 0.5);
      const boxPadX = Math.round(hSize * 0.7);
      const totalTextH = (showBrandTag ? tagSize * 1.6 : 0) + hSize + sSize * 1.5;
      const boxTop = targetY - (showBrandTag ? tagSize * 1.6 : 0) - boxPadY;
      const boxH = totalTextH + boxPadY * 2;

      let boxLeft = paddingX - boxPadX;
      let boxW = maxTextWidth + boxPadX * 2;

      if (backdropWidth === "full") {
        boxLeft = 0;
        boxW = width;
      } else if (textAlign === "center") {
        boxLeft = width / 2 - boxW / 2;
      } else if (textAlign === "right") {
        boxLeft = width - paddingX - maxTextWidth - boxPadX;
      }

      ctx.save();
      ctx.fillStyle = isLightBox
        ? "rgba(255, 250, 245, 0.97)"
        : isSinsayBox
        ? "rgba(110, 29, 47, 0.96)"
        : "rgba(18, 14, 12, 0.94)";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 24;

      if (backdropWidth === "full") {
        ctx.fillRect(boxLeft, boxTop, boxW, boxH);
      } else {
        // Rounded box
        const radius = Math.round(hSize * 0.25);
        ctx.beginPath();
        ctx.roundRect(boxLeft, boxTop, boxW, boxH, radius);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Draw Brand Tag
    let alignX = paddingX;
    if (textAlign === "center") alignX = width / 2;
    if (textAlign === "right") alignX = width - paddingX;

    ctx.textAlign = textAlign;

    let currentCursorY = targetY;

    if (showBrandTag && brandTagText) {
      ctx.fillStyle = isLightBox ? "#877b72" : "#e8c9b9";
      ctx.font = `700 ${tagSize}px "Euclid Circular B", sans-serif`;
      ctx.fillText(brandTagText.toUpperCase(), alignX, currentCursorY - hSize * 0.9);
    }

    // 5. Draw Headline
    ctx.fillStyle = isLightBox ? "#14110f" : "#ffffff";
    ctx.font = `700 ${hSize}px "Euclid Circular B", -apple-system, sans-serif`;
    if (backdropStyle === "clean") {
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
    } else {
      ctx.shadowColor = "transparent";
    }
    ctx.fillText(headline, alignX, currentCursorY);

    // 6. Draw Subline
    currentCursorY += sSize * 1.35;
    ctx.fillStyle = isLightBox ? "#52463e" : "rgba(255, 255, 255, 0.88)";
    ctx.font = `500 ${sSize}px "Euclid Circular B", -apple-system, sans-serif`;
    ctx.fillText(subline, alignX, currentCursorY);

    // 7. Draw Badge (if active from brand kit)
    if (activeAsset) {
      const badgeW = Math.round(width * 0.22);
      const badgeH = Math.round(badgeW * 0.36);
      const badgeX = width - badgeW - paddingX;
      const badgeY = paddingX;

      ctx.save();
      ctx.fillStyle = "#6e1d2f";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(badgeH * 0.45)}px "Euclid Circular B", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(activeAsset.text || "NOWOŚĆ", badgeX + badgeW / 2, badgeY + badgeH / 2);
      ctx.restore();
    }
  };

  // Export single PNG for active language
  const exportPNG = () => {
    const canvas = document.createElement("canvas");
    const { width, height } = getCanvasDimensions();

    const doExport = (img: HTMLImageElement | null) => {
      renderCanvasFrame(canvas, img, activeCopy.headline, activeCopy.subline);
      const link = document.createElement("a");
      const langCode = activeStaticLang.split("-")[0].toUpperCase();
      const ratioLabel = staticRatio === "original" ? "oryginal" : staticRatio.replace(":", "x");
      link.download = `Sinsay_Grafika_${langCode}_${ratioLabel}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast(`Wygenerowano i pobrano plik PNG (${width}×${height}px) dla: ${langCode}.`);
    };

    if (uploadedImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => doExport(img);
      img.src = uploadedImage;
    } else {
      doExport(null);
    }
  };

  // Export ZIP Package with all selected languages
  const handleExportZipAllMarkets = async () => {
    if (selectedMarkets.length === 0) {
      showToast("Wybierz przynajmniej jeden rynek do paczki ZIP.");
      return;
    }

    setIsExportingZip(true);
    showToast(`Generowanie grafik dla ${selectedMarkets.length} rynków...`);

    try {
      const zip = new JSZip();
      const canvas = document.createElement("canvas");

      // Load image once if present
      const img: HTMLImageElement | null = await new Promise((resolve) => {
        if (!uploadedImage) return resolve(null);
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = uploadedImage;
      });

      const ratioLabel = staticRatio === "original" ? "oryginal" : staticRatio.replace(":", "x");

      // Render each selected market to canvas and add to ZIP
      for (const mCode of selectedMarkets) {
        const copy = staticTexts[mCode] || staticTexts[`${mCode.toLowerCase()}-${mCode}`] || activeCopy;
        renderCanvasFrame(canvas, img, copy.headline, copy.subline);

        const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (blob) {
          zip.file(`Sinsay_Grafika_${mCode}_${ratioLabel}.png`, blob);
        }
      }

      // Manifest
      const manifest = {
        project: "SiMotion Social Graphics",
        format: staticRatio,
        dimensions: getCanvasDimensions(),
        markets: selectedMarkets,
        backdropStyle,
        typography: "Euclid Circular B (LPP SA Official)",
        timestamp: new Date().toISOString(),
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Sinsay_Paczka_Grafik_${selectedMarkets.length}_Jezykow_${ratioLabel}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast(`✓ Pobrano paczkę ZIP (${selectedMarkets.length} plików PNG)!`);
    } catch (err) {
      console.error(err);
      showToast("Błąd podczas generowania paczki ZIP.");
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Grafiki statyczne &amp; Kampanie wielojęzyczne
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Wgrywanie zdjęć, tłumaczenia na 28 rynków Sinsay, maskowanie starych napisów i eksport ZIP.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportZipAllMarkets}
            disabled={isExportingZip}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#c84b31] bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>{isExportingZip ? "Pakowanie ZIP..." : `💾 Pobierz paczkę ZIP (${selectedMarkets.length} języków)`}</span>
          </button>
          <button
            onClick={exportPNG}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            Pobierz PNG ({activeStaticLang.split("-")[0].toUpperCase()})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Settings & Translation Column (Większa przestrzeń na hasła i rynki) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Format i proporcje */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                1. Format i kadrowanie
              </h2>
              {staticRatio === "original" && originalDimensions && (
                <span className="text-[10px] font-mono text-[var(--accent)] font-bold">
                  {originalDimensions.width}×{originalDimensions.height} px
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STATIC_RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setStaticRatio(r.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all ${
                    staticRatio === r.id
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  <div className="leading-tight">{r.label}</div>
                  <small className="text-[9px] opacity-70 block font-mono">
                    {r.id === "original"
                      ? originalDimensions
                        ? `${originalDimensions.width}×${originalDimensions.height}`
                        : "Rozdzielczość pliku"
                      : `${r.width}×${r.height}`}
                  </small>
                </button>
              ))}
            </div>

            {/* Photo upload / replace */}
            <div className="pt-2">
              {uploadedImage ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                  <div className="flex items-center gap-2 truncate">
                    <img src={uploadedImage} alt="thumb" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-xs font-bold truncate">Zdjęcie wgrane</span>
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="text-xs text-rose-500 hover:underline font-bold px-2 py-1"
                  >
                    Usuń zdjęcie
                  </button>
                </div>
              ) : (
                <label className="block p-3.5 rounded-xl border-2 border-dashed border-[var(--border-strong)] text-center cursor-pointer bg-[var(--bg-subtle)] hover:border-[var(--accent)] transition-all">
                  <span className="text-xs font-bold text-[var(--ink-primary)] block">
                    ↑ Wgraj grafikę / zdjęcie (dowolny format)
                  </span>
                  <small className="text-[10px] text-[var(--ink-muted)] block mt-0.5">
                    JPG, PNG, WebP · zachowuje pełną rozdzielczość w trybie Oryginał
                  </small>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* 2. Tłumaczenia i hasła Sinsay */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                2. Języki i tłumaczenia
              </h2>
              <button
                type="button"
                onClick={() => setShowPhraseAssistant((prev) => !prev)}
                className="text-xs font-bold text-[#c84b31] dark:text-[#e56b4e] hover:underline flex items-center gap-1"
              >
                <span>✦ Hasła Sinsay (4524)</span>
                <span>{showPhraseAssistant ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* Sinsay Assistant Drawer */}
            {showPhraseAssistant && (
              <div className="p-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)]">
                <SinsayPhraseAssistant
                  onSelectPhrase={handleApplyPhrase}
                  initialImage={uploadedImage || ""}
                  currentPrompt={activeCopy.headline}
                />
              </div>
            )}

            {/* Markets Pills */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--ink-primary)]">
                  Rynki w paczce ({selectedMarkets.length} aktywnych):
                </span>
                <button
                  onClick={() => setSelectedMarkets(SINSAY_MARKETS.slice(0, 10).map((m) => m.code))}
                  className="text-[10px] text-[var(--accent)] hover:underline font-bold"
                >
                  Top 10 CEE
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {SINSAY_MARKETS.slice(0, 18).map((m) => {
                  const isSelected = selectedMarkets.includes(m.code);
                  const isCurrent = activeStaticLang === m.code || activeStaticLang.startsWith(m.code.toLowerCase());
                  return (
                    <button
                      key={m.code}
                      onClick={() => {
                        setActiveStaticLang(m.code);
                        if (!isSelected) toggleMarketSelection(m.code);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                        isCurrent
                          ? "ring-2 ring-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-extrabold"
                          : isSelected
                          ? "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                          : "opacity-40 border-transparent bg-transparent text-[var(--ink-muted)] hover:opacity-80"
                      }`}
                      title={m.name}
                    >
                      <span>{m.flag}</span>
                      <span>{m.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Market Edit Inputs */}
            <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--ink-primary)]">
                  Edycja dla rynku: <b className="text-[var(--accent)]">{activeStaticLang.toUpperCase()}</b>
                </span>
                <span className="text-[10px] text-[var(--ink-muted)] font-sinsay">Euclid Circular B</span>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--ink-secondary)] block mb-1">
                  Nagłówek
                </label>
                <input
                  type="text"
                  value={activeCopy.headline}
                  onChange={(e) =>
                    setStaticTexts({
                      ...staticTexts,
                      [activeStaticLang]: { ...activeCopy, headline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold font-sinsay"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--ink-secondary)] block mb-1">
                  Podtytuł / CTA
                </label>
                <input
                  type="text"
                  value={activeCopy.subline}
                  onChange={(e) =>
                    setStaticTexts({
                      ...staticTexts,
                      [activeStaticLang]: { ...activeCopy, subline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-sinsay"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Artboard Preview Column (Podgląd na górze + panele pod spodem) */}
        <div className="lg:col-span-5 space-y-4 self-start">
          {/* Top Preview Card */}
          <div className="flex flex-col items-center p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm">
          <div className="w-full flex items-center justify-between mb-3 text-xs font-bold text-[var(--ink-secondary)]">
            <span className="flex items-center gap-1.5">
              <span>Podgląd:</span>
              <span className="px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]">
                {staticRatio} · {activeStaticLang.toUpperCase()}
              </span>
            </span>
            <span className="text-[10px] text-[var(--ink-muted)]">
              Font: Euclid Circular B (LPP SA)
            </span>
          </div>

          {/* Artboard Frame */}
          <div
            className={`w-full max-w-[360px] rounded-3xl relative overflow-hidden shadow-2xl transition-all border-4 border-black/80 ${
              staticRatio === "1:1"
                ? "aspect-square"
                : staticRatio === "3:4"
                ? "aspect-[3/4]"
                : staticRatio === "4:5"
                ? "aspect-[4/5]"
                : staticRatio === "9:16"
                ? "aspect-[9/16]"
                : staticRatio === "4:3"
                ? "aspect-[4/3]"
                : staticRatio === "5:4"
                ? "aspect-[5/4]"
                : staticRatio === "16:9"
                ? "aspect-[16/9]"
                : "aspect-[3/4]"
            } ${
              selectedBgStyle === "atelier"
                ? "bg-gradient-to-br from-[#c84b31] via-[#6e1d2f] to-[#1a1714]"
                : selectedBgStyle === "silk"
                ? "bg-gradient-to-br from-[#f5eadc] via-[#c84b31] to-[#2c131a]"
                : selectedBgStyle === "black"
                ? "bg-black"
                : "bg-gradient-to-br from-[#211d1a] via-[#14110f] to-[#0a0807]"
            }`}
          >
            {/* Uploaded Photo */}
            {uploadedImage && (
              <img
                src={uploadedImage}
                alt="Uploaded"
                className={`absolute inset-0 w-full h-full ${
                  staticRatio === "original" ? "object-contain" : "object-cover"
                }`}
              />
            )}

            {/* Gradient backdrop overlay */}
            {backdropStyle === "gradient" && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            )}

            {/* Brand top tag */}
            {showBrandTag && (
              <div className="absolute top-4 left-4 z-20 text-[9px] font-bold tracking-widest uppercase font-sinsay text-white/90 drop-shadow-md">
                {brandTagText}
              </div>
            )}

            {/* Active Brand Kit Badge */}
            {activeAsset && (
              <div className="absolute top-4 right-4 z-20">
                <span className="px-2.5 py-0.5 rounded bg-[var(--burgundy)] text-white text-[9px] font-black shadow-lg inline-block font-sinsay">
                  {activeAsset.text || "NOWOŚĆ"}
                </span>
              </div>
            )}

            {/* Typography Overlay Layer positioned according to textYPercent */}
            <div
              className={`absolute inset-x-0 z-20 transition-all px-5 ${
                backdropWidth === "full" ? "p-0" : ""
              }`}
              style={{
                top: `${textYPercent}%`,
                transform: "translateY(-50%)",
              }}
            >
              <div
                className={`transition-all ${
                  backdropStyle === "box-dark"
                    ? `bg-[#120e0c]/95 text-white ${
                        backdropWidth === "full" ? "px-5 py-3" : "px-4 py-2.5 rounded-2xl shadow-2xl inline-block"
                      }`
                    : backdropStyle === "box-white"
                    ? `bg-[#fffaf5]/98 text-[#14110f] ${
                        backdropWidth === "full" ? "px-5 py-3" : "px-4 py-2.5 rounded-2xl shadow-2xl inline-block"
                      }`
                    : backdropStyle === "box-sinsay"
                    ? `bg-[#6e1d2f]/95 text-white ${
                        backdropWidth === "full" ? "px-5 py-3" : "px-4 py-2.5 rounded-2xl shadow-2xl inline-block"
                      }`
                    : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                } ${
                  textAlign === "center"
                    ? "text-center mx-auto"
                    : textAlign === "right"
                    ? "text-right ml-auto"
                    : "text-left"
                }`}
                style={{
                  maxWidth: backdropWidth === "full" ? "100%" : "90%",
                }}
              >
                <h3
                  className="font-bold leading-tight font-sinsay"
                  style={{ fontSize: `${Math.round(20 * fontSizeScale)}px` }}
                >
                  {activeCopy.headline}
                </h3>
                <p
                  className="font-medium opacity-90 mt-0.5 font-sinsay"
                  style={{ fontSize: `${Math.round(11 * fontSizeScale)}px` }}
                >
                  {activeCopy.subline}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={exportPNG}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Pobierz ({activeStaticLang.toUpperCase()})</span>
            </button>
            <button
              onClick={handleExportZipAllMarkets}
              disabled={isExportingZip}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#c84b31] bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <span>{isExportingZip ? "Pakowanie..." : `💾 Pobierz ZIP (${selectedMarkets.length} jęz.)`}</span>
            </button>
          </div>
        </div>

        {/* Underneath Preview: 3. Layout & Maskowanie starego napisu */}
        <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3.5 shadow-sm">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
            3. Layout &amp; Maskowanie starego napisu
          </h2>

          {/* Masking Style / Backdrop */}
          <div>
            <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
              Tło tekstu (zakrywanie starego napisu)
            </label>
            <select
              value={backdropStyle}
              onChange={(e) => setBackdropStyle(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold cursor-pointer"
            >
              <option value="box-dark">⬛ Ciemna kryjąca belka (maskuje stary napis)</option>
              <option value="box-white">⬜ Jasna kryjąca belka (pod jasne zdjęcia)</option>
              <option value="box-sinsay">🟥 Burgundowa belka Sinsay</option>
              <option value="gradient">Płynny gradient od dołu (dla czystych zdjęć)</option>
              <option value="clean">Czysty tekst z cieniem (brak tła)</option>
            </select>
          </div>

          {backdropStyle.startsWith("box-") && (
            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Szerokość belki maskującej
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBackdropWidth("fit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    backdropWidth === "fit"
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                  }`}
                >
                  Kapsuła dopasowana
                </button>
                <button
                  onClick={() => setBackdropWidth("full")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    backdropWidth === "full"
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                  }`}
                >
                  Pasek na całą szerokość
                </button>
              </div>
            </div>
          )}

          {/* Vertical Position slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span>Wysokość tekstu w kadrze</span>
              <span className="text-[var(--accent)] font-extrabold">{textYPercent}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={88}
              value={textYPercent}
              onChange={(e) => setTextYPercent(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--ink-muted)]">
              <span>Góra (20%)</span>
              <span>Środek (50%)</span>
              <span>Dół (88%)</span>
            </div>
          </div>

          {/* Font scale & alignment */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span>Skala fontu</span>
                <span className="text-[var(--accent)]">{Math.round(fontSizeScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.4}
                step={0.05}
                value={fontSizeScale}
                onChange={(e) => setFontSizeScale(Number(e.target.value))}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Wyrównanie
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setTextAlign(a)}
                    className={`py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                      textAlign === a
                        ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                    }`}
                  >
                    {a === "left" ? "Lewo" : a === "center" ? "Środek" : "Prawo"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brand Tag Controls */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--ink-primary)]">
                Górny stempel / tag marki
              </label>
              <input
                type="checkbox"
                checked={showBrandTag}
                onChange={(e) => setShowBrandTag(e.target.checked)}
                className="w-4 h-4 accent-[#c84b31] cursor-pointer"
              />
            </div>
            {showBrandTag && (
              <input
                type="text"
                value={brandTagText}
                onChange={(e) => setBrandTagText(e.target.value)}
                placeholder="np. SINSAY / SS26, SINSAY KIDS..."
                className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold uppercase font-sinsay"
              />
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
