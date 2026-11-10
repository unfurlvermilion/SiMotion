"use client";

import React from "react";

interface SocialSafeAreaOverlayProps {
  format: "tiktok-9x16" | "square-1x1" | "feed-4x5" | "master-3x4";
  compact?: boolean;
}

export const SocialSafeAreaOverlay: React.FC<SocialSafeAreaOverlayProps> = ({
  format,
  compact = true,
}) => {
  if (format === "tiktok-9x16") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden font-sans select-none">
        {/* Top Danger Zone (130px / ~6.8%) */}
        <div className="w-full h-[6.8%] bg-rose-500/20 border-b border-rose-400/40 flex items-center justify-between px-1.5 text-[6.5px] text-rose-200">
          <span className="font-semibold tracking-tight opacity-90">Góra (130px)</span>
          <span className="opacity-60 text-[5.5px]">Nawigacja</span>
        </div>

        {/* Middle Section: Left padding + Central Safe Zone + Right Interaction Icons */}
        <div className="w-full flex-1 flex justify-between relative overflow-hidden">
          {/* Left margin (~3.7%) */}
          <div className="w-[3.7%] h-full bg-rose-500/10 border-r border-rose-400/30" />

          {/* Central Safe Zone Box (900x1306px) */}
          <div className="flex-1 h-full mx-1 my-0.5 rounded-lg border border-dashed border-emerald-400/80 bg-emerald-400/5 relative flex flex-col justify-between p-1 shadow-[inset_0_0_8px_rgba(52,211,153,0.12)]">
            <div className="flex justify-between items-center">
              <span className="px-1 py-0.2 rounded bg-black/60 text-emerald-300 font-bold text-[6px] border border-emerald-400/30">
                Safe Zone
              </span>
              <span className="text-[5.5px] text-emerald-300/70 font-mono">900×1306</span>
            </div>
            
            {/* Center target indicator */}
            <div className="self-center w-2 h-2 rounded-full border border-emerald-400/30 opacity-40" />

            <div className="text-[5.5px] text-emerald-300/50 text-right">
              Centrum
            </div>
          </div>

          {/* Right Danger Column (~13.0%) - Minimalist Action Icons */}
          <div className="w-[12.5%] h-full bg-rose-500/20 border-l border-rose-400/40 flex flex-col items-center justify-center gap-1.5 py-1 text-rose-200">
            <div className="w-3 h-3 rounded-full bg-white/20 border border-white/40" />
            <span className="text-[7px] leading-none opacity-80">♥</span>
            <span className="text-[7px] leading-none opacity-80">💬</span>
            <span className="text-[7px] leading-none opacity-80">🔖</span>
            <span className="text-[7px] leading-none opacity-80">↗</span>
          </div>
        </div>

        {/* Bottom Danger Zone (484px / ~25.2%) */}
        <div className="w-full h-[25.2%] bg-rose-500/25 border-t border-rose-400/50 p-1 flex flex-col justify-between text-rose-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[6px] text-rose-200">
              Dół UI (484px)
            </span>
            <span className="text-[5px] px-1 rounded bg-rose-950/70 text-rose-300 font-medium">
              Zasłonięte
            </span>
          </div>

          <div className="space-y-0.5 text-left opacity-70">
            <div className="h-1 w-12 bg-white/40 rounded" />
            <div className="h-0.8 w-16 bg-white/25 rounded" />
          </div>

          <div className="flex items-center justify-between pt-0.5 border-t border-rose-400/20 text-[5.5px]">
            <span className="text-rose-200/70 truncate">♫ Audio / Dźwięk</span>
            <span className="px-1 rounded bg-white/90 text-black font-bold text-[5px]">
              CTA
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (format === "square-1x1") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 p-2 flex flex-col justify-between overflow-hidden font-sans select-none">
        {/* Outer danger frame tint */}
        <div className="absolute inset-0 bg-rose-500/10" />
        
        {/* Inner safe zone */}
        <div className="relative z-10 w-full h-full rounded-lg border border-dashed border-emerald-400/80 bg-emerald-400/5 flex flex-col justify-between p-1.5 shadow-[inset_0_0_8px_rgba(52,211,153,0.12)]">
          <div className="flex justify-between items-center">
            <span className="px-1 py-0.2 rounded bg-black/60 text-emerald-300 font-bold text-[6px] border border-emerald-400/30">
              Safe Zone 1:1
            </span>
            <span className="text-[5.5px] text-emerald-300/70 font-mono">864×864</span>
          </div>
          <div className="self-center w-2 h-2 rounded-full border border-emerald-400/30 opacity-40" />
          <div className="text-[5.5px] text-emerald-300/50 text-right">
            Siatka profilu
          </div>
        </div>
      </div>
    );
  }

  if (format === "feed-4x5") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden font-sans select-none">
        {/* Top Header Margin */}
        <div className="w-full h-[7%] bg-rose-500/20 border-b border-rose-400/40 flex items-center justify-between px-1.5 text-rose-200 text-[6px]">
          <span className="opacity-80">Nagłówek profilu</span>
          <span className="opacity-50">•••</span>
        </div>

        {/* Central Safe Zone */}
        <div className="w-full flex-1 mx-auto my-0.5 px-1.5">
          <div className="w-full h-full rounded-lg border border-dashed border-emerald-400/80 bg-emerald-400/5 flex flex-col justify-between p-1 shadow-[inset_0_0_8px_rgba(52,211,153,0.12)]">
            <div className="flex justify-between items-center">
              <span className="px-1 py-0.2 rounded bg-black/60 text-emerald-300 font-bold text-[6px] border border-emerald-400/30">
                Safe Zone 4:5
              </span>
              <span className="text-[5.5px] text-emerald-300/70 font-mono">Feed IG</span>
            </div>
            <div className="self-center w-2 h-2 rounded-full border border-emerald-400/30 opacity-40" />
            <div className="text-[5.5px] text-emerald-300/50 text-right">
              Ekspozycja
            </div>
          </div>
        </div>

        {/* Bottom Actions Margin */}
        <div className="w-full h-[10%] bg-rose-500/20 border-t border-rose-400/40 px-1.5 flex items-center justify-between text-rose-200 text-[6px]">
          <span className="opacity-80">♥ 💬 ↗</span>
          <span className="opacity-80">🔖</span>
        </div>
      </div>
    );
  }

  // format === "master-3x4"
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden font-sans select-none">
      <div className="absolute inset-0 flex justify-between">
        {/* Left Side Crop (~12.5% cut for 9:16) */}
        <div className="w-[12.5%] h-full bg-amber-500/15 border-r border-dashed border-amber-400/60 flex items-center justify-center">
          <span className="-rotate-90 text-[5.5px] font-bold text-amber-300 tracking-widest opacity-80 whitespace-nowrap">
            9:16 CROP
          </span>
        </div>

        {/* Central Master Area */}
        <div className="flex-1 h-full flex flex-col justify-between p-1 relative">
          <div className="flex justify-between items-center">
            <span className="px-1 py-0.2 rounded bg-black/60 text-emerald-300 font-bold text-[6px] border border-emerald-400/30">
              Baza 3:4
            </span>
            <span className="text-amber-200/70 text-[5.5px]">
              Sylwetka
            </span>
          </div>

          {/* Indication of TikTok bottom danger zone when cropped to 9:16 */}
          <div className="w-full h-[20%] rounded border border-dashed border-rose-400/50 bg-rose-500/10 flex items-center justify-center text-rose-200 text-[5.5px]">
            Pole UI TikToka (484px)
          </div>
        </div>

        {/* Right Side Crop (~12.5% cut for 9:16) */}
        <div className="w-[12.5%] h-full bg-amber-500/15 border-l border-dashed border-amber-400/60 flex items-center justify-center">
          <span className="rotate-90 text-[5.5px] font-bold text-amber-300 tracking-widest opacity-80 whitespace-nowrap">
            9:16 CROP
          </span>
        </div>
      </div>
    </div>
  );
};
