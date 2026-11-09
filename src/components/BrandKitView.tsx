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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAsset, setEditingAsset] = useState<BrandAsset | null>(null);

  const handleDeleteAsset = (id: string, name: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    if (selectedVideoAssetId === id) setSelectedVideoAssetId(null);
    if (selectedStaticAssetId === id) setSelectedStaticAssetId(null);
    showToast(`Usunięto materiał: "${name}"`);
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    setAssets((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
    if (selectedVideoAssetId && selectedIds.includes(selectedVideoAssetId)) {
      setSelectedVideoAssetId(null);
    }
    if (selectedStaticAssetId && selectedIds.includes(selectedStaticAssetId)) {
      setSelectedStaticAssetId(null);
    }
    setSelectedIds([]);
    showToast(`Usunięto ${count} zaznaczonych materiałów.`);
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (visibleItems: BrandAsset[]) => {
    if (selectedIds.length === visibleItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleItems.map((a) => a.id));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setAssets((prev) =>
      prev.map((a) => (a.id === editingAsset.id ? editingAsset : a))
    );
    showToast(`Zaktualizowano materiał: "${editingAsset.name}"`);
    setEditingAsset(null);
  };

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
    const matchesFilter = filter === "all" ? true : a.kind === "both" || a.kind === filter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      a.name.toLowerCase().includes(query) ||
      (a.text && a.text.toLowerCase().includes(query)) ||
      a.type.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Materiały marki
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Nakładki, badge kolekcji i logotypy PNG/SVG pod wideo i grafiki.
          </p>
        </div>

        <label className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 cursor-pointer">
          <span>＋ Wgraj PNG / SVG</span>
          <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Creation form & active assignments */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                Biblioteka elementów ({filteredAssets.length})
              </h2>
              {assets.length !== filteredAssets.length && (
                <span className="text-[10px] text-[var(--ink-muted)]">
                  (z {assets.length})
                </span>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                ["all", "Wszystkie"],
                ["video", "Do Wideo"],
                ["static", "Do Grafik"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    filter === key
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] shadow-xs"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="🔍 Szukaj materiału lub tekstu badge'a..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 rounded-lg text-xs border bg-white dark:bg-[#211d1a] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)] shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => toggleSelectAll(filteredAssets)}
                className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-[#211d1a] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium text-[11px] transition-colors"
              >
                {selectedIds.length === filteredAssets.length && filteredAssets.length > 0
                  ? "Odznacz wszystkie"
                  : `Zaznacz widoczne (${filteredAssets.length})`}
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-colors"
                >
                  <span>🗑 Usuń zaznaczone ({selectedIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid of assets */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-xs text-[var(--ink-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
              Brak elementów spełniających kryteria wyszukiwania.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredAssets.map((asset) => {
                const isVideoSelected = selectedVideoAssetId === asset.id;
                const isStaticSelected = selectedStaticAssetId === asset.id;
                const isChecked = selectedIds.includes(asset.id);

                return (
                  <div
                    key={asset.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all relative group ${
                      isVideoSelected || isStaticSelected
                        ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-md"
                        : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {/* Card Top: Checkbox + Tag + Quick Edit/Delete */}
                    <div className="flex items-center justify-between gap-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="w-3.5 h-3.5 accent-[#c84b31] rounded cursor-pointer"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
                          {asset.type}
                        </span>
                      </label>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditingAsset({ ...asset })}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] text-xs transition-colors"
                          title="Edytuj materiał"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.id, asset.name)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20 text-red-500 hover:text-red-700 text-xs transition-colors font-bold"
                          title="Usuń materiał z biblioteki"
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Preview box */}
                    <div className="h-24 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] grid place-items-center p-2 overflow-hidden text-center">
                      {asset.type === "image" && asset.url ? (
                        <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-sm font-black text-[var(--burgundy)] transform -rotate-6 font-sinsay">
                          {asset.text || asset.name}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div>
                      <b className="text-xs block text-[var(--ink-primary)] truncate font-semibold" title={asset.name}>
                        {asset.name}
                      </b>
                      <small className="text-[10px] text-[var(--ink-muted)] block">
                        {asset.kind === "both" ? "Wideo & Grafika" : asset.kind === "video" ? "Tylko wideo" : "Tylko grafika"}
                      </small>
                    </div>

                    {/* Attachment buttons */}
                    <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVideoAssetId(isVideoSelected ? null : asset.id);
                          showToast(isVideoSelected ? `Odpięto od wideo: ${asset.name}` : `Przypięto do wideo: ${asset.name}`);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                          isVideoSelected
                            ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                            : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {isVideoSelected ? "✓ Wideo" : "+ Wideo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaticAssetId(isStaticSelected ? null : asset.id);
                          showToast(isStaticSelected ? `Odpięto od grafiki: ${asset.name}` : `Przypięto do grafiki: ${asset.name}`);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                          isStaticSelected
                            ? "bg-[var(--burgundy)] text-white border-[var(--burgundy)] shadow-xs"
                            : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--burgundy)]"
                        }`}
                      >
                        {isStaticSelected ? "✓ Grafika" : "+ Grafika"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Sinsay Brand Typography Section */}
      <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c84b31] to-[#6e1d2f] text-white font-serif font-bold text-lg grid place-items-center shadow-md">
              Aa
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[var(--ink-primary)]">
                  Oficjalna Typografia Marki: Euclid Circular B
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#193328] text-[#75d9ae]">
                  Brand Kit LPP SA
                </span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)]">
                Wdrożono 10 odmian fontu (Light, Regular, Medium, Semibold, Bold + kursywy) do napisów wideo, belek i plansz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-muted)]">
            <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              format: OTF / TTF
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae] font-bold">
              ✓ Zainstalowany
            </span>
          </div>
        </div>

        {/* Specimen Weights Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sinsay">
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[var(--ink-muted)] font-mono">
              <span>Euclid Circular B Light</span>
              <span>Weight 300</span>
            </div>
            <p className="text-xl font-light text-[var(--ink-primary)] leading-snug">
              Nowa kolekcja jedwabna na Twój sposób
            </p>
            <span className="text-[10px] text-[var(--ink-secondary)] block">
              Do subtelnych opisów, podpisów produktów i parametrów
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[var(--ink-muted)] font-mono">
              <span>Euclid Circular B Regular</span>
              <span>Weight 400</span>
            </div>
            <p className="text-xl font-normal text-[var(--ink-primary)] leading-snug">
              Zatwierdzone hasła marketingowe Sinsay
            </p>
            <span className="text-[10px] text-[var(--ink-secondary)] block">
              Domyślny krój dla dłuższych fraz i dialogów lektora
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[var(--ink-muted)] font-mono">
              <span>Euclid Circular B Medium</span>
              <span>Weight 500</span>
            </div>
            <p className="text-xl font-medium text-[var(--ink-primary)] leading-snug">
              Styl na każdą okazję · Jesień 2026
            </p>
            <span className="text-[10px] text-[var(--ink-secondary)] block">
              Optymalny balans czytelności na urządzeniach mobilnych
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[var(--ink-muted)] font-mono">
              <span>Euclid Circular B Semibold</span>
              <span>Weight 600</span>
            </div>
            <p className="text-xl font-semibold text-[var(--ink-primary)] leading-snug">
              Wyjątkowe ceny i najnowsze trendy
            </p>
            <span className="text-[10px] text-[var(--ink-secondary)] block">
              Dedykowany do belek cenowych i wyróżników promocji
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[#c84b31]/40 dark:border-[#e56b4e]/40 bg-[var(--accent-soft)] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[#c84b31] dark:text-[#e56b4e] font-mono font-bold">
              <span>Euclid Circular B Bold (Główny)</span>
              <span>Weight 700 ★</span>
            </div>
            <p className="text-xl font-bold text-[var(--ink-primary)] leading-snug">
              SINSAY · Dynamiczne Napisy Karaoke
            </p>
            <span className="text-[10px] text-[var(--ink-secondary)] block">
              Główny font stosowany w animacjach wideo, Stories i TikTok
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[var(--ink-muted)] font-mono">
              <span>Euclid Circular B Bold Italic</span>
              <span>Weight 700 Italic</span>
            </div>
            <p className="text-xl font-bold italic text-[var(--ink-primary)] leading-snug">
              Limited Edition · Tylko Online
            </p>
            <span className="text-[10px] text-[var(--ink-secondary)] block">
              Do dynamicznych akcentów i haseł o wysokiej energii
            </span>
          </div>
        </div>
      </div>
      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-serif text-base font-bold text-[var(--ink-primary)]">
                Edycja materiału marki
              </h3>
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Nazwa elementu
                </label>
                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Tekst na plakietce / CTA
                </label>
                <input
                  type="text"
                  value={editingAsset.text || ""}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, text: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-sinsay focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                  Przeznaczenie
                </label>
                <select
                  value={editingAsset.kind}
                  onChange={(e) =>
                    setEditingAsset({
                      ...editingAsset,
                      kind: e.target.value as "both" | "video" | "static",
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="both">Wideo oraz Grafiki</option>
                  <option value="video">Tylko Wideo</option>
                  <option value="static">Tylko Grafiki</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteAsset(editingAsset.id, editingAsset.name);
                    setEditingAsset(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                >
                  <span>🗑 Usuń ten materiał</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--accent)] hover:opacity-90 shadow-sm"
                  >
                    Zapisz zmiany
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
