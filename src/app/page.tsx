"use client";

import React, { useState, useEffect } from "react";
import { StudioTikTokView } from "@/components/StudioTikTokView";
import { PostproductionView } from "@/components/PostproductionView";
import { BrandKitView } from "@/components/BrandKitView";
import { StaticGraphicsView } from "@/components/StaticGraphicsView";
import { LocalizationView } from "@/components/LocalizationView";
import BatchProductionView from "@/components/BatchProductionView";
import ExportView from "@/components/ExportView";
import IntegrationsView from "@/components/IntegrationsView";

export type ViewTab =
  | "vision"
  | "single"
  | "batch"
  | "post"
  | "assets"
  | "static"
  | "local"
  | "export"
  | "integrations";

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

        {/* 9 Tabs Navbar */}
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
              ["export", "Eksport i paczki"],
              ["integrations", "Integracje & API"],
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
          <StudioTikTokView
            productId={productId}
            setProductId={setProductId}
            showToast={showToast}
            onProceedToPost={() => setActiveTab("post")}
          />
        )}

        {/* VIEW 3: PRODUKCJA BATCHOWA */}
        {activeTab === "batch" && <BatchProductionView />}

        {/* VIEW 4: NAPISY I LOGO */}
        {activeTab === "post" && (
          <PostproductionView
            postCaptions={postCaptions}
            setPostCaptions={setPostCaptions}
            postPreviewLang={postPreviewLang}
            setPostPreviewLang={setPostPreviewLang}
            postCaptionStyle={postCaptionStyle}
            setPostCaptionStyle={setPostCaptionStyle}
            postLogoAnim={postLogoAnim}
            setPostLogoAnim={setPostLogoAnim}
            selectedVideoAssetId={selectedVideoAssetId}
            assets={assets}
            showToast={showToast}
            onGoToAssets={() => setActiveTab("assets")}
          />
        )}

        {/* VIEW 5: MATERIAŁY (BRAND KIT) */}
        {activeTab === "assets" && (
          <BrandKitView
            assets={assets}
            setAssets={setAssets}
            selectedVideoAssetId={selectedVideoAssetId}
            setSelectedVideoAssetId={setSelectedVideoAssetId}
            selectedStaticAssetId={selectedStaticAssetId}
            setSelectedStaticAssetId={setSelectedStaticAssetId}
            showToast={showToast}
          />
        )}

        {/* VIEW 6: GRAFIKI STATYCZNE */}
        {activeTab === "static" && (
          <StaticGraphicsView
            staticTexts={staticTexts}
            setStaticTexts={setStaticTexts}
            activeStaticLang={activeStaticLang}
            setActiveStaticLang={setActiveStaticLang}
            staticRatio={staticRatio}
            setStaticRatio={setStaticRatio}
            selectedStaticAssetId={selectedStaticAssetId}
            assets={assets}
            showToast={showToast}
          />
        )}

        {/* VIEW 7: LOKALIZACJA */}
        {activeTab === "local" && (
          <LocalizationView showToast={showToast} />
        )}

        {/* VIEW 8: EKSPORT I PACZKI */}
        {activeTab === "export" && <ExportView />}

        {/* VIEW 9: INTEGRACJE & API */}
        {activeTab === "integrations" && <IntegrationsView />}
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
