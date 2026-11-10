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
import SharePointSyncBar from "@/components/SharePointSyncBar";
import { loadStoredAssets } from "@/lib/brandStorage";

export type ViewTab =
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
  const [activeTab, setActiveTab] = useState<ViewTab>("single");
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

  // Load custom stored assets from IndexedDB on startup
  useEffect(() => {
    loadStoredAssets().then((stored) => {
      if (stored && stored.length > 0) {
        setAssets((prev) => {
          const defaultIds = new Set(["badge", "cta", "frame", "star"]);
          const filteredPrev = prev.filter((a) => defaultIds.has(a.id));
          const mapped: BrandAsset[] = stored.map((s) => ({
            id: s.id,
            name: s.name,
            kind: s.kind,
            type: s.type,
            text: s.text,
            url: s.url || s.dataUrl,
          }));
          return [...filteredPrev, ...mapped];
        });
      }
    });
  }, []);

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
    showToast(`Przełączono na motyw ${next === "dark" ? "ciemny" : "jasny"}.`);
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
      <header className="sticky top-0 z-30 border-b backdrop-blur-md bg-[var(--bg-glass)] border-[var(--border-subtle)]">
        <div className="px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-9 px-2.5 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--burgundy)] text-white font-sinsay font-bold text-xs tracking-tight flex items-center justify-center shadow-[var(--shadow-pop)] border border-white/15">
              SiMo
            </div>
            <div>
              <b className="block text-sm font-extrabold tracking-tight leading-none text-[var(--ink-primary)] font-sinsay">
                SiMotion
              </b>
              <small className="block text-[9px] tracking-wider uppercase font-bold text-[var(--ink-muted)] mt-0.5 font-sinsay">
                Sinsay Motion Studio
              </small>
            </div>
          </div>

          {/* Centered Navigation Bar — cleanly fitted without horizontal scroll */}
          <div className="flex-1 flex justify-center px-2">
            <nav className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs">
              {(
                [
                  ["single", "Studio TikTok"],
                  ["batch", "Batch"],
                  ["post", "Montaż wideo"],
                  ["assets", "Materiały"],
                  ["static", "Grafiki"],
                  ["local", "Tłumaczenia"],
                  ["export", "Eksport"],
                  ["integrations", "Integracje"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === key
                      ? "bg-[var(--bg-card)] text-[var(--ink-primary)] shadow-sm font-bold border border-[var(--border-strong)]"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-card)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Actions & Theme toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <SharePointSyncBar
              onSyncComplete={(data) => {
                // optional live notification
              }}
            />
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors text-[var(--ink-primary)]"
              title="Przełącz motyw"
            >
              <span>{theme === "dark" ? "☀" : "☾"}</span>
              <span>{theme === "dark" ? "Jasny" : "Ciemny"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-8 flex-1">
        {/* VIEW 1: STUDIO TIKTOK */}
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
