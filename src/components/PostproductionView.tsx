"use client";

import React, { useState, useEffect, useRef } from "react";
import { BrandAsset } from "@/app/page";
import { SocialSafeAreaOverlay } from "./SocialSafeAreaOverlay";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right" | "bottom-center">("top-left");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["pl-PL", "en-US", "de-DE"]);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Montaż wideo
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Napisy, animowane logo outro i nakładki marki na wideo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGoToAssets}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
          >
            Materiały marki ↗
          </button>
          <button
            onClick={() => showToast("Zsynchronizowano teksty z arkuszem SharePoint.")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            Pobierz z SharePoint ↻
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Napisy
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Tryb napisów
                </label>
                <select
                  value={captionMode}
                  onChange={(e) => setCaptionMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="karaoke">Karaoke (synchroniczne)</option>
                  <option value="scene">Statyczne</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Styl wizualny
                </label>
                <select
                  value={postCaptionStyle}
                  onChange={(e) => setPostCaptionStyle(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="bold">Pogrubione</option>
                  <option value="pill">Kapsułka z tłem</option>
                  <option value="minimal">Minimalistyczne</option>
                </select>
              </div>
            </div>

            {/* Brand Font & Weight Configuration */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-[#c84b31]/40 dark:border-[#e56b4e]/40 bg-[var(--accent-soft)]">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] flex items-center justify-between mb-1">
                  <span>Krój pisma (Font)</span>
                  <span className="text-[9px] font-bold text-[#c84b31] dark:text-[#e56b4e]">Brand Kit LPP</span>
                </label>
                <select
                  value={captionFont}
                  onChange={(e) => setCaptionFont(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-white dark:bg-[#211d1a] border-[var(--border-strong)] text-[var(--ink-primary)] font-semibold"
                >
                  <option value="euclid">✦ Euclid Circular B (Oficjalny Sinsay)</option>
                  <option value="system">Inter / System Sans</option>
                  <option value="serif">Playfair / Editorial Serif</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Grubość (Weight)
                </label>
                <select
                  value={captionWeight}
                  onChange={(e) => setCaptionWeight(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-white dark:bg-[#211d1a] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="normal">Regular (400)</option>
                  <option value="medium">Medium (500)</option>
                  <option value="semibold">Semibold (600)</option>
                  <option value="bold">Bold (700 - Rekomendowany)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Język w podglądzie
              </label>
              <select
                value={postPreviewLang}
                onChange={(e) => setPostPreviewLang(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              >
                <option value="pl-PL">🇵🇱 Polski · PL</option>
                <option value="ro-RO">🇷🇴 Română · RO (Główny rynek)</option>
                <option value="cz-CZ">🇨🇿 Čeština · CZ</option>
                <option value="de-DE">🇩🇪 Deutsch · DE</option>
                <option value="hu-HU">🇭🇺 Magyar · HU</option>
                <option value="it-IT">🇮🇹 Italiano · IT</option>
                <option value="hr-HR">🇭🇷 Hrvatski · HR</option>
                <option value="en-US">🇬🇧 English · EN (Fallback)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--ink-primary)]">
                  Tekst napisu dla tego rynku
                </label>
                <span className="text-[10px] text-[#c84b31] dark:text-[#e56b4e] font-semibold">
                  Font: Euclid Circular B
                </span>
              </div>
              <textarea
                rows={2}
                value={postCaptions[postPreviewLang] || ""}
                onChange={(e) =>
                  setPostCaptions({ ...postCaptions, [postPreviewLang]: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-sinsay"
              />
              <button
                type="button"
                onClick={async () => {
                  showToast(`🎙 Generowanie głosu lektora ElevenLabs dla rynku: ${postPreviewLang}...`);
                  try {
                    const res = await fetch("/api/tts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        text: postCaptions[postPreviewLang] || "Nowa kolekcja Sinsay na Twój sposób.",
                        language: postPreviewLang,
                      }),
                    });
                    const data = await res.json();
                    if (data.status === "success") {
                      showToast(`✓ Wygenerowano lektora i znaczniki karaoke (${data.alignment?.characters?.length || 0} znaków)`);
                      setIsPlaying(true);
                      setPlaybackTime(0);
                    }
                  } catch (e) {
                    showToast("Błąd łączenia z ElevenLabs API");
                  }
                }}
                className="mt-1.5 w-full py-1.5 px-3 rounded-lg text-[11px] font-bold border border-[#c84b31]/40 bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>🎙 Wygeneruj lektora ElevenLabs & zsynchronizuj karaoke</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-3">
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

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Pozycja Logo
                </label>
                <select
                  value={logoPosition}
                  onChange={(e) => setLogoPosition(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="top-left">Góra / Lewo</option>
                  <option value="top-right">Góra / Prawo</option>
                  <option value="bottom-center">Dół / Środek (Outro)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <b className="text-xs block text-[var(--ink-primary)]">Przypięta nakładka marki</b>
                <small className="text-[10px] text-[var(--ink-muted)]">
                  {activeAsset ? activeAsset.name : "Brak nakładki"}
                </small>
              </div>
              <button
                onClick={onGoToAssets}
                className="px-3 py-1 rounded-lg text-xs font-bold border bg-[var(--bg-subtle)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
              >
                Zmień w Brand Kit
              </button>
            </div>
          </div>

          {/* Export version summary */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Gotowe wersje z napisami ({selectedLangs.length} rynki)
            </h3>
            <div className="space-y-1.5">
              {selectedLangs.map((lang) => (
                <div
                  key={lang}
                  className="p-2 rounded-xl border bg-[var(--bg-subtle)] border-[var(--border-subtle)] flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-[11px] text-[var(--ink-primary)]">
                    KR-042_9x16_{lang}_sub_{postCaptionStyle}.mp4
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]">
                    ✓ Gotowy montaż
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Display */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm space-y-4">
          <div className="flex items-center justify-between w-full max-w-[260px]">
            <span className="text-xs font-bold text-[var(--ink-secondary)]">
              Podgląd 9:16
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[var(--ink-primary)]">
              <input
                type="checkbox"
                checked={showSafeAreas}
                onChange={(e) => setShowSafeAreas(e.target.checked)}
                className="w-3.5 h-3.5 accent-[var(--accent)]"
              />
              <span>Strefy TikTok (2025/2026)</span>
            </label>
          </div>

          <div className="w-[240px] aspect-[9/16] rounded-3xl border-4 border-black bg-black p-4 flex flex-col justify-between text-center relative overflow-hidden shadow-2xl">
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

            {/* TikTok Safe Area Overlay */}
            {showSafeAreas && <SocialSafeAreaOverlay format="tiktok-9x16" />}

            {/* Logo Layer with dynamic position & animation */}
            {postLogoAnim !== "none" && (
              <div
                className={`text-xs font-extrabold text-white px-2 py-0.5 rounded bg-black/60 z-10 ${
                  logoPosition === "top-left"
                    ? "self-start"
                    : logoPosition === "top-right"
                    ? "self-end"
                    : "self-center my-auto"
                } ${
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
            )}

            {/* Brand Overlay Badge */}
            {activeAsset && (
              <div className="absolute top-12 right-3 z-10">
                <span className="px-2 py-1 rounded bg-[var(--burgundy)] text-white text-[9px] font-extrabold shadow-md transform -rotate-6 inline-block">
                  {activeAsset.text || "AW26"}
                </span>
              </div>
            )}

            {/* Captions Layer - safely positioned within Safe Zone when enabled */}
            <div className={`relative z-10 transition-all duration-200 ${showSafeAreas ? "mb-14" : "pb-4"} ${fontClass}`}>
              {captionMode === "karaoke" ? (
                <div
                  className={`flex flex-wrap justify-center gap-1.5 text-base ${weightClass} ${
                    postCaptionStyle === "pill"
                      ? "bg-black/85 px-4 py-2.5 rounded-xl shadow-lg border border-white/10"
                      : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  }`}
                >
                  {words.map((w, idx) => (
                    <span
                      key={idx}
                      className={`transition-all duration-150 tracking-wide ${
                        idx === activeWordIdx
                          ? "text-amber-300 scale-110 underline decoration-amber-400 font-black drop-shadow-md"
                          : "text-white opacity-90"
                      }`}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  className={`text-base ${weightClass} tracking-wide text-white text-center ${
                    postCaptionStyle === "pill"
                      ? "bg-black/85 px-4 py-2.5 rounded-xl shadow-lg border border-white/10 inline-block"
                      : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  }`}
                >
                  {activeText}
                </div>
              )}
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-4 mt-6 w-full max-w-sm">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[var(--accent)] text-white font-extrabold grid place-items-center shadow-lg hover:opacity-95"
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
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--ink-secondary)] mt-0.5">
                <span>{playbackTime.toFixed(1)}s</span>
                <span>{duration.toFixed(1)}s</span>
              </div>
            </div>
          </div>

          <label className="mt-4 px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] hover:border-[var(--accent)] cursor-pointer text-[var(--ink-primary)]">
            <span>↑ Wgraj plik wideo do podglądu warstw</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
