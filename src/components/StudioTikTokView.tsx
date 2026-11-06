"use client";

import React, { useState, useRef, useEffect } from "react";
import SinsayPhraseAssistant from "./SinsayPhraseAssistant";
import AnimatedLogoModal, { SelectedLogoConfig, LOGO_VARIANTS } from "./AnimatedLogoModal";

export interface StoryboardScene {
  id: string;
  name: string;
  timeRange: string;
  prompt: string;
  pcmImage: string;
  durationSec: number;
}

interface StudioTikTokViewProps {
  productId: string;
  setProductId: (val: string) => void;
  showToast: (msg: string) => void;
  onProceedToPost: () => void;
}

export const StudioTikTokView: React.FC<StudioTikTokViewProps> = ({
  productId,
  setProductId,
  showToast,
  onProceedToPost,
}) => {
  // Model & Generation Settings
  const [aiEngine, setAiEngine] = useState<"seedance" | "higgsfield">("seedance");
  const [genMode, setGenMode] = useState<"storyboard" | "single">("storyboard");
  const [template, setTemplate] = useState("TikTok try-on · 6 scen");
  const [prompt, setPrompt] = useState(
    "Dynamiczny try-on nowej kolekcji jedwabnej. Zbliżenia na fakturę materiału, naturalny ruch modelki w ciepłym świetle atelier i wyraziste zakończenie z produktem."
  );
  const [duration, setDuration] = useState(10);

  // Formats & Smart Crop
  const [selectedRatios, setSelectedRatios] = useState<string[]>(["9x16", "4x5", "1x1"]);
  const [cropOffset, setCropOffset] = useState(0); // -50% to +50%
  const [showSafeAreas, setShowSafeAreas] = useState(true);
  const [separateRender, setSeparateRender] = useState(false);

  // Audio & Languages
  const [selectedTextLangs, setSelectedTextLangs] = useState<string[]>(["pl-PL", "en-US"]);
  const [isDubEnabled, setIsDubEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("maja");
  const [selectedBgm, setSelectedBgm] = useState("runway");
  const [selectedDubLangs, setSelectedDubLangs] = useState<string[]>(["pl-PL", "en-US"]);
  const [crossDubs, setCrossDubs] = useState(false);

  // Video Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [activePresetVideo, setActivePresetVideo] = useState<"sample" | "upload">("sample");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Animated Sinsay Logo Outro
  const [isLogoOutroEnabled, setIsLogoOutroEnabled] = useState(true);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [previewOutroForce, setPreviewOutroForce] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<SelectedLogoConfig>({
    variantId: "outro_all",
    colorScheme: "white",
    filePath: "/brand/logo_anim/biale/logo_outro_all_WH.mov",
    gifPath: "/brand/logo_anim/biale/logo_outro_all_WH.gif",
    durationSec: 2.0,
    name: "Outro All (Białe)",
  });

  // Modular Storyboard Scenes
  const [showSinsayAssistant, setShowSinsayAssistant] = useState(false);
  const [scenes, setScenes] = useState<StoryboardScene[]>([
    {
      id: "sc-1",
      name: "01 Hook",
      timeRange: "0.0–1.4 s",
      prompt: "Dynamiczne wejście modelki w kadr, ciepłe światło atelier, wzrok w obiektyw.",
      pcmImage: "model_full.jpg",
      durationSec: 1.4,
    },
    {
      id: "sc-2",
      name: "02 Sylwetka",
      timeRange: "1.4–3.2 s",
      prompt: "Prezentacja pełnego kroju sukienki midi w swobodnym kroku na neutralnym tle.",
      pcmImage: "model_full.jpg",
      durationSec: 1.8,
    },
    {
      id: "sc-3",
      name: "03 Detal tkaniny",
      timeRange: "3.2–5.0 s",
      prompt: "Makro zbliżenie na splot jedwabiu, szwy wykończeniowe i miękkie załamania światła.",
      pcmImage: "detail_fabric.jpg",
      durationSec: 1.8,
    },
    {
      id: "sc-4",
      name: "04 Ruch",
      timeRange: "5.0–7.0 s",
      prompt: "Lekki obrót modelki, tkanina unosi się w ruchu, naturalna dynamika materiału.",
      pcmImage: "model_full.jpg",
      durationSec: 2.0,
    },
    {
      id: "sc-5",
      name: "05 Hero Shot",
      timeRange: "7.0–8.6 s",
      prompt: "Mocny kadr półzbliżenia z uśmiechem, produkt doskonale wyeksponowany.",
      pcmImage: "packshot_front.jpg",
      durationSec: 1.6,
    },
    {
      id: "sc-6",
      name: "06 Outro + CTA",
      timeRange: "8.6–10.0 s",
      prompt: "Czysty packshot produktu z miejscem na logotyp SiMotion i hasło Odkryj teraz.",
      pcmImage: "packshot_front.jpg",
      durationSec: 1.4,
    },
  ]);

  const [activeEditingScene, setActiveEditingScene] = useState<string | null>(null);

  // Video time tracking
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        } else {
          setCurrentTime((prev) => {
            const next = prev + 0.1;
            return next >= duration ? 0 : next;
          });
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setActivePresetVideo("upload");
      showToast(`Załadowano wideo testowe: ${file.name}`);
    }
  };

  // Cost calculation
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
            01 / STUDIO TIKTOK &amp; REELS
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
            Jedna kreacja. Trzy kadry. Wszystkie rynki.
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Generuj bazowe wideo 9:16 i automatycznie kadruj do 4:5 oraz 1:1 bez ponoszenia potrójnych kosztów API.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onProceedToPost}
            className="px-4 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
          >
            Przekaż do Napisów i logo →
          </button>
          <button
            onClick={() =>
              showToast(
                `Zadanie wysłane do adaptera ${aiEngine.toUpperCase()} ($${totalCost})`
              )
            }
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            ✦ Uruchom generację wideo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Produkt PCM i Model AI */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                1. Produkt (PCM) &amp; Silnik AI
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]">
                ✓ PCM Połączone
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Kod MDK produktu w PCM
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-xs border font-mono bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={() => showToast(`Pobrano 3 zdjęcia dla ${productId} z API PCM.`)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                >
                  Pobierz ↻
                </button>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap text-[10px] text-[var(--ink-muted)]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  ✓ {productId}_01_packshot.jpg
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  ✓ {productId}_02_model.jpg
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  ✓ {productId}_03_detail.jpg
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Silnik wideo AI
                </label>
                <select
                  value={aiEngine}
                  onChange={(e) => setAiEngine(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="seedance">Seedance 2.0 (Moda/Ruch)</option>
                  <option value="higgsfield">Higgsfield AI (Dynamic Camera)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Tryb generacji
                </label>
                <select
                  value={genMode}
                  onChange={(e) => setGenMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="storyboard">Storyboard (6 modularnych scen)</option>
                  <option value="single">Szybki klip (1 pojedyncze ujęcie)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--ink-primary)] block">
                  Prompt reżyserski (Brief LLM)
                </label>
                <button
                  type="button"
                  onClick={() => setShowSinsayAssistant((prev) => !prev)}
                  className="text-[11px] font-bold text-[#c84b31] dark:text-[#e56b4e] hover:underline flex items-center gap-1"
                >
                  <span>✦ AI Hasła Sinsay (Top 20)</span>
                  <span>{showSinsayAssistant ? "▲ Zwiń" : "▼ Rozwiń"}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              />
            </div>

            {showSinsayAssistant && (
              <div className="pt-2">
                <SinsayPhraseAssistant
                  currentPrompt={prompt}
                  onSelectPhrase={(item) => {
                    setPrompt(`${item.pl}. Dynamiczny try-on modowy Sinsay.`);
                    showToast(`Zastosowano hasło Sinsay: "${item.pl}" (${item.score}% Match)`);
                  }}
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span>Czas trwania klipu</span>
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
              <div className="flex justify-between text-[10px] text-[var(--ink-muted)]">
                <span>5 s (Krótki Hook)</span>
                <span>10 s (Optimum)</span>
                <span>30 s (Story)</span>
              </div>
            </div>
          </div>

          {/* 2. Formaty i Smart Crop */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                2. Formaty i Smart Crop
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                1 Generacja = 3 Kadry
              </span>
            </div>

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
                <span>Punkt fokusu poziomego (Smart Crop Offset)</span>
                <span className="text-[var(--accent)] font-extrabold">
                  {cropOffset > 0 ? `+${cropOffset}%` : `${cropOffset}%`}
                </span>
              </div>
              <input
                type="range"
                min={-40}
                max={40}
                value={cropOffset}
                onChange={(e) => setCropOffset(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--ink-muted)]">
                <span>Lewo (−40%)</span>
                <span>Centrum (0%)</span>
                <span>Prawo (+40%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
              <div>
                <b className="text-xs block text-[var(--ink-primary)]">
                  Strefy bezpieczne (Safe Areas)
                </b>
                <small className="text-[10px] text-[var(--ink-muted)]">
                  Nakłada marginesy interfejsu TikTok / Reels (ikony, opis, dźwięk)
                </small>
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
                <b className="text-xs block text-[var(--ink-primary)]">
                  Wymuś osobny render AI dla każdego formatu
                </b>
                <small className="text-[10px] text-[var(--ink-muted)]">
                  Wyłącza Smart Crop (generuje 3 oddzielne wideo, wyższy koszt API)
                </small>
              </div>
              <input
                type="checkbox"
                checked={separateRender}
                onChange={(e) => setSeparateRender(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
            </div>
          </div>

          {/* 3. Języki i Dubbing ElevenLabs */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              3. Rynki, Lektor ElevenLabs &amp; Audio
            </h2>

            <div>
              <span className="text-xs font-bold block text-[var(--ink-primary)] mb-1.5">
                Wersje językowe napisów:
              </span>
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

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <b className="text-xs block text-[var(--ink-primary)]">
                  Dubbing AI (ElevenLabs TTS + Word Timestamps)
                </b>
                <small className="text-[10px] text-[var(--ink-muted)]">
                  Generuje audio lektora i znaczniki pod napisy karaoke
                </small>
              </div>
              <input
                type="checkbox"
                checked={isDubEnabled}
                onChange={(e) => setIsDubEnabled(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
            </div>

            {isDubEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                    Głos ElevenLabs
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                  >
                    <option value="maja">Maja · Ciepły Editorial</option>
                    <option value="adam">Adam · Dynamiczny Runway</option>
                    <option value="claire">Claire · Luxury Fashion</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                    Muzyka BGM (Brand Kit)
                  </label>
                  <select
                    value={selectedBgm}
                    onChange={(e) => setSelectedBgm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                  >
                    <option value="runway">Warm Runway House (122 BPM)</option>
                    <option value="minimal">Atelier Lo-Fi (98 BPM)</option>
                    <option value="none">Bez muzyki</option>
                  </select>
                </div>
              </div>
            )}

            {/* Cost Summary Box */}
            <div className="p-4 rounded-xl border bg-[var(--accent-soft)] border-[var(--accent)] flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-[var(--accent)]">
                  Estymowany koszt API: ${totalCost}
                </div>
                <small className="text-[10px] text-[var(--ink-secondary)] block">
                  {aiEngine === "seedance" ? "Seedance 2.0" : "Higgsfield"} ({duration} s ·{" "}
                  {renderMultiplier}× render) + {isDubEnabled ? selectedDubLangs.length : 0}× TTS
                </small>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[var(--bg-card)] text-[var(--accent)] shadow-sm">
                {separateRender ? "Multi-render" : "Smart Crop (−66%)"}
              </span>
            </div>
          </div>

          {/* 4. Animowane Logo Sinsay na końcu wideo (Outro) */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  4. Animowane Logo Sinsay (Outro)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#193328] text-[#75d9ae]">
                  Brand Kit LPP
                </span>
              </div>
              <input
                type="checkbox"
                checked={isLogoOutroEnabled}
                onChange={(e) => setIsLogoOutroEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#c84b31]"
              />
            </div>

            <p className="text-xs text-[var(--ink-secondary)]">
              Automatyczne doklejenie oficjalnego animowanego logo Sinsay na zakończenie każdego klipu.
            </p>

            {isLogoOutroEnabled && (
              <div className="space-y-3 pt-1 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-[var(--bg-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-11 rounded-lg bg-black/80 p-1 flex items-center justify-center shrink-0 border border-black/20">
                      <img
                        src={selectedLogo.gifPath}
                        alt={selectedLogo.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#c84b31] dark:text-[#e56b4e] block">
                        Wybrany wariant animacji:
                      </span>
                      <p className="text-xs font-semibold text-[var(--ink-primary)] mt-0.5">
                        🎬 {selectedLogo.name}
                      </p>
                      <span className="text-[10px] text-[var(--ink-muted)] block">
                        Czas: {selectedLogo.durationSec} s · After Effects (Alfa)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#211d1a] border border-[#dfd5c6] dark:border-[#38302b] hover:border-[#c84b31] text-[var(--ink-primary)] shadow-sm transition-colors whitespace-nowrap"
                  >
                    Zmień wariant ⚙
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--ink-primary)]">
                    <input
                      type="checkbox"
                      checked={previewOutroForce}
                      onChange={(e) => setPreviewOutroForce(e.target.checked)}
                      className="accent-[#c84b31]"
                    />
                    <span>Wymuś podgląd Outro w playerze teraz</span>
                  </label>
                  <span>12 wariantów (.mov)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Column: 3-Frame Live Display & Playback Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Podgląd 3 formatów w czasie rzeczywistym
                </h3>
                <small className="text-xs text-[var(--ink-muted)]">
                  Jedno źródło 9:16 automatycznie kadrowane do 4:5 oraz 1:1
                </small>
              </div>

              {/* Upload custom test video */}
              <label className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] hover:border-[var(--accent)] cursor-pointer text-[var(--ink-primary)]">
                <span>↑ Wgraj plik testowy</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Stage Container */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] grid grid-cols-3 gap-3 place-items-center min-h-[360px] overflow-hidden">
              {/* 1. 9:16 Frame */}
              <div className="w-full max-w-[140px] aspect-[9/16] rounded-2xl border-4 border-black bg-black p-2 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
                {videoFile ? (
                  <video
                    ref={videoRef}
                    src={videoFile}
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-100"
                    style={{ transform: `scale(${1 + Math.sin(currentTime) * 0.05})` }}
                  >
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                  </div>
                )}

                <div className="relative z-10 flex justify-between items-center text-[8px] font-bold text-white">
                  <span className="px-1.5 py-0.5 rounded bg-black/70">9:16 BAZA</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]">
                    {currentTime.toFixed(1)}s
                  </span>
                </div>

                {/* TikTok UI Overlay Mockup */}
                {showSafeAreas && (
                  <div className="absolute inset-2 border border-dashed border-amber-300/80 rounded-xl pointer-events-none flex flex-col justify-between p-1">
                    <span className="text-[7px] text-amber-200 self-start bg-black/50 px-1 rounded">
                      Safe Area Top
                    </span>
                    <span className="text-[7px] text-amber-200 self-end bg-black/50 px-1 rounded">
                      Safe Area Bottom
                    </span>
                  </div>
                )}

                {/* Sinsay Animated Logo Outro Overlay */}
                {isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= Math.max(0, duration - selectedLogo.durationSec))) && (
                  <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
                    <img
                      src={selectedLogo.gifPath}
                      alt={selectedLogo.name}
                      className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
                    />
                    <span className="text-[7px] font-mono tracking-widest text-[#e56b4e] uppercase block mt-1">
                      {selectedLogo.name}
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  <p className="text-[10px] font-extrabold text-white leading-tight drop-shadow-md">
                    Nowa kolekcja<br />na Twój sposób
                  </p>
                </div>
              </div>

              {/* 2. 4:5 Frame (Smart Crop with offset) */}
              <div className="w-full max-w-[170px] aspect-[4/5] rounded-2xl border-4 border-black bg-black p-2 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
                {videoFile ? (
                  <video
                    src={videoFile}
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                    style={{ transform: `translateX(${cropOffset * 0.8}%)` }}
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-150"
                    style={{
                      transform: `translateX(${cropOffset * 0.8}%) scale(${
                        1 + Math.sin(currentTime) * 0.05
                      })`,
                    }}
                  >
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                  </div>
                )}

                <div className="relative z-10 flex justify-between items-center text-[8px] font-bold text-white">
                  <span className="px-1.5 py-0.5 rounded bg-black/70">4:5 CROP</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]">Feed</span>
                </div>

                {showSafeAreas && (
                  <div className="absolute inset-2 border border-dashed border-amber-300/80 rounded-xl pointer-events-none" />
                )}

                {/* Sinsay Animated Logo Outro Overlay */}
                {isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= Math.max(0, duration - selectedLogo.durationSec))) && (
                  <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
                    <img
                      src={selectedLogo.gifPath}
                      alt={selectedLogo.name}
                      className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
                    />
                    <span className="text-[7px] font-mono tracking-widest text-[#e56b4e] uppercase block mt-1">
                      {selectedLogo.name}
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  <p className="text-[10px] font-extrabold text-white leading-tight drop-shadow-md">
                    Nowa kolekcja<br />na Twój sposób
                  </p>
                </div>
              </div>

              {/* 3. 1:1 Frame (Smart Crop with offset) */}
              <div className="w-full max-w-[180px] aspect-square rounded-2xl border-4 border-black bg-black p-2 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
                {videoFile ? (
                  <video
                    src={videoFile}
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                    style={{ transform: `translateX(${cropOffset * 1.1}%)` }}
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-150"
                    style={{
                      transform: `translateX(${cropOffset * 1.1}%) scale(${
                        1 + Math.sin(currentTime) * 0.05
                      })`,
                    }}
                  >
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                  </div>
                )}

                <div className="relative z-10 flex justify-between items-center text-[8px] font-bold text-white">
                  <span className="px-1.5 py-0.5 rounded bg-black/70">1:1 CROP</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]">Kwadrat</span>
                </div>

                {showSafeAreas && (
                  <div className="absolute inset-2 border border-dashed border-amber-300/80 rounded-xl pointer-events-none" />
                )}

                {/* Sinsay Animated Logo Outro Overlay */}
                {isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= Math.max(0, duration - selectedLogo.durationSec))) && (
                  <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
                    <img
                      src={selectedLogo.gifPath}
                      alt={selectedLogo.name}
                      className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
                    />
                    <span className="text-[7px] font-mono tracking-widest text-[#e56b4e] uppercase block mt-1">
                      {selectedLogo.name}
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  <p className="text-[10px] font-extrabold text-white leading-tight drop-shadow-md">
                    Nowa kolekcja<br />na Twój sposób
                  </p>
                </div>
              </div>
            </div>

            {/* Playback Transport Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayback}
                  className="w-9 h-9 rounded-full bg-[var(--accent)] text-white font-extrabold text-sm grid place-items-center shadow-md hover:opacity-95"
                  title={isPlaying ? "Zatrzymaj" : "Odtwórz"}
                >
                  {isPlaying ? "❚❚" : "▶"}
                </button>
                <div className="text-xs font-mono font-bold text-[var(--ink-primary)]">
                  {currentTime.toFixed(1)}s / {duration}s
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const time = Number(e.target.value);
                    setCurrentTime(time);
                    if (videoRef.current) videoRef.current.currentTime = time;
                  }}
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <div className="text-xs font-bold text-[var(--ink-secondary)]">
                Fokus kadru: <span className="text-[var(--accent)]">{cropOffset}%</span>
              </div>
            </div>
          </div>

          {/* Modular Storyboard Grid with Editing */}
          <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Storyboard modularny (6 scen)
                </h3>
                <small className="text-xs text-[var(--ink-muted)]">
                  Kliknij „Edytuj”, aby zmienić prompt ujęcia lub „↻” aby przelosować tylko jedną scenę
                </small>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--ink-primary)]">
                {duration} s łącznie
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    activeEditingScene === scene.id
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-md"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)]"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-[var(--accent)] mb-1">
                      <span>{scene.name}</span>
                      <span className="font-mono">{scene.timeRange}</span>
                    </div>

                    {activeEditingScene === scene.id ? (
                      <textarea
                        rows={2}
                        value={scene.prompt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScenes((prev) =>
                            prev.map((s) => (s.id === scene.id ? { ...s, prompt: val } : s))
                          );
                        }}
                        className="w-full text-xs p-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
                      />
                    ) : (
                      <p className="text-xs text-[var(--ink-secondary)] line-clamp-2">
                        {scene.prompt}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] mt-2 flex items-center justify-between gap-1.5">
                    <span className="text-[9px] font-mono text-[var(--ink-muted)] truncate">
                      PCM: {scene.pcmImage}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setActiveEditingScene(
                            activeEditingScene === scene.id ? null : scene.id
                          )
                        }
                        className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                      >
                        {activeEditingScene === scene.id ? "Zapisz" : "Edytuj"}
                      </button>
                      <button
                        onClick={() =>
                          showToast(
                            `Przelosowano Scenę ${scene.name.split(" ")[0]} w silniku ${aiEngine.toUpperCase()} (pozostałe 5 scen zachowano).`
                          )
                        }
                        className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--accent)]"
                        title="Przelosuj ujęcie"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Animated Sinsay Logo Modal */}
      <AnimatedLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        selectedConfig={selectedLogo}
        onSelectConfig={(cfg) => {
          setSelectedLogo(cfg);
          showToast(`Ustawiono logo: ${cfg.name}`);
        }}
      />
    </div>
  );
};
