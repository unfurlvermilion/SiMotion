"use client";

import React, { useState, useRef } from "react";
import { BrandAsset } from "@/app/page";

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
  const [selectedBgStyle, setSelectedBgStyle] = useState<"atelier" | "silk" | "obsidian">("atelier");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeAsset = assets.find((a) => a.id === selectedStaticAssetId);
  const activeCopy = staticTexts[activeStaticLang] || {
    headline: "Nowa kolekcja",
    subline: "Odkryj swój styl",
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      showToast(`Wczytano zdjęcie: ${file.name}`);
    }
  };

  // HTML5 Canvas direct PNG Export
  const exportPNG = () => {
    const canvas = document.createElement("canvas");
    const width = 1080;
    const height = staticRatio === "1:1" ? 1080 : staticRatio === "4:5" ? 1350 : 1920;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw Background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (selectedBgStyle === "atelier") {
      grad.addColorStop(0, "#e8d7c3");
      grad.addColorStop(0.55, "#b58c75");
      grad.addColorStop(1, "#541826");
    } else if (selectedBgStyle === "silk") {
      grad.addColorStop(0, "#f7eee3");
      grad.addColorStop(0.6, "#c84b31");
      grad.addColorStop(1, "#2b1016");
    } else {
      grad.addColorStop(0, "#211d1a");
      grad.addColorStop(0.7, "#14110f");
      grad.addColorStop(1, "#0a0807");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Overlay shade
    const shade = ctx.createLinearGradient(0, height * 0.4, 0, height);
    shade.addColorStop(0, "rgba(20, 14, 12, 0)");
    shade.addColorStop(1, "rgba(20, 14, 12, 0.88)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, height * 0.4, width, height * 0.6);

    // Brand tag
    ctx.fillStyle = "#fffaf5";
    ctx.font = '700 32px "Euclid Circular B", sans-serif';
    ctx.fillText("SINSAY / AUTUMN ATELIER 2026", 75, height - 310);

    // Headline
    ctx.font = '700 80px "Euclid Circular B", sans-serif';
    ctx.fillText(activeCopy.headline, 75, height - 200);

    // Subline
    ctx.font = '500 38px "Euclid Circular B", sans-serif';
    ctx.fillText(activeCopy.subline, 75, height - 130);

    // Badge if active
    if (activeAsset) {
      ctx.fillStyle = "#6e1d2f";
      ctx.fillRect(width - 320, 75, 245, 80);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 32px sans-serif";
      ctx.fillText(activeAsset.text || "AW26", width - 290, 128);
    }

    // Trigger download
    const link = document.createElement("a");
    link.download = `SiMotion_${activeStaticLang}_${staticRatio.replace(":", "x")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    showToast(`Wygenerowano i pobrano plik PNG (${width}×${height}px).`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
            04 / GRAFIKI STATYCZNE &amp; LOOKBOOK
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
            Jedna kreacja statyczna. Wszystkie formaty.
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Adaptuj zdjęcia na formaty 1:1, 4:5 i 9:16 i generuj gotowe pliki graficzne PNG natychmiast w przeglądarce.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPNG}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            ✦ Pobierz plik PNG ↓
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Format i kompozycja
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Format proporcji
                </label>
                <select
                  value={staticRatio}
                  onChange={(e) => setStaticRatio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="1:1">1:1 · Kwadrat (Feed / Post)</option>
                  <option value="4:5">4:5 · Portret (IG Feed)</option>
                  <option value="9:16">9:16 · Story / TikTok Photo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Styl tła
                </label>
                <select
                  value={selectedBgStyle}
                  onChange={(e) => setSelectedBgStyle(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="atelier">Atelier Warm Terracotta</option>
                  <option value="silk">Champagne &amp; Silk</option>
                  <option value="obsidian">Obsidian Dark Velvet</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold block text-[var(--ink-primary)] mb-1.5">
                Wybierz język do edycji:
              </span>
              <div className="flex gap-1.5">
                {["pl-PL", "en-US", "de-DE", "cs-CZ"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveStaticLang(lang)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      activeStaticLang === lang
                        ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                    }`}
                  >
                    {lang.split("-")[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Główny nagłówek (Headline)
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
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Podpis / CTA (Subline)
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
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              />
            </div>

            <label className="block p-3 rounded-xl border border-dashed border-[var(--border-strong)] text-center cursor-pointer bg-[var(--bg-subtle)] hover:border-[var(--accent)]">
              <span className="text-xs font-bold text-[var(--ink-primary)]">
                ↑ Wgraj własne zdjęcie produktu / modelki
              </span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Live Canvas Visual Artboard */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm">
          <div
            className={`w-full max-w-[340px] rounded-3xl relative overflow-hidden shadow-2xl p-6 flex flex-col justify-between text-white transition-all ${
              staticRatio === "1:1"
                ? "aspect-square"
                : staticRatio === "4:5"
                ? "aspect-[4/5]"
                : "aspect-[9/16]"
            } ${
              selectedBgStyle === "atelier"
                ? "bg-gradient-to-br from-[#c84b31] via-[#6e1d2f] to-[#1a1714]"
                : selectedBgStyle === "silk"
                ? "bg-gradient-to-br from-[#f5eadc] via-[#c84b31] to-[#2c131a]"
                : "bg-gradient-to-br from-[#211d1a] via-[#14110f] to-[#0a0807]"
            }`}
          >
            {uploadedImage && (
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
              />
            )}

            <div className="relative z-10 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase font-sinsay">
              <span className="flex items-center gap-1.5">
                <span className="font-serif tracking-widest text-xs font-black lowercase">sinsay</span>
                <span>/ ATELIER 2026</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-black/40 text-white font-mono text-[9px]">
                {staticRatio} · EUCLID
              </span>
            </div>

            {activeAsset && (
              <div className="absolute top-12 right-6 z-10">
                <span className="px-3 py-1 rounded bg-[var(--burgundy)] text-white text-[10px] font-black shadow-lg transform rotate-3 inline-block font-sinsay">
                  {activeAsset.text || "NOWOŚĆ"}
                </span>
              </div>
            )}

            <div className="relative z-10 space-y-1 font-sinsay">
              <h3 className="text-2xl font-bold leading-tight drop-shadow-md">
                {activeCopy.headline}
              </h3>
              <p className="text-sm font-medium opacity-90 drop-shadow-sm">
                {activeCopy.subline}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={exportPNG}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:opacity-95 shadow-md"
            >
              Pobierz plik {staticRatio} (PNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
