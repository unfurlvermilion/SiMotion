"use client";

import React from "react";

interface SocialSafeAreaOverlayProps {
  format: "tiktok-9x16" | "square-1x1" | "feed-4x5" | "master-3x4";
  compact?: boolean;
}

export const SocialSafeAreaOverlay: React.FC<SocialSafeAreaOverlayProps> = ({
  format,
}) => {
  if (format === "tiktok-9x16") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden select-none font-sans">
        {/* Top Danger Zone (130px / ~6.8%) */}
        <div className="w-full h-[6.8%] bg-rose-500/15 border-b border-rose-400/30 flex items-center justify-between px-1.5 text-[5.5px] text-rose-300">
          <span className="opacity-70">Nawigacja (130px)</span>
        </div>

        {/* Middle Section: Left padding + Central Safe Zone + Right Interaction Icons */}
        <div className="w-full flex-1 flex justify-between relative overflow-hidden">
          {/* Left margin (~3.7%) */}
          <div className="w-[3.7%] h-full bg-rose-500/10 border-r border-rose-400/20" />

          {/* Central Safe Zone Box (900x1306px) */}
          <div className="flex-1 h-full mx-1 my-0.5 rounded-lg border border-dashed border-emerald-400/70 bg-emerald-400/5 relative pointer-events-none" />

          {/* Right Danger Column (~12.5%) - Minimalist Action Icons */}
          <div className="w-[12.5%] h-full bg-rose-500/15 border-l border-rose-400/30 flex flex-col items-center justify-center gap-1.5 py-1 text-rose-200 opacity-60">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/40" />
            <span className="text-[6px] leading-none">♥</span>
            <span className="text-[6px] leading-none">💬</span>
            <span className="text-[6px] leading-none">🔖</span>
            <span className="text-[6px] leading-none">↗</span>
          </div>
        </div>

        {/* Bottom Danger Zone (484px / ~25.2%) - Shaded UI boundary */}
        <div className="w-full h-[25.2%] bg-rose-500/20 border-t border-rose-400/40 p-1 flex flex-col justify-end text-rose-200">
          <div className="space-y-0.5 opacity-40">
            <div className="h-1 w-10 bg-white/50 rounded" />
            <div className="h-0.5 w-14 bg-white/30 rounded" />
          </div>
          <div className="flex items-center justify-between pt-0.5 text-[5px] opacity-60">
            <span>♫ Dźwięk</span>
            <span className="px-1 rounded bg-white/60 text-black font-bold">CTA</span>
          </div>
        </div>
      </div>
    );
  }

  if (format === "square-1x1") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 p-2 flex flex-col justify-between overflow-hidden select-none">
        {/* Outer danger frame tint (10% margins) */}
        <div className="absolute inset-0 bg-rose-500/10" />
        
        {/* Inner safe zone */}
        <div className="relative z-10 w-full h-full rounded-lg border border-dashed border-emerald-400/70 bg-emerald-400/5" />
      </div>
    );
  }

  if (format === "feed-4x5") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden select-none">
        {/* Top Header Margin */}
        <div className="w-full h-[7%] bg-rose-500/15 border-b border-rose-400/30 px-1.5 flex items-center text-rose-300 text-[5.5px] opacity-60">
          <span>Profil</span>
        </div>

        {/* Central Safe Zone */}
        <div className="w-full flex-1 mx-auto my-0.5 px-1.5">
          <div className="w-full h-full rounded-lg border border-dashed border-emerald-400/70 bg-emerald-400/5" />
        </div>

        {/* Bottom Actions Margin */}
        <div className="w-full h-[9%] bg-rose-500/15 border-t border-rose-400/30 px-1.5 flex items-center justify-between text-rose-200 text-[6px] opacity-60">
          <span>♥ 💬 ↗</span>
          <span>🔖</span>
        </div>
      </div>
    );
  }

  // format === "master-3x4"
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden select-none">
      <div className="absolute inset-0 flex justify-between">
        {/* Left Side Crop (~12.5% cut for 9:16) */}
        <div className="w-[12.5%] h-full bg-amber-500/15 border-r border-dashed border-amber-400/50 flex items-center justify-center">
          <span className="-rotate-90 text-[5px] font-bold text-amber-300 tracking-wider opacity-70 whitespace-nowrap">
            9:16 CROP
          </span>
        </div>

        {/* Central Master Area */}
        <div className="flex-1 h-full relative">
          {/* Subtle line indicating TikTok bottom UI threshold when cropped */}
          <div className="absolute inset-x-0 bottom-0 h-[22%] border-t border-dashed border-rose-400/40 bg-rose-500/10 flex items-center justify-center">
            <span className="text-[5px] text-rose-300 opacity-60">UI TikToka w 9:16</span>
          </div>
        </div>

        {/* Right Side Crop (~12.5% cut for 9:16) */}
        <div className="w-[12.5%] h-full bg-amber-500/15 border-l border-dashed border-amber-400/50 flex items-center justify-center">
          <span className="rotate-90 text-[5px] font-bold text-amber-300 tracking-wider opacity-70 whitespace-nowrap">
            9:16 CROP
          </span>
        </div>
      </div>
    </div>
  );
};
