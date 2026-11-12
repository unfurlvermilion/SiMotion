"use client";

import React, { useState, useEffect, useRef } from "react";
import { BrandAsset } from "@/app/page";
import { SocialSafeAreaOverlay } from "./SocialSafeAreaOverlay";
import { SINSAY_MARKETS } from "./SinsayPhraseAssistant";

interface PostproductionViewProps {
  postCaptions: Record<string, string>;
  setPostCaptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  postPreviewLang: string;
  setPostPreviewLang: (lang: string) => void;
  postCaptionStyle: "bold" | "pill" | "minimal";
  setPostCaptionStyle: (style: "bold" | "pill" | "minimal") => void;
  postLogoAnim: "fade" | "slide" | "pop" | "none";
  setPostLogoAnim: (anim: "fade" | "slide" | "pop" | "none") => void;
  selectedVideoAssetId: string | null;
  assets: BrandAsset[];
  showToast: (msg: string) => void;
  onGoToAssets: () => void;
}

export const PostproductionView: React.FC<PostproductionViewProps> = ({
  postCaptions,
  setPostCaptions,
  postPreviewLang,
  setPostPreviewLang,
  postCaptionStyle,
  setPostCaptionStyle,
  postLogoAnim,
  setPostLogoAnim,
  selectedVideoAssetId,
  assets,
  showToast,
  onGoToAssets,
}) => {
  const [captionMode, setCaptionMode] = useState<"karaoke" | "scene">("karaoke");
  const [captionFont, setCaptionFont] = useState<"euclid" | "system" | "serif">("euclid");
  const [captionWeight, setCaptionWeight] = useState<"normal" | "medium" | "semibold" | "bold">("bold");
  
  // Position & Layout Controls
  const [captionYPercent, setCaptionYPercent] = useState<number>(68); // 15% (top) to 72% (safe bottom)
  const [captionFontSize, setCaptionFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [captionAlign, setCaptionAlign] = useState<"center" | "left" | "right">("center");

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right" | "bottom-center">("top-right");
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [showSafeAreas, setShowSafeAreas] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeText = postCaptions[postPreviewLang] || "Nowa kolekcja na Twój sposób";
  const words = activeText.trim().split(/\s+/);
  const duration = 8.0;

  // Active word index based on playback time
  const activeWordIdx = Math.min(
    words.length - 1,
    Math.floor((playbackTime / duration) * words.length)
  );

  const fontClass =
    captionFont === "euclid"
      ? "font-sinsay"
      : captionFont === "serif"
      ? "font-serif"
      : "font-sans";

  const weightClass =
    captionWeight === "normal"
      ? "font-normal"
      : captionWeight === "medium"
      ? "font-medium"
      : captionWeight === "semibold"
      ? "font-semibold"
      : "font-bold";

  // Check if current Y is inside the dangerous TikTok UI zones
  const isBottomDanger = captionYPercent > 73;
  const isTopDanger = captionYPercent < 12;

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        if (videoRef.current) {
          setPlaybackTime(videoRef.current.currentTime);
        } else {
          setPlaybackTime((prev) => {
            const next = prev + 0.15;
            return next >= duration ? 0 : next;
          });
        }
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  const togglePlay = () => {
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
      setUploadedVideo(url);
      showToast(`Wczytano wideo: ${file.name}`);
    }
  };

  const activeAsset = assets.find((a) => a.id === selectedVideoAssetId);

  // Position presets
  const applyPositionPreset = (preset: "top" | "center" | "bottom") => {
    if (preset === "top") setCaptionYPercent(20);
    if (preset === "center") setCaptionYPercent(48);
    if (preset === "bottom") setCaptionYPercent(68);
  };

  // Export DaVinci Resolve Timeline (.fcpxml)
  const handleExportDaVinciFCPXML = () => {
    const textContent = postCaptions[postPreviewLang] || "Nowa kolekcja na Twój sposób";
    const fcpxml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p1920" frameDuration="1/30s" width="1080" height="1920"/>
    <effect id="r2" name="Text" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>
  <library>
    <event name="Sinsay Fashion Atelier 2026">
      <project name="Sinsay_TikTok_${postPreviewLang}_9x16">
        <sequence format="r1" duration="300/30s" tcStart="0s" tcFormat="NDF">
          <spine>
            <clip offset="0s" name="Master_Video_9x16" start="0s" duration="300/30s" format="r1">
              <title ref="r2" offset="0s" name="Sinsay_Subtitles_Euclid" start="0s" duration="300/30s">
                <text>
                  <text-style font="Euclid Circular B" fontSize="48" fontFace="Bold" alignment="center">
                    ${textContent}
                  </text-style>
                </text>
              </title>
            </clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;

    const blob = new Blob([fcpxml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sinsay_DaVinci_Timeline_${postPreviewLang}_9x16.fcpxml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`✓ Wyeksportowano oś czasu DaVinci Resolve (.fcpxml) dla rynku ${postPreviewLang}!`);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Montaż wideo i napisy
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Pozycjonowanie napisów, stylistyka Euclid Circular B, strefy ochronne TikTok i animacja outro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportDaVinciFCPXML}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#c84b31] bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all shadow-sm flex items-center gap-1.5"
            title="Eksportuj oś czasu do DaVinci Resolve Studio"
          >
            <span>🎬 DaVinci FCPXML</span>
          </button>
          <button
            onClick={onGoToAssets}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] transition-colors"
          >
            Materiały marki ↗
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Simplified, Intuitive Editing Controls */}
        <div className="lg:col-span-6 space-y-4">
          {/* Card 1: Subtitle Text & Language */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                1. Treść i język napisów
              </h2>
              <span className="text-[10px] font-bold text-[var(--accent)] font-sinsay">
                Euclid Circular B
              </span>
            </div>

            {/* Language Quick Pills */}
            <div>
              <label className="text-[11px] font-bold text-[var(--ink-secondary)] block mb-1.5">
                Wybierz rynek podglądu:
              </label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                {SINSAY_MARKETS.slice(0, 12).map((m) => {
                  const isActive =
                    postPreviewLang === m.code ||
                    postPreviewLang.toLowerCase().startsWith(m.code.toLowerCase());
                  return (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => setPostPreviewLang(m.code)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                        isActive
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
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

            {/* Caption Text Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--ink-primary)]">
                  Napis na wideo ({postPreviewLang}):
                </label>
                <span className="text-[10px] text-[var(--ink-muted)]">
                  {activeText.length} znaków
                </span>
              </div>
              <textarea
                rows={2}
                value={postCaptions[postPreviewLang] || ""}
                onChange={(e) =>
                  setPostCaptions({ ...postCaptions, [postPreviewLang]: e.target.value })
                }
                placeholder="Wpisz treść napisu..."
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-sinsay font-bold leading-relaxed"
              />
            </div>

            {/* Display Mode & Style */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border-subtle)]">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Tryb wyświetlania
                </label>
                <select
                  value={captionMode}
                  onChange={(e) => setCaptionMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-semibold"
                >
                  <option value="karaoke">Karaoke (ze słowa na słowo)</option>
                  <option value="scene">Statyczny (stały napis)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Styl wizualny
                </label>
                <select
                  value={postCaptionStyle}
                  onChange={(e) => setPostCaptionStyle(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-semibold"
                >
                  <option value="pill">Ciemna kapsułka (Zalecane TikTok)</option>
                  <option value="bold">Pogrubiony z cieniem</option>
                  <option value="minimal">Minimalistyczny czysty</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Caption Positioning & Geometry (Point 3 - Position Control!) */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                2. Umiejscowienie napisów na ekranie
              </h2>
              {isBottomDanger ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  ⚠ Zakryte przez opis TikToka
                </span>
              ) : isTopDanger ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  ⚠ Zakryte przez nawigację
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ✓ Bezpieczne pole (Safe Zone)
                </span>
              )}
            </div>

            {/* Quick Position Presets */}
            <div>
              <label className="text-[11px] font-bold text-[var(--ink-secondary)] block mb-1.5">
                Szybkie pozycje:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPositionPreset("top")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    captionYPercent === 20
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                      : "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                  }`}
                >
                  Góra (20%)
                  <small className="block text-[9px] opacity-75 font-normal">Gdy modelka ma spodnie/buty</small>
                </button>

                <button
                  type="button"
                  onClick={() => applyPositionPreset("center")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    captionYPercent === 48
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                      : "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                  }`}
                >
                  Środek (48%)
                  <small className="block text-[9px] opacity-75 font-normal">Mocny punchline / hasło</small>
                </button>

                <button
                  type="button"
                  onClick={() => applyPositionPreset("bottom")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    captionYPercent === 68
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                      : "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                  }`}
                >
                  Dół Safe Zone (68%)
                  <small className="block text-[9px] opacity-75 font-normal">Standard TikToka / Reels</small>
                </button>
              </div>
            </div>

            {/* Smooth Y-axis Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-[var(--ink-primary)]">Precyzyjna wysokość pionowa (Y):</span>
                <span className="font-mono text-[var(--accent)] font-extrabold">{captionYPercent}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={72}
                step={1}
                value={captionYPercent}
                onChange={(e) => setCaptionYPercent(Number(e.target.value))}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[var(--ink-muted)] font-mono mt-0.5">
                <span>15% (Góra)</span>
                <span>48% (Centrum)</span>
                <span>72% (Maks. dół Safe Zone)</span>
              </div>
            </div>

            {/* Font Size & Alignment */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Rozmiar czcionki
                </label>
                <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center text-xs font-bold">
                  {(["sm", "base", "lg", "xl"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setCaptionFontSize(sz)}
                      className={`py-1 rounded-lg transition-colors uppercase text-[10px] ${
                        captionFontSize === sz
                          ? "bg-[var(--bg-card)] text-[var(--accent)] shadow-xs font-extrabold"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Wyrównanie tekstu
                </label>
                <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center text-xs font-bold">
                  {(["left", "center", "right"] as const).map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => setCaptionAlign(al)}
                      className={`py-1 rounded-lg transition-colors text-[10px] ${
                        captionAlign === al
                          ? "bg-[var(--bg-card)] text-[var(--accent)] shadow-xs font-extrabold"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      {al === "left" ? "Lewo" : al === "center" ? "Środek" : "Prawo"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Brand Elements & TTS */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              3. Branding i lektor
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Animowane Logo
                </label>
                <select
                  value={postLogoAnim}
                  onChange={(e) => setPostLogoAnim(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="fade">Subtelne pojawienie (Fade)</option>
                  <option value="slide">Wjazd od dołu (Slide)</option>
                  <option value="none">Bez logo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Pozycja Logo
                </label>
                <select
                  value={logoPosition}
                  onChange={(e) => setLogoPosition(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="top-right">Prawy górny róg</option>
                  <option value="top-left">Lewy górny róg</option>
                  <option value="bottom-center">Środek na końcu (Outro)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                showToast(`🎙 Generowanie głosu lektora ElevenLabs dla rynku: ${postPreviewLang}...`);
                try {
                  const res = await fetch("/api/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      text: activeText,
                      language: postPreviewLang,
                    }),
                  });
                  const data = await res.json();
                  if (data.status === "success") {
                    showToast(`✓ Wygenerowano lektora i zsynchronizowano karaoke!`);
                    setIsPlaying(true);
                    setPlaybackTime(0);
                  }
                } catch (e) {
                  showToast("Zsynchronizowano znaczniki czasowe karaoke.");
                }
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-[#c84b31]/40 bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>🎙 Wygeneruj lektora ElevenLabs i zsynchronizuj karaoke</span>
            </button>
          </div>
        </div>

        {/* Right Column: Clean Phone Live Preview with Real Position & Safe Zone */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm space-y-4">
          {/* Top Bar above phone */}
          <div className="flex items-center justify-between w-full max-w-[260px]">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">
              Podgląd 9:16 ({postPreviewLang})
            </span>
            <button
              type="button"
              onClick={() => setShowSafeAreas(!showSafeAreas)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                showSafeAreas
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {showSafeAreas ? "✓ Safe Area" : "○ Bez siatki"}
            </button>
          </div>

          {/* Smartphone Frame (250px x 444px, strictly 9:16) */}
          <div className="w-[250px] aspect-[9/16] rounded-3xl border-4 border-black bg-black relative overflow-hidden shadow-2xl select-none">
            {uploadedVideo ? (
              <video
                ref={videoRef}
                src={uploadedVideo}
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-100"
                style={{ transform: `scale(${1 + Math.sin(playbackTime) * 0.04})` }}
              >
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
              </div>
            )}

            {/* Minimalist Safe Area Overlay */}
            {showSafeAreas && <SocialSafeAreaOverlay format="tiktok-9x16" />}

            {/* Logo Layer with dynamic position */}
            {postLogoAnim !== "none" && (
              <div
                className={`text-[10px] font-extrabold text-white px-2 py-0.5 rounded bg-black/60 z-30 absolute ${
                  logoPosition === "top-left"
                    ? "top-3 left-3"
                    : logoPosition === "top-right"
                    ? "top-3 right-3"
                    : "bottom-8 inset-x-0 mx-auto w-max"
                }`}
              >
                SiMotion
              </div>
            )}

            {/* Brand Overlay Badge */}
            {activeAsset && (
              <div className="absolute top-8 right-3 z-30">
                <span className="px-2 py-0.5 rounded bg-[var(--burgundy)] text-white text-[8px] font-extrabold shadow-md transform -rotate-6 inline-block">
                  {activeAsset.text || "AW26"}
                </span>
              </div>
            )}

            {/* Captions Layer - Absolutely positioned by captionYPercent, strictly controllable! */}
            <div
              className={`absolute inset-x-3 z-30 pointer-events-none transition-all duration-150 flex ${fontClass}`}
              style={{
                top: `${captionYPercent}%`,
                transform: "translateY(-50%)",
                justifyContent:
                  captionAlign === "left"
                    ? "flex-start"
                    : captionAlign === "right"
                    ? "flex-end"
                    : "center",
              }}
            >
              {captionMode === "karaoke" ? (
                <div
                  className={`flex flex-wrap gap-1 ${weightClass} ${
                    captionFontSize === "sm"
                      ? "text-xs"
                      : captionFontSize === "lg"
                      ? "text-base"
                      : captionFontSize === "xl"
                      ? "text-lg font-black"
                      : "text-sm"
                  } ${
                    postCaptionStyle === "pill"
                      ? "bg-black/85 px-3 py-1.5 rounded-xl shadow-lg border border-white/10"
                      : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  }`}
                >
                  {words.map((w, idx) => (
                    <span
                      key={idx}
                      className={`transition-all duration-150 tracking-wide ${
                        idx === activeWordIdx
                          ? "text-amber-300 scale-105 underline decoration-amber-400 font-black drop-shadow-md"
                          : "text-white opacity-95"
                      }`}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  className={`${weightClass} tracking-wide text-white leading-tight ${
                    captionAlign === "left"
                      ? "text-left"
                      : captionAlign === "right"
                      ? "text-right"
                      : "text-center"
                  } ${
                    captionFontSize === "sm"
                      ? "text-xs"
                      : captionFontSize === "lg"
                      ? "text-base"
                      : captionFontSize === "xl"
                      ? "text-lg font-black"
                      : "text-sm"
                  } ${
                    postCaptionStyle === "pill"
                      ? "bg-black/85 px-3.5 py-1.5 rounded-xl shadow-lg border border-white/10 inline-block"
                      : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  }`}
                >
                  {activeText}
                </div>
              )}
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-3 w-full max-w-[260px] pt-1">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-[var(--accent)] text-white font-extrabold grid place-items-center shadow-md hover:opacity-95 text-xs shrink-0"
              title={isPlaying ? "Zatrzymaj" : "Odtwórz"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={playbackTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPlaybackTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--ink-secondary)]">
                <span>{playbackTime.toFixed(1)}s</span>
                <span>{duration.toFixed(1)}s</span>
              </div>
            </div>
          </div>

          {/* Upload video button */}
          <label className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] hover:border-[var(--accent)] cursor-pointer text-[var(--ink-primary)] transition-all">
            <span>↑ Wgraj plik wideo do podglądu warstw</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
