"use client";

import React, { useState } from "react";

export interface LogoAnimationVariant {
  id: string;
  name: string;
  desc: string;
  fileBlack: string;
  fileWhite: string;
  durationSec: number;
  type: "outro" | "intro" | "accent";
  isRecommended?: boolean;
}

export const LOGO_VARIANTS: LogoAnimationVariant[] = [
  {
    id: "outro_all",
    name: "Outro All (Pełne Logo)",
    desc: "Oficjalne zakończenie wideo z animacją całego sygnetu Sinsay.",
    fileBlack: "/brand/logo_anim/czarne/logo_outro_all.mov",
    fileWhite: "/brand/logo_anim/biale/logo_outro_all_WH.mov",
    durationSec: 2.0,
    type: "outro",
    isRecommended: true,
  },
  {
    id: "outro_i",
    name: "Outro 'i' (Akcent)",
    desc: "Dynamiczne zakończenie z zaakcentowaniem kropki nad 'i'.",
    fileBlack: "/brand/logo_anim/czarne/logo_outro_i.mov",
    fileWhite: "/brand/logo_anim/biale/logo_outro_i_WH.mov",
    durationSec: 1.8,
    type: "outro",
  },
  {
    id: "fajka",
    name: "Logo Fajka (Checkmark)",
    desc: "Szybka animacja z charakterystycznym gestem fajki.",
    fileBlack: "/brand/logo_anim/czarne/logo_fajka.mov",
    fileWhite: "/brand/logo_anim/biale/logo_fajka_WH.mov",
    durationSec: 1.6,
    type: "accent",
  },
  {
    id: "kolor",
    name: "Logo Kolor",
    desc: "Animacja z dynamicznym przejściem tonalnym.",
    fileBlack: "/brand/logo_anim/czarne/logo_kolor.mov",
    fileWhite: "/brand/logo_anim/biale/logo_kolor_WH.mov",
    durationSec: 2.2,
    type: "accent",
  },
  {
    id: "intro_all",
    name: "Intro All (Wejście)",
    desc: "Animowane wejście marki na początku klipu.",
    fileBlack: "/brand/logo_anim/czarne/logo_intro_all.mov",
    fileWhite: "/brand/logo_anim/biale/logo_intro_all_WH.mov",
    durationSec: 2.4,
    type: "intro",
  },
  {
    id: "intro_i",
    name: "Intro 'i'",
    desc: "Krótkie wejście rozpoczynające się od znaku 'i'.",
    fileBlack: "/brand/logo_anim/czarne/logo_intro_i.mov",
    fileWhite: "/brand/logo_anim/biale/logo_intro_i_WH.mov",
    durationSec: 1.9,
    type: "intro",
  },
];

export interface SelectedLogoConfig {
  variantId: string;
  colorScheme: "white" | "black";
  filePath: string;
  durationSec: number;
  name: string;
}

interface AnimatedLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConfig: SelectedLogoConfig;
  onSelectConfig: (config: SelectedLogoConfig) => void;
}

export default function AnimatedLogoModal({
  isOpen,
  onClose,
  selectedConfig,
  onSelectConfig,
}: AnimatedLogoModalProps) {
  const [activeVariantId, setActiveVariantId] = useState<string>(selectedConfig.variantId || "outro_all");
  const [colorScheme, setColorScheme] = useState<"white" | "black">(selectedConfig.colorScheme || "white");
  const [filterType, setFilterType] = useState<"all" | "outro" | "intro" | "accent">("all");

  if (!isOpen) return null;

  const currentVariant =
    LOGO_VARIANTS.find((v) => v.id === activeVariantId) || LOGO_VARIANTS[0];

  const currentFilePath =
    colorScheme === "white" ? currentVariant.fileWhite : currentVariant.fileBlack;

  const handleApply = () => {
    onSelectConfig({
      variantId: currentVariant.id,
      colorScheme,
      filePath: currentFilePath,
      durationSec: currentVariant.durationSec,
      name: `${currentVariant.name} (${colorScheme === "white" ? "Białe" : "Czarne"})`,
    });
    onClose();
  };

  const filteredVariants = LOGO_VARIANTS.filter((v) => {
    if (filterType === "all") return true;
    return v.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-2xl border border-[#38302b] bg-[#1a1714] text-[#f7f3ec] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#38302b] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c84b31] to-[#6e1d2f] text-white font-serif font-bold text-lg grid place-items-center shadow-md">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-[#f7f3ec]">
                  Wybierz Animowane Logo Sinsay na Koniec Wideo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#193328] text-[#75d9ae]">
                  Brand Kit LPP
                </span>
              </div>
              <p className="text-xs text-[#b8aea4]">
                Oficjalne warianty animacji logo (.mov / After Effects) z przezroczystością.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8e8379] hover:text-[#f7f3ec] text-xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Color Scheme Switcher & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#211d1a] p-3 rounded-xl border border-[#38302b]">
          {/* Color Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#b8aea4]">Wersja kolorystyczna:</span>
            <div className="flex items-center p-1 rounded-lg bg-[#1a1714] border border-[#38302b]">
              <button
                type="button"
                onClick={() => setColorScheme("white")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  colorScheme === "white"
                    ? "bg-white text-[#1c1816] shadow-sm"
                    : "text-[#b8aea4] hover:text-white"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400" />
                <span>Białe (na ciemne tło)</span>
              </button>
              <button
                type="button"
                onClick={() => setColorScheme("black")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  colorScheme === "black"
                    ? "bg-[#292420] text-white border border-[#5c4d42] shadow-sm"
                    : "text-[#b8aea4] hover:text-white"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-black border border-gray-500" />
                <span>Czarne (na jasne tło)</span>
              </button>
            </div>
          </div>

          {/* Filter Types */}
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: "all", label: "Wszystkie (6)" },
              { id: "outro", label: "Outro (Zakończenie)" },
              { id: "accent", label: "Akcenty" },
              { id: "intro", label: "Intro" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterType === f.id
                    ? "bg-[#c84b31] text-white font-semibold"
                    : "text-[#8e8379] hover:text-[#f7f3ec] hover:bg-[#292420]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Variants + Live Preview Side */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Variants list (7 columns) */}
          <div className="md:col-span-7 space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredVariants.map((v) => {
              const isSelected = activeVariantId === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setActiveVariantId(v.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? "border-[#c84b31] bg-[#38211c]/40 shadow-sm"
                      : "border-[#38302b] bg-[#211d1a]/60 hover:bg-[#211d1a]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[#f7f3ec]">
                        {v.name}
                      </h4>
                      {v.isRecommended && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#193328] text-[#75d9ae]">
                          Rekomendowane na Outro
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#b8aea4] leading-relaxed">
                      {v.desc}
                    </p>
                    <span className="text-[10px] font-mono text-[#8e8379] block">
                      Czas trwania: {v.durationSec} s · Format: QuickTime ProRes Alfa
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full border grid place-items-center text-[10px] ${
                        isSelected
                          ? "border-[#c84b31] bg-[#c84b31] text-white"
                          : "border-[#5c4d42] text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Preview & Simulation (5 columns) */}
          <div className="md:col-span-5 p-4 rounded-xl border border-[#38302b] bg-[#211d1a] space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c84b31] block mb-2">
                Podgląd animacji logo
              </span>

              {/* Animated Canvas / Box Preview */}
              <div
                className={`w-full aspect-[9/16] max-h-[220px] rounded-xl border border-[#38302b] grid place-items-center relative overflow-hidden transition-colors ${
                  colorScheme === "white" ? "bg-[#12100e]" : "bg-[#f2ece1]"
                }`}
              >
                {/* Simulated Fashion background video backdrop */}
                <div className="absolute inset-0 opacity-20 bg-gradient-to-t from-black via-transparent to-black" />

                {/* Animated Logo representation */}
                <div className="relative z-10 text-center animate-pulse">
                  <div
                    className={`font-serif tracking-widest text-3xl font-black ${
                      colorScheme === "white" ? "text-white" : "text-[#1c1816]"
                    }`}
                  >
                    sinsay
                  </div>
                  <span
                    className={`text-[9px] font-mono tracking-widest uppercase block mt-1 ${
                      colorScheme === "white" ? "text-white/70" : "text-black/70"
                    }`}
                  >
                    {currentVariant.name}
                  </span>
                </div>

                <div className="absolute bottom-2 inset-x-2 flex justify-between text-[9px] text-[#8e8379] font-mono px-2">
                  <span>Outro: ostatnie {currentVariant.durationSec}s</span>
                  <span>Alfa: 100%</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-[#b8aea4] space-y-1">
                <p>
                  <strong>Plik:</strong>{" "}
                  <code className="text-[10px] font-mono text-[#f7f3ec]">
                    {currentFilePath.split("/").pop()}
                  </code>
                </p>
                <p>
                  <strong>Pozycja:</strong> Wyśrodkowane na końcu wideo (Outro).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#c84b31] hover:bg-[#e56b4e] text-white shadow-md transition-colors"
            >
              Zastosuj ten wariant logo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#38302b] pt-3 text-xs text-[#8e8379]">
          <span>
            Wszystkie 12 plików .mov zostały skopiowane do repozytorium projektu (
            <code>/brand/logo_anim/</code>).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#b8aea4] hover:text-[#f7f3ec] underline"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
