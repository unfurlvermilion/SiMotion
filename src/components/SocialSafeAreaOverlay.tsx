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
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden text-[7px] font-sans">
        {/* Top Danger Zone (130px / ~6.8%) - Navigation, Search */}
        <div className="w-full h-[6.8%] bg-rose-500/25 border-b border-rose-400/60 flex items-center justify-between px-2 text-rose-200">
          <span className="font-bold tracking-tight">Góra: 130 px (Nawigacja)</span>
          <span className="opacity-75">Dla Ciebie</span>
        </div>

        {/* Middle Section: Left padding + Central Safe Zone + Right Interaction Icons */}
        <div className="w-full flex-1 flex justify-between relative">
          {/* Left margin (~3.7% / 40px) */}
          <div className="w-[3.7%] h-full bg-rose-500/20 border-r border-rose-400/40" />

          {/* Central Safe Zone Box (900x1306px) */}
          <div className="flex-1 h-full mx-1 rounded-xl border-2 border-dashed border-emerald-400/90 bg-emerald-400/5 relative flex flex-col justify-between p-1.5 shadow-[inset_0_0_12px_rgba(52,211,153,0.15)]">
            <div className="flex justify-between items-center">
              <span className="px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-extrabold text-[6.5px] border border-emerald-400/40 tracking-wider">
                ✓ SAFE ZONE (POLE OCHRONNE)
              </span>
              <span className="text-[6px] text-emerald-300/80 font-mono">900×1306 px</span>
            </div>
            
            <div className="text-center opacity-60 text-emerald-200 text-[6px]">
              Twarz · Produkt · Napisy
            </div>

            <div className="text-[6px] text-emerald-300/60 text-right">
              Centrum kadru
            </div>
          </div>

          {/* Right Danger Column (~13.0% / 140px) - Action Icons */}
          <div className="w-[13.0%] h-full bg-rose-500/25 border-l border-rose-400/60 flex flex-col items-center justify-center gap-1.5 py-1 text-rose-200">
            {/* Avatar */}
            <div className="w-3.5 h-3.5 rounded-full bg-white/30 border border-white/60 relative">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 text-white text-[5px] absolute -bottom-0.5 left-1 flex items-center justify-center leading-none">
                +
              </div>
            </div>
            {/* Heart */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] leading-none">♥</span>
              <span className="text-[5px] opacity-80 scale-90">14k</span>
            </div>
            {/* Comment */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] leading-none">💬</span>
              <span className="text-[5px] opacity-80 scale-90">320</span>
            </div>
            {/* Bookmark */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] leading-none">🔖</span>
              <span className="text-[5px] opacity-80 scale-90">1.8k</span>
            </div>
            {/* Share */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] leading-none">↗</span>
              <span className="text-[5px] opacity-80 scale-90">Share</span>
            </div>
            {/* Rotating Disc */}
            <div className="w-3 h-3 rounded-full border border-rose-300/70 bg-black/40 animate-spin" />
          </div>
        </div>

        {/* Bottom Danger Zone (484px / ~25.2%) - Caption, CTA, Sound */}
        <div className="w-full h-[25.2%] bg-rose-500/30 border-t border-rose-400/70 p-1.5 flex flex-col justify-between text-rose-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[6.5px] text-rose-200">
              Dół: 484 px (Podpis, CTA i dźwięk)
            </span>
            <span className="text-[6px] px-1 py-0.2 rounded bg-rose-900/60 text-rose-300">
              ZAKRYTE PRZEZ UI
            </span>
          </div>

          <div className="space-y-0.5 text-left pl-0.5">
            <p className="font-bold text-[6.5px] text-white">@sinsay · Oficjalny profil</p>
            <p className="text-[6px] text-white/80 line-clamp-1">
              Nowa kolekcja Atelier 2026. Odkryj trendy...
            </p>
          </div>

          <div className="flex items-center justify-between pt-0.5 border-t border-rose-400/30">
            <span className="text-[6px] text-rose-200 truncate max-w-[70%]">♫ Sinsay Fashion Beat</span>
            <span className="px-1 py-0.2 rounded bg-white text-black font-extrabold text-[5.5px]">
              Kup teraz
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (format === "square-1x1") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 p-2.5 flex flex-col justify-between overflow-hidden text-[7px] font-sans">
        {/* Outer danger border frame (10% on each side) */}
        <div className="absolute inset-0 bg-rose-500/20" />
        
        {/* Inner safe zone */}
        <div className="relative z-10 w-full h-full rounded-2xl border-2 border-dashed border-emerald-400/90 bg-emerald-400/5 flex flex-col justify-between p-2 shadow-[inset_0_0_12px_rgba(52,211,153,0.15)]">
          <div className="flex justify-between items-center">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-extrabold text-[7px] border border-emerald-400/40">
              ✓ SAFE ZONE 1:1
            </span>
            <span className="text-[6.5px] text-emerald-300/80 font-mono">864×864 px</span>
          </div>
          <div className="text-center text-emerald-200 text-[6.5px] opacity-75">
            Margines ochronny siatki profilu i karuzeli (108 px z każdej strony)
          </div>
          <div className="text-[6.5px] text-emerald-300/70 text-right">
            Główne treści wewnątrz pola
          </div>
        </div>
      </div>
    );
  }

  if (format === "feed-4x5") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden text-[7px] font-sans">
        {/* Top Header Margin (Meta Feed) */}
        <div className="w-full h-[8%] bg-rose-500/25 border-b border-rose-400/50 flex items-center justify-between px-2 text-rose-200 text-[6.5px]">
          <span>Nagłówek profilu IG</span>
          <span>•••</span>
        </div>

        {/* Central Safe Zone */}
        <div className="w-full flex-1 mx-auto my-1 px-2">
          <div className="w-full h-full rounded-xl border-2 border-dashed border-emerald-400/90 bg-emerald-400/5 flex flex-col justify-between p-1.5 shadow-[inset_0_0_12px_rgba(52,211,153,0.15)]">
            <div className="flex justify-between items-center">
              <span className="px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-extrabold text-[6.5px] border border-emerald-400/40">
                ✓ SAFE ZONE 4:5
              </span>
              <span className="text-[6px] text-emerald-300/80 font-mono">Meta Feed</span>
            </div>
            <div className="text-center text-emerald-200 text-[6px] opacity-70">
              Naturalny format Instagram Feed
            </div>
            <div className="text-[6px] text-emerald-300/60 text-right">
              Pełna ekspozycja
            </div>
          </div>
        </div>

        {/* Bottom Actions Margin (Likes, caption bar) */}
        <div className="w-full h-[12%] bg-rose-500/25 border-t border-rose-400/50 px-2 flex items-center justify-between text-rose-200 text-[6px]">
          <span>♥ 💬 ↗ Pasek akcji</span>
          <span>Zapisz 🔖</span>
        </div>
      </div>
    );
  }

  // format === "master-3x4"
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden text-[7px] font-sans">
      {/* Visual guide showing how 9:16 cuts off sides, and how 1:1 / TikTok bottom cuts off bottom */}
      <div className="absolute inset-0 flex justify-between">
        {/* Left Side Crop (~12.5% cut for 9:16) */}
        <div className="w-[12.5%] h-full bg-amber-500/20 border-r border-dashed border-amber-400/70 flex items-center justify-center">
          <span className="-rotate-90 text-[6px] font-bold text-amber-200 tracking-wider whitespace-nowrap">
            CROP 9:16
          </span>
        </div>

        {/* Central Master Area */}
        <div className="flex-1 h-full flex flex-col justify-between p-1 relative">
          <div className="flex justify-between items-center bg-black/60 px-1 py-0.5 rounded">
            <span className="text-emerald-300 font-bold text-[6.5px]">
              ✓ MODA MASTER (3:4)
            </span>
            <span className="text-amber-200 text-[6px]">
              Bezpieczna sylwetka
            </span>
          </div>

          {/* Indication of TikTok bottom danger zone when cropped to 9:16 */}
          <div className="w-full h-[22%] rounded border border-dashed border-rose-400/70 bg-rose-500/15 flex items-center justify-center text-rose-200 text-[6px]">
            Dolne pole interfejsu TikTok (484px w 9:16)
          </div>
        </div>

        {/* Right Side Crop (~12.5% cut for 9:16) */}
        <div className="w-[12.5%] h-full bg-amber-500/20 border-l border-dashed border-amber-400/70 flex items-center justify-center">
          <span className="rotate-90 text-[6px] font-bold text-amber-200 tracking-wider whitespace-nowrap">
            CROP 9:16
          </span>
        </div>
      </div>
    </div>
  );
};
