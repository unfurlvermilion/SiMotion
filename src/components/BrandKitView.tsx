"use client";

import React, { useState, useRef } from "react";
import { BrandAsset } from "@/app/page";

interface BrandKitViewProps {
  assets: BrandAsset[];
  setAssets: React.Dispatch<React.SetStateAction<BrandAsset[]>>;
  selectedVideoAssetId: string | null;
  setSelectedVideoAssetId: (id: string | null) => void;
  selectedStaticAssetId: string | null;
  setSelectedStaticAssetId: (id: string | null) => void;
  showToast: (msg: string) => void;
}

export const BrandKitView: React.FC<BrandKitViewProps> = ({
  assets,
  setAssets,
  selectedVideoAssetId,
  setSelectedVideoAssetId,
  selectedStaticAssetId,
  setSelectedStaticAssetId,
  showToast,
}) => {
  const [filter, setFilter] = useState<"all" | "video" | "static">("all");
  const [newAssetText, setNewAssetText] = useState("");
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetKind, setNewAssetKind] = useState<"both" | "video" | "static">("both");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newUploaded: BrandAsset[] = files.map((f, i) => ({
      id: `custom-${Date.now()}-${i}`,
      name: f.name.replace(/\.[^/.]+$/, ""),
      kind: "both",
      type: "image",
      url: URL.createObjectURL(f),
    }));

    setAssets((prev) => [...prev, ...newUploaded]);
    showToast(`Dodano ${files.length} plików do Brand Kitu.`);
  };

  const handleAddCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    const newBadge: BrandAsset = {
      id: `badge-${Date.now()}`,
      name: newAssetName.trim(),
      kind: newAssetKind,
      type: "badge",
      text: newAssetText.trim() || newAssetName.trim().toUpperCase(),
    };

    setAssets((prev) => [...prev, newBadge]);
    setNewAssetName("");
    setNewAssetText("");
    showToast(`Utworzono badge: ${newBadge.name}`);
  };

  const filteredAssets = assets.filter((a) => {
    if (filter === "all") return true;
    return a.kind === "both" || a.kind === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-[var(--accent)]">
            03 / BRAND KIT &amp; ZASOBY MARKI
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--ink-primary)]">
            Współdzielona biblioteka zasobów.
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Zarządzaj nakładkami, badge'ami kolekcji, logotypami i grafikami PNG/SVG dla kreacji wideo i formatów statycznych.
          </p>
        </div>

        <label className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 cursor-pointer">
          <span>＋ Wgraj pliki PNG / SVG</span>
          <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Creation form & active assignments */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Biblioteka elementów ({filteredAssets.length})
            </h2>

            {/* Filter chips */}
            <div className="flex gap-1.5">
              {[
                ["all", "Wszystkie"],
                ["video", "Do Wideo"],
                ["static", "Do Grafik"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    filter === key
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of assets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredAssets.map((asset) => {
              const isVideoSelected = selectedVideoAssetId === asset.id;
              const isStaticSelected = selectedStaticAssetId === asset.id;

              return (
                <div
                  key={asset.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isVideoSelected || isStaticSelected
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-md"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="h-24 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] grid place-items-center p-2 overflow-hidden text-center">
                    {asset.type === "image" && asset.url ? (
                      <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-sm font-black text-[var(--burgundy)] transform -rotate-6">
                        {asset.text || asset.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <b className="text-xs block text-[var(--ink-primary)] truncate">{asset.name}</b>
                    <small className="text-[10px] text-[var(--ink-muted)] block">
                      {asset.kind === "both" ? "Wideo & Grafika" : asset.kind === "video" ? "Tylko wideo" : "Tylko grafika"}
                    </small>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => {
                        setSelectedVideoAssetId(isVideoSelected ? null : asset.id);
                        showToast(`Przypięto do wideo: ${asset.name}`);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        isVideoSelected
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-primary)]"
                      }`}
                    >
                      {isVideoSelected ? "✓ Wideo" : "Do Wideo"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStaticAssetId(isStaticSelected ? null : asset.id);
                        showToast(`Przypięto do grafiki: ${asset.name}`);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        isStaticSelected
                          ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)]"
                          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-primary)]"
                      }`}
                    >
                      {isStaticSelected ? "✓ Grafika" : "Do Grafiki"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create quick badge generator */}
        <div className="md:col-span-4 space-y-4">
          <form
            onSubmit={handleAddCustomBadge}
            className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm"
          >
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Generator badge'a / hasła
            </h2>
            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Nazwa elementu
              </label>
              <input
                type="text"
                placeholder="np. Bestseller Jesień"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Tekst na plakietce
              </label>
              <input
                type="text"
                placeholder="np. BESTSELLER 2026"
                value={newAssetText}
                onChange={(e) => setNewAssetText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                Przeznaczenie
              </label>
              <select
                value={newAssetKind}
                onChange={(e) => setNewAssetKind(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              >
                <option value="both">Wideo oraz Grafiki</option>
                <option value="video">Tylko Wideo</option>
                <option value="static">Tylko Grafiki</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] hover:opacity-95"
            >
              ＋ Stwórz element marki
            </button>
          </form>

          {/* Active selection summary */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-muted)]">
              Aktywnie przypięte w projekcie
            </h3>
            <div className="text-xs">
              <span className="text-[var(--ink-muted)]">Wideo (#post): </span>
              <strong className="text-[var(--ink-primary)]">
                {assets.find((a) => a.id === selectedVideoAssetId)?.name || "Brak"}
              </strong>
            </div>
            <div className="text-xs">
              <span className="text-[var(--ink-muted)]">Grafika (#static): </span>
              <strong className="text-[var(--ink-primary)]">
                {assets.find((a) => a.id === selectedStaticAssetId)?.name || "Brak"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
