"use client";

import React, { useState, useEffect } from "react";

export type ViewTab =
  | "vision"
  | "single"
  | "batch"
  | "post"
  | "assets"
  | "static"
  | "local"
  | "export";

export interface BatchItem {
  mdk: string;
  source: string;
  type: string;
  status: "Gotowy" | "Brak packshotu" | "Do walidacji";
}

export interface BrandAsset {
  id: string;
  name: string;
  kind: "both" | "video" | "static";
  type: "badge" | "cta" | "frame" | "star" | "image";
  text?: string;
  url?: string;
}

export default function SiMotionApp() {
  const [activeTab, setActiveTab] = useState<ViewTab>("vision");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Studio TikTok state
  const [productId, setProductId] = useState("001KR-83X");
  const [aiEngine, setAiEngine] = useState<"seedance" | "higgsfield">("seedance");
  const [genMode, setGenMode] = useState<"storyboard" | "single">("storyboard");
  const [template, setTemplate] = useState("TikTok try-on · 6 scen");
  const [prompt, setPrompt] = useState(
    "Dynamiczny try-on nowej kolekcji jedwabnej. Zbliżenia na fakturę materiału, naturalny ruch modelki w ciepłym świetle atelier i wyraziste zakończenie z produktem."
  );
  const [duration, setDuration] = useState(10);
  const [selectedRatios, setSelectedRatios] = useState<string[]>(["9x16", "4x5", "1x1"]);
  const [selectedTextLangs, setSelectedTextLangs] = useState<string[]>(["pl-PL", "en-US"]);
  const [isDubEnabled, setIsDubEnabled] = useState(true);
  const [selectedDubLangs, setSelectedDubLangs] = useState<string[]>(["pl-PL", "en-US"]);
  const [crossDubs, setCrossDubs] = useState(false);
  const [cropOffset, setCropOffset] = useState(0);
  const [showSafeAreas, setShowSafeAreas] = useState(true);
  const [separateRender, setSeparateRender] = useState(false);

  // Batch state
  const [batchType, setBatchType] = useState("both");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    { mdk: "001KR-83X", source: "PCM API (3 zdjęcia)", type: "Karta produktu + Social", status: "Gotowy" },
    { mdk: "002AB-10Y", source: "PCM API (4 zdjęcia)", type: "Karta produktu + Social", status: "Gotowy" },
    { mdk: "003CD-44Z", source: "CSV · Brak w PCM", type: "Karta produktu + Social", status: "Brak packshotu" },
  ]);
  const [batchManualInput, setBatchManualInput] = useState("");

  // Postproduction state
  const [postCaptions, setPostCaptions] = useState<Record<string, string>>({
    "pl-PL": "Nowa kolekcja na Twój sposób",
    "en-US": "New collection, your way",
    "de-DE": "Neue Kollektion, dein Stil",
    "cs-CZ": "Nová kolekce po tvém",
    "ro-RO": "Noua colecție în stilul tău",
  });
  const [postPreviewLang, setPostPreviewLang] = useState("pl-PL");
  const [postCaptionMode, setPostCaptionMode] = useState<"word" | "scene">("word");
  const [postCaptionStyle, setPostCaptionStyle] = useState<"bold" | "pill" | "minimal">("bold");
  const [postLogoAnim, setPostLogoAnim] = useState<"fade" | "slide" | "pop" | "none">("fade");
  const [postOutputLangs, setPostOutputLangs] = useState<string[]>(["pl-PL", "en-US"]);
  const [selectedVideoAssetId, setSelectedVideoAssetId] = useState<string | null>("badge");

  // Assets (Brand Kit) state
  const [assets, setAssets] = useState<BrandAsset[]>([
    { id: "badge", name: "Badge NEW AW26", kind: "both", type: "badge", text: "NEW AW26" },
    { id: "cta", name: "Kapsuła CTA · Odkryj", kind: "video", type: "cta", text: "SHOP NOW" },
    { id: "frame", name: "Ramka Lookbook Atelier", kind: "both", type: "frame", text: "" },
    { id: "star", name: "Sygnet Kolekcji ✳", kind: "static", type: "star", text: "✳" },
  ]);
  const [selectedStaticAssetId, setSelectedStaticAssetId] = useState<string | null>("star");

  // Static state
  const [staticTexts, setStaticTexts] = useState<Record<string, { headline: string; subline: string }>>({
    "pl-PL": { headline: "Nowa kolekcja", subline: "Odkryj swój styl" },
    "en-US": { headline: "New collection", subline: "Discover your style" },
    "de-DE": { headline: "Neue Kollektion", subline: "Entdecke deinen Stil" },
    "cs-CZ": { headline: "Nová kolekce", subline: "Objev svůj styl" },
  });
  const [activeStaticLang, setActiveStaticLang] = useState("pl-PL");
  const [staticRatio, setStaticRatio] = useState("1:1");

  // Localization / Approvals state
  const [approvals, setApprovals] = useState([
    { code: "pl-PL", label: "🇵🇱 Polski (PL) · 3 formaty", status: "Zaakceptowany", by: "anna.k@atelier · 08:15" },
    { code: "en-US", label: "🇬🇧 English (EN) · 3 formaty", status: "Zaakceptowany", by: "marta.w@atelier · 08:22" },
    { code: "de-DE", label: "🇩🇪 Deutsch (DE) · 3 formaty", status: "Do akceptacji", by: "Sprawdź długość CTA (22/20 zn.)" },
    { code: "cs-CZ", label: "🇨🇿 Čeština (CZ) · 3 formaty", status: "Roboczy", by: "Szkic AI w Excel Online" },
  ]);

  // Toast handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    showToast(`Przełączono na motyw ${next === "dark" ? "ciemny (Obsidian Velvet)" : "jasny (Atelier Ivory)"}.`);
  };

  // Calculations for Single
  const ratePerSec = aiEngine === "seedance" ? 0.22 : 0.26;
  const renderMultiplier = separateRender ? Math.max(1, selectedRatios.length) : 1;
  const videoCost = duration * ratePerSec * renderMultiplier;
  const ttsCost = (isDubEnabled ? selectedDubLangs.length : 0) * 0.3;
  const totalCost = (videoCost + ttsCost).toFixed(2);

  const toggleRatio = (ratio: string) => {
    setSelectedRatios((prev) =>
      prev.includes(ratio) ? prev.filter((r) => r !== ratio) : [...prev, ratio]
    );
  };

  const toggleTextLang = (lang: string) => {
    setSelectedTextLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleDubLang = (lang: string) => {
    setSelectedDubLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* TOPBAR */}
      <header className="sticky top-0 z-30 px-6 py-3 border-b flex items-center justify-between gap-4 flex-wrap backdrop-blur-md bg-[var(--bg-glass)] border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--burgundy)] text-white font-extrabold text-lg grid place-items-center shadow-[var(--shadow-pop)]">
            S
          </div>
          <div>
            <b className="block text-base font-extrabold tracking-tight leading-none text-[var(--ink-primary)]">
              SiMotion
            </b>
            <small className="block text-[10px] tracking-widest uppercase font-bold text-[var(--ink-muted)] mt-0.5">
              FASHION &amp; VIDEO STUDIO
            </small>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--status-ok-ink)] shadow-[0_0_0_2px_var(--status-ok-bg)]" />
            KR-042 · {activeTab.toUpperCase()}
          </span>
        </div>

        {/* 8 Tabs Navbar */}
        <nav className="flex items-center gap-1 p-1 rounded-full overflow-x-auto max-w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          {(
            [
              ["vision", "Pulpit"],
              ["single", "Studio TikTok"],
              ["batch", "Produkcja batchowa"],
              ["post", "Napisy i logo"],
              ["assets", "Materiały"],
              ["static", "Grafiki statyczne"],
              ["local", "Lokalizacja"],
              ["export", "Eksport i pliki"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === key
                  ? "bg-[var(--bg-card)] text-[var(--ink-primary)] shadow-sm font-bold border border-[var(--border-strong)]"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-card)]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Actions & Theme toggle */}
        <div className="flex items-center gap-2.5">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--status-ok-ink)]" />
            PCM + Excel Online
          </span>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors text-[var(--ink-primary)]"
            title="Przełącz motyw"
          >
            <span>{theme === "dark" ? "☀" : "☾"}</span>
            <span>{theme === "dark" ? "Jasny" : "Ciemny"}</span>
          </button>
          <div className="w-8 h-8 rounded-full grid place-items-center bg-[var(--burgundy)] text-white text-xs font-bold border-2 border-[var(--champagne)]">
            SM
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-8 flex-1">
        {/* VIEW 1: PULPIT */}
        {activeTab === "vision" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                  ✦ ATELIER MOTION / CENTRUM PRODUKCJI
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                  Kreacje wideo i lookbooki w jednym procesie.
                </h1>
                <p className="text-sm mt-1 text-[var(--ink-secondary)] max-w-2xl">
                  Od packshotów PCM i generacji AI (Seedance/Higgsfield), przez montaż w przeglądarce, po dwukierunkową synchronizację z Microsoft Excel Online.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setActiveTab("local");
                    showToast("Zsynchronizowano z tabelą Excel Online.");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                >
                  Synchronizuj Excel Online ↻
                </button>
                <button
                  onClick={() => setActiveTab("single")}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--burgundy)] shadow-[var(--shadow-pop)] hover:opacity-95"
                >
                  ＋ Nowa kreacja wideo
                </button>
              </div>
            </div>

            {/* Campaign Banner */}
            <div className="p-8 rounded-3xl border relative overflow-hidden bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-card)] border-[var(--border-strong)]">
              <div className="max-w-xl relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent-soft)] text-[var(--accent)]">
                  <span>●</span> AKTYWNY PROJEKT KR-042 · JESIEŃ/ZIMA 2026
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--ink-primary)]">
                  Jedwab &amp; Kaszmir — Kolekcja Kapsułowa
                </h2>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Jedna generacja bazowa 9:16 ze Smart Cropem do 4:5 i 1:1. Zmniejszono koszt wywołań wideo AI o 66%.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)]">
                    MDK: 001KR-83X
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)]">
                    Silnik: Seedance 2.0
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)]">
                    Lektor: ElevenLabs
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]">
                    Oszczędność API: −66%
                  </span>
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setActiveTab("single")}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:opacity-95"
                  >
                    Otwórz Studio TikTok ↗
                  </button>
                  <button
                    onClick={() => setActiveTab("post")}
                    className="px-4 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                  >
                    Montaż napisów i logo
                  </button>
                </div>
              </div>
            </div>

            {/* Quick KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)]">
                <div className="text-xs uppercase font-extrabold text-[var(--ink-muted)]">Aktywne warianty</div>
                <div className="text-3xl font-extrabold mt-1 text-[var(--ink-primary)]">06 MP4</div>
                <div className="text-xs text-[var(--ink-secondary)] mt-1">3 formaty × 2 języki</div>
              </div>
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)]">
                <div className="text-xs uppercase font-extrabold text-[var(--ink-muted)]">Kolejka Batchowa</div>
                <div className="text-3xl font-extrabold mt-1 text-[var(--ink-primary)]">03 MDK</div>
                <div className="text-xs text-[var(--ink-secondary)] mt-1">Połączenie z PCM API</div>
              </div>
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)]">
                <div className="text-xs uppercase font-extrabold text-[var(--ink-muted)]">Rynki językowe</div>
                <div className="text-3xl font-extrabold mt-1 text-[var(--ink-primary)]">05 Rynków</div>
                <div className="text-xs text-[var(--ink-secondary)] mt-1">CEE &amp; DACH (Excel Online)</div>
              </div>
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)]">
                <div className="text-xs uppercase font-extrabold text-[var(--ink-muted)]">Oszczędność API</div>
                <div className="text-3xl font-extrabold mt-1 text-[var(--status-ok-ink)]">−66%</div>
                <div className="text-xs text-[var(--ink-secondary)] mt-1">Dzięki technologii Smart Crop</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: STUDIO TIKTOK */}
        {activeTab === "single" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                  01 / STUDIO TIKTOK &amp; REELS
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                  Jedna kreacja. Trzy kadry. Wszystkie rynki.
                </h1>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Generuj bazowe wideo 9:16 i automatycznie kadruj do 4:5 oraz 1:1 bez ponoszenia potrójnych kosztów.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("post")}
                  className="px-4 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                >
                  Przekaż do Napisów i logo →
                </button>
                <button
                  onClick={() => showToast(`Wysłano zadanie generacji do adaptera ${aiEngine.toUpperCase()} ($${totalCost})`)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
                >
                  ✦ Uruchom generację wideo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Controls */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    1. Produkt (PCM) &amp; Silnik AI
                  </h2>
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Kod MDK produktu
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        onClick={() => showToast(`Pobrano 3 zdjęcia dla ${productId} z API PCM.`)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                      >
                        PCM ↻
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                        Silnik AI
                      </label>
                      <select
                        value={aiEngine}
                        onChange={(e) => setAiEngine(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                      >
                        <option value="seedance">Seedance 2.0</option>
                        <option value="higgsfield">Higgsfield AI</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                        Tryb
                      </label>
                      <select
                        value={genMode}
                        onChange={(e) => setGenMode(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                      >
                        <option value="storyboard">Storyboard (6 scen)</option>
                        <option value="single">Szybki klip (1 ujęcie)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Prompt kreatywny
                    </label>
                    <textarea
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span>Długość filmu</span>
                      <span className="text-[var(--accent)] font-extrabold">{duration} s</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Formats & Smart Crop */}
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    2. Formaty i Smart Crop
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["9x16", "9:16 · TikTok / Reels"],
                      ["4x5", "4:5 · Feed IG"],
                      ["1x1", "1:1 · Kwadrat"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleRatio(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          selectedRatios.includes(key)
                            ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                            : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span>Punkt fokusu Smart Crop</span>
                      <span className="text-[var(--accent)]">{cropOffset}%</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      value={cropOffset}
                      onChange={(e) => setCropOffset(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <b className="text-xs block text-[var(--ink-primary)]">Strefy bezpieczne (Safe Area)</b>
                      <small className="text-[10px] text-[var(--ink-muted)]">Podgląd marginesów TikTok</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={showSafeAreas}
                      onChange={(e) => setShowSafeAreas(e.target.checked)}
                      className="w-4 h-4 accent-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
                    <div>
                      <b className="text-xs block text-[var(--ink-primary)]">Osobny render dla każdego kadru</b>
                      <small className="text-[10px] text-[var(--ink-muted)]">Wyłącza Smart Crop (wyższy koszt)</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={separateRender}
                      onChange={(e) => setSeparateRender(e.target.checked)}
                      className="w-4 h-4 accent-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Languages & Dubbing */}
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    3. Rynki i Dubbing ElevenLabs
                  </h2>
                  <div className="space-y-2">
                    <span className="text-xs font-bold block text-[var(--ink-primary)]">Napisy na ekranie:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["pl-PL", "en-US", "de-DE", "cs-CZ", "ro-RO"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleTextLang(lang)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            selectedTextLangs.includes(lang)
                              ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                              : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                          }`}
                        >
                          {lang.split("-")[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-[var(--accent-soft)] border-[var(--accent)] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-[var(--accent)]">
                        Estymowany koszt: ${totalCost}
                      </div>
                      <small className="text-[10px] text-[var(--ink-secondary)] block">
                        {aiEngine.toUpperCase()} ({duration} s) + ElevenLabs TTS
                      </small>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--bg-card)] text-[var(--accent)]">
                      {separateRender ? "Multi-render" : "Smart Crop (−66%)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - 3-Frame Preview & Storyboard */}
              <div className="lg:col-span-7 space-y-5">
                <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                      Podgląd 3 kadrów na żywo
                    </h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                      {aiEngine === "seedance" ? "✦ Seedance 2.0" : "✦ Higgsfield AI"}
                    </span>
                  </div>

                  {/* 3 Mockup phones */}
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] grid grid-cols-3 gap-3 place-items-center min-h-[340px]">
                    {/* 9:16 */}
                    <div className="w-full max-w-[130px] aspect-[9/16] rounded-2xl border-4 border-black bg-gradient-to-tr from-[#3a151e] to-[#c84b31] p-2 flex flex-col justify-end text-center relative overflow-hidden shadow-lg">
                      <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                        9:16 BAZA
                      </span>
                      <p className={`text-[10px] font-extrabold text-white leading-tight ${showSafeAreas ? "border border-dashed border-amber-300 p-1 rounded" : ""}`}>
                        Nowa kolekcja<br />na Twój sposób
                      </p>
                    </div>

                    {/* 4:5 */}
                    <div className="w-full max-w-[160px] aspect-[4/5] rounded-2xl border-4 border-black bg-gradient-to-tr from-[#3a151e] to-[#c84b31] p-2 flex flex-col justify-end text-center relative overflow-hidden shadow-lg">
                      <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                        4:5 CROP
                      </span>
                      <p className={`text-[10px] font-extrabold text-white leading-tight ${showSafeAreas ? "border border-dashed border-amber-300 p-1 rounded" : ""}`}>
                        Nowa kolekcja<br />na Twój sposób
                      </p>
                    </div>

                    {/* 1:1 */}
                    <div className="w-full max-w-[170px] aspect-square rounded-2xl border-4 border-black bg-gradient-to-tr from-[#3a151e] to-[#c84b31] p-2 flex flex-col justify-end text-center relative overflow-hidden shadow-lg">
                      <span className="absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                        1:1 CROP
                      </span>
                      <p className={`text-[10px] font-extrabold text-white leading-tight ${showSafeAreas ? "border border-dashed border-amber-300 p-1 rounded" : ""}`}>
                        Nowa kolekcja<br />na Twój sposób
                      </p>
                    </div>
                  </div>
                  <small className="block text-center text-xs text-[var(--ink-muted)] mt-2">
                    Kadrowanie Smart Crop sterowane suwakiem fokusu ({cropOffset}%) z automatycznym zachowaniem stref bezpiecznych.
                  </small>
                </div>

                {/* 6-scene Storyboard */}
                <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                        Storyboard modularny (6 scen)
                      </h3>
                      <small className="text-xs text-[var(--ink-muted)]">
                        Każda scena może zostać przelosowana bez kosztu pozostałych 5
                      </small>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] border text-[var(--ink-primary)]">
                      {duration} s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      ["01 Hook", "0.0–1.4 s", "Zatrzymujące uwagę wejście modelki"],
                      ["02 Sylwetka", "1.4–3.0 s", "Prezentacja kroju w pełnym świetle"],
                      ["03 Detal", "3.0–4.8 s", "Makro-zbliżenie na splot jedwabiu"],
                      ["04 Ruch", "4.8–6.8 s", "Obrót modelki i praca tkaniny"],
                      ["05 Hero", "6.8–8.5 s", "Mocny kadr finałowy kolekcji"],
                      ["06 Outro", "8.5–10.0 s", "Plansza z logotypem SiMotion"],
                    ].map(([title, time, desc], idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border bg-[var(--bg-subtle)] border-[var(--border-subtle)] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-[var(--accent)]">
                            <span>{title}</span>
                            <span>{time}</span>
                          </div>
                          <p className="text-xs text-[var(--ink-secondary)] mt-1 font-medium">{desc}</p>
                        </div>
                        <button
                          onClick={() => showToast(`Przelosowano Scenę ${title.split(" ")[0]} w modelu ${aiEngine.toUpperCase()}.`)}
                          className="mt-3 px-2 py-1 rounded text-[10px] font-bold border bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--ink-primary)] w-full"
                        >
                          ↻ Przelosuj ujęcie
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PRODUKCJA BATCHOWA */}
        {activeTab === "batch" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                  02 / PRODUKCJA MASOWA W TLE
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                  Setki produktów. Jeden proces w tle.
                </h1>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Importuj listę MDK z CSV lub wpisz ręcznie. Serwer pobiera packshoty z PCM i przetwarza kolejkę w tle.
                </p>
              </div>
              <button
                onClick={() => showToast(`Uruchomiono zadanie batchowe na serwerze dla ${batchItems.length} produktów.`)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
              >
                ✦ Uruchom kolejkę na serwerze
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    Źródło produktów
                  </h2>
                  <div className="p-4 rounded-xl border border-dashed border-[var(--border-strong)] text-center bg-[var(--bg-subtle)]">
                    <p className="text-xs font-bold text-[var(--ink-primary)]">Wgraj listę kodów CSV</p>
                    <small className="text-[10px] text-[var(--ink-muted)] block mt-0.5">
                      Kolumny: MDK, model_color, custom_prompt
                    </small>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Lub wklej kody MDK ręcznie:
                    </label>
                    <textarea
                      rows={3}
                      value={batchManualInput}
                      onChange={(e) => setBatchManualInput(e.target.value)}
                      placeholder="001KR-83X, 002AB-10Y, 004LN-90P"
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!batchManualInput.trim()) return;
                      const ids = batchManualInput.split(/[\s,;]+/).filter(Boolean);
                      setBatchItems((prev) => [
                        ...prev,
                        ...ids.map((id) => ({
                          mdk: id.trim().toUpperCase(),
                          source: "Ręcznie + PCM API",
                          type: "Karta produktu + Social",
                          status: "Gotowy" as const,
                        })),
                      ]);
                      setBatchManualInput("");
                      showToast(`Dodano ${ids.length} kodów do kolejki.`);
                    }}
                    className="w-full px-4 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                  >
                    ＋ Dodaj do kolejki
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                      Kolejka produkcyjna ({batchItems.length} produktów)
                    </h3>
                    <button
                      onClick={() => showToast("Zresetowano kolejkę demonstracyjną.")}
                      className="text-xs font-bold text-[var(--accent)] underline"
                    >
                      Przywróć przykłady
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                        <tr>
                          <th className="p-3 font-bold uppercase text-[10px]">Kod MDK</th>
                          <th className="p-3 font-bold uppercase text-[10px]">Źródło zasobów</th>
                          <th className="p-3 font-bold uppercase text-[10px]">Wariant</th>
                          <th className="p-3 font-bold uppercase text-[10px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--ink-primary)]">
                        {batchItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-subtle)]">
                            <td className="p-3 font-extrabold font-mono">{item.mdk}</td>
                            <td className="p-3 text-[var(--ink-secondary)]">{item.source}</td>
                            <td className="p-3">{item.type}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === "Gotowy"
                                    ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]"
                                    : "bg-[var(--status-warn-bg)] text-[var(--status-warn-ink)]"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: NAPISY I LOGO */}
        {activeTab === "post" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                  03 / POSTPRODUKCJA &amp; WARSTWY
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                  Dynamiczne napisy i animacja logo.
                </h1>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Składanie warstw tekstowych i brandowych odbywa się bezpośrednio w przeglądarce bez kosztów API.
                </p>
              </div>
              <button
                onClick={() => showToast("Zsynchronizowano napisy z arkuszem Microsoft Excel Online.")}
                className="px-4 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
              >
                Pobierz teksty z Excel Online ↻
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    Napisy i lektor
                  </h2>
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Styl napisów
                    </label>
                    <select
                      value={postCaptionStyle}
                      onChange={(e) => setPostCaptionStyle(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    >
                      <option value="bold">Editorial Bold (Duży tekst)</option>
                      <option value="pill">Ciemna kapsuła (TikTok/Reels)</option>
                      <option value="minimal">Subtelny Lookbook</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Język podglądu
                    </label>
                    <select
                      value={postPreviewLang}
                      onChange={(e) => setPostPreviewLang(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    >
                      <option value="pl-PL">🇵🇱 Polski · PL</option>
                      <option value="en-US">🇬🇧 English · EN</option>
                      <option value="de-DE">🇩🇪 Deutsch · DE</option>
                      <option value="cs-CZ">🇨🇿 Čeština · CZ</option>
                      <option value="ro-RO">🇷🇴 Română · RO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Tekst w tym języku
                    </label>
                    <textarea
                      rows={2}
                      value={postCaptions[postPreviewLang] || ""}
                      onChange={(e) =>
                        setPostCaptions({ ...postCaptions, [postPreviewLang]: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Animacja Logo
                    </label>
                    <select
                      value={postLogoAnim}
                      onChange={(e) => setPostLogoAnim(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    >
                      <option value="fade">Subtelne pojawienie (Fade)</option>
                      <option value="slide">Wjazd od dołu (Slide)</option>
                      <option value="pop">Sprężysty akcent (Pop)</option>
                      <option value="none">Bez logotypu</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview Phone */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="p-8 rounded-3xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center min-w-[320px]">
                  <div className="w-[220px] aspect-[9/16] rounded-3xl border-4 border-black bg-gradient-to-tr from-[#3a151e] to-[#c84b31] p-4 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
                    <div
                      className={`text-xs font-extrabold text-white self-start px-2 py-0.5 rounded bg-black/60 ${
                        postLogoAnim === "fade"
                          ? "animate-logo-fade"
                          : postLogoAnim === "slide"
                          ? "animate-logo-slide"
                          : postLogoAnim === "pop"
                          ? "animate-logo-pop"
                          : ""
                      }`}
                    >
                      SiMotion
                    </div>

                    <div
                      className={`text-sm font-extrabold text-white ${
                        postCaptionStyle === "pill"
                          ? "bg-black/80 px-3 py-2 rounded-xl shadow-lg"
                          : postCaptionStyle === "minimal"
                          ? "text-xs font-semibold"
                          : "drop-shadow-md text-base"
                      }`}
                    >
                      {postCaptions[postPreviewLang]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: MATERIAŁY (BRAND KIT) */}
        {activeTab === "assets" && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                04 / BRAND KIT &amp; ZASOBY MARKI
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                Współdzielona biblioteka zasobów.
              </h1>
              <p className="text-sm text-[var(--ink-secondary)]">
                Trzymaj logotypy, nakładki graficzne, badge i podkłady muzyczne w jednym miejscu dla całego zespołu.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="h-28 rounded-xl bg-[var(--bg-elevated)] grid place-items-center text-center p-2">
                    <span className="text-lg font-extrabold text-[var(--accent)]">
                      {asset.text || "★"}
                    </span>
                  </div>
                  <div>
                    <b className="text-xs block text-[var(--ink-primary)]">{asset.name}</b>
                    <small className="text-[10px] text-[var(--ink-muted)]">
                      {asset.kind === "both" ? "Wideo & Grafiki" : asset.kind}
                    </small>
                  </div>
                  <button
                    onClick={() => showToast(`Wybrano zasób ${asset.name} do projektu.`)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border bg-[var(--bg-subtle)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                  >
                    Przypnij do wideo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 6: GRAFIKI STATYCZNE */}
        {activeTab === "static" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                  05 / GRAFIKI STATYCZNE &amp; LOOKBOOK
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                  Jedna kreacja statyczna. Wszystkie formaty.
                </h1>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Adaptuj zdjęcia na formaty 1:1, 4:5 i 9:16 i pobierz paczkę ZIP ze wszystkimi wersjami językowymi.
                </p>
              </div>
              <button
                onClick={() => showToast("Wyeksportowano paczkę ZIP (12 grafik statycznych).")}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
              >
                ✦ Eksportuj wszystkie języki (ZIP) ↓
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    Teksty na rynki
                  </h2>
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

                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Nagłówek
                    </label>
                    <input
                      type="text"
                      value={staticTexts[activeStaticLang]?.headline || ""}
                      onChange={(e) =>
                        setStaticTexts({
                          ...staticTexts,
                          [activeStaticLang]: {
                            ...staticTexts[activeStaticLang],
                            headline: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Podpis
                    </label>
                    <input
                      type="text"
                      value={staticTexts[activeStaticLang]?.subline || ""}
                      onChange={(e) =>
                        setStaticTexts({
                          ...staticTexts,
                          [activeStaticLang]: {
                            ...staticTexts[activeStaticLang],
                            subline: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Preview canvas */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="w-[340px] aspect-square rounded-3xl bg-gradient-to-br from-[#c84b31] via-[#6e1d2f] to-[#1a1714] p-6 flex flex-col justify-between text-white relative shadow-2xl overflow-hidden">
                  <div className="text-xs font-extrabold tracking-widest">SIMOTION / AUTUMN 2026</div>
                  <div>
                    <h3 className="text-2xl font-extrabold leading-tight">
                      {staticTexts[activeStaticLang]?.headline}
                    </h3>
                    <p className="text-sm opacity-90 mt-1">
                      {staticTexts[activeStaticLang]?.subline}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: LOKALIZACJA */}
        {activeTab === "local" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                  06 / LOKALIZACJA &amp; MICROSOFT EXCEL ONLINE
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                  Żywa synchronizacja z arkuszem tłumaczy.
                </h1>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Generuj szkice AI prosto do SharePointa i zatwierdzaj rynki przed końcowym renderem.
                </p>
              </div>
              <button
                onClick={() => showToast("Zsynchronizowano komórki z Microsoft Excel Online (SharePoint).")}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
              >
                ↻ Synchronizuj z Excel Online
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvals.map((item, idx) => (
                <div
                  key={item.code}
                  className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] flex items-center justify-between"
                >
                  <div>
                    <b className="text-xs block text-[var(--ink-primary)]">{item.label}</b>
                    <small className="text-[10px] text-[var(--ink-muted)]">{item.by}</small>
                  </div>
                  <button
                    onClick={() => {
                      const next =
                        item.status === "Zaakceptowany"
                          ? "Do akceptacji"
                          : item.status === "Do akceptacji"
                          ? "Roboczy"
                          : "Zaakceptowany";
                      setApprovals((prev) =>
                        prev.map((a, i) => (i === idx ? { ...a, status: next } : a))
                      );
                      showToast(`Zmieniono status ${item.code} na: ${next}`);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      item.status === "Zaakceptowany"
                        ? "bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]"
                        : item.status === "Do akceptacji"
                        ? "bg-[var(--status-warn-bg)] text-[var(--status-warn-ink)]"
                        : "bg-[var(--bg-subtle)] text-[var(--ink-secondary)]"
                    }`}
                  >
                    {item.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 8: EKSPORT I PLIKI */}
        {activeTab === "export" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
                  07 / EKSPORT, MANIFEST CSV &amp; CHMURA
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
                  Pliki uporządkowane i gotowe do emisji.
                </h1>
                <p className="text-sm text-[var(--ink-secondary)]">
                  Konwencja nazewnictwa: {"{MDK}_{kreacja}_{format}_{tekst}_{dubbing}_{wersja}.mp4"}
                </p>
              </div>
              <button
                onClick={() => showToast("Pobrano paczkę SiMotion_KR-042_Export.zip wraz z plikiem manifest.csv")}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
              >
                ✦ Pobierz paczkę ZIP + manifest.csv ↓
              </button>
            </div>

            <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                Struktura folderów archiwum ZIP
              </h2>
              <pre className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--ink-primary)] overflow-x-auto">
{`SiMotion_KR-042.zip
├── manifest.csv
├── pl-PL/
│   ├── 9x16/
│   │   └── 001KR-83X_KR-042_9x16_pl-PL_pl-PL_v01.mp4
│   ├── 4x5/
│   │   └── 001KR-83X_KR-042_4x5_pl-PL_pl-PL_v01.mp4
│   └── 1x1/
│       └── 001KR-83X_KR-042_1x1_pl-PL_pl-PL_v01.mp4
└── en-US/
    ├── 9x16/
    │   └── 001KR-83X_KR-042_9x16_en-US_en-US_v01.mp4
    └── 1x1/
        └── 001KR-83X_KR-042_1x1_en-US_en-US_v01.mp4`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] transition-all animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
