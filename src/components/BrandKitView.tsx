"use client";

import React, { useState, useRef, useEffect } from "react";
import { BrandAsset } from "@/app/page";
import { LOGO_VARIANTS } from "./AnimatedLogoModal";
import {
  BUILTIN_BGM_TRACKS,
  StoredAsset,
  StoredLogoConfig,
  saveStoredAsset,
  deleteStoredAsset,
  fileToDataUrl,
  loadCustomMediaAssets,
  loadDefaultLogoConfig,
  saveDefaultLogoConfig,
} from "@/lib/brandStorage";

interface BrandKitViewProps {
  assets: BrandAsset[];
  setAssets: React.Dispatch<React.SetStateAction<BrandAsset[]>>;
  selectedVideoAssetId: string | null;
  setSelectedVideoAssetId: (id: string | null) => void;
  selectedStaticAssetId: string | null;
  setSelectedStaticAssetId: (id: string | null) => void;
  showToast: (msg: string) => void;
  onGoToStatic?: () => void;
}

export const BrandKitView: React.FC<BrandKitViewProps> = ({
  assets,
  setAssets,
  selectedVideoAssetId,
  setSelectedVideoAssetId,
  selectedStaticAssetId,
  setSelectedStaticAssetId,
  showToast,
  onGoToStatic,
}) => {
  const [filter, setFilter] = useState<"all" | "video" | "static">("all");
  const [newAssetText, setNewAssetText] = useState("");
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetKind, setNewAssetKind] = useState<"both" | "video" | "static">("both");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAsset, setEditingAsset] = useState<BrandAsset | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [cardBgMode, setCardBgMode] = useState<"checker" | "dark" | "light">("checker");
  const [logoPreviewColor, setLogoPreviewColor] = useState<"white" | "black">("white");
  const [showTypographyPreview, setShowTypographyPreview] = useState(false);

  // Domyślne Intro / Outro zapisane w localStorage + własne animacje / podkłady audio w IndexedDB
  const [defaultIntroId, setDefaultIntroId] = useState<string | null>(null);
  const [defaultOutroId, setDefaultOutroId] = useState<string | null>(null);
  const [customLogoAnims, setCustomLogoAnims] = useState<StoredAsset[]>([]);
  const [customBgmTracks, setCustomBgmTracks] = useState<StoredAsset[]>([]);
  const [playingBgmId, setPlayingBgmId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const intro = loadDefaultLogoConfig("intro");
    const outro = loadDefaultLogoConfig("outro");
    if (intro) setDefaultIntroId(intro.variantId);
    if (outro) setDefaultOutroId(outro.variantId);
    loadCustomMediaAssets("logo_anim").then(setCustomLogoAnims).catch(() => {});
    loadCustomMediaAssets("audio").then(setCustomBgmTracks).catch(() => {});
  }, []);

  const handleSetDefaultLogo = (slot: "intro" | "outro", config: StoredLogoConfig) => {
    saveDefaultLogoConfig(slot, config);
    if (slot === "intro") {
      setDefaultIntroId(config.variantId);
      showToast(`Ustawiono domyślne Intro: ${config.name}`);
    } else {
      setDefaultOutroId(config.variantId);
      showToast(`Ustawiono domyślne Outro: ${config.name}`);
    }
  };

  const handleUploadCustomLogoAnim = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const dataUrl = await fileToDataUrl(f);
      const item: StoredAsset = {
        id: `logoanim-${Date.now()}-${i}`,
        name: f.name.replace(/\.[^/.]+$/, ""),
        kind: "video",
        type: "logo_anim",
        url: dataUrl,
        durationSec: 2.0,
      };
      await saveStoredAsset(item);
      setCustomLogoAnims((prev) => [...prev, item]);
    }
    showToast(`Dodano własną animację Intro/Outro (${files.length})`);
    e.target.value = "";
  };

  const handleUploadCustomBgm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const dataUrl = await fileToDataUrl(f);
      const item: StoredAsset = {
        id: `bgm-${Date.now()}-${i}`,
        name: f.name.replace(/\.[^/.]+$/, ""),
        kind: "video",
        type: "audio",
        url: dataUrl,
      };
      await saveStoredAsset(item);
      setCustomBgmTracks((prev) => [...prev, item]);
    }
    showToast(`Dodano podkład audio do biblioteki (${files.length})`);
    e.target.value = "";
  };

  const togglePlayBgm = (id: string, src: string) => {
    const audio = audioPlayerRef.current;
    if (!audio) return;
    if (playingBgmId === id && !audio.paused) {
      audio.pause();
      setPlayingBgmId(null);
      return;
    }
    audio.src = src;
    audio.play().then(() => setPlayingBgmId(id)).catch(() => setPlayingBgmId(null));
  };

  const handleDeleteAsset = async (id: string, name: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    if (selectedVideoAssetId === id) setSelectedVideoAssetId(null);
    if (selectedStaticAssetId === id) setSelectedStaticAssetId(null);
    await deleteStoredAsset(id);
    showToast(`Usunięto materiał: "${name}"`);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    for (const id of selectedIds) {
      await deleteStoredAsset(id);
    }
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setAssets((prev) =>
      prev.map((a) => (a.id === editingAsset.id ? editingAsset : a))
    );
    await saveStoredAsset(editingAsset);
    showToast(`Zaktualizowano materiał: "${editingAsset.name}"`);
    setEditingAsset(null);
  };

  const processUploadedFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;

    const newUploaded: BrandAsset[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const f = imageFiles[i];
      try {
        const dataUrl = await fileToDataUrl(f);
        const item: BrandAsset = {
          id: `custom-${Date.now()}-${i}`,
          name: f.name.replace(/\.[^/.]+$/, ""),
          kind: "both",
          type: "image",
          url: dataUrl,
        };
        await saveStoredAsset(item);
        newUploaded.push(item);
      } catch (err) {
        console.error("Błąd zapisu pliku do pamięci trwałej:", err);
      }
    }

    if (newUploaded.length > 0) {
      setAssets((prev) => [...prev, ...newUploaded]);
      showToast(`Zapisano na stałe ${newUploaded.length} plików w Materiałach.`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processUploadedFiles(files);
    e.target.value = "";
  };

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    const files = Array.from(e.dataTransfer.files || []);
    await processUploadedFiles(files);
  };

  const handleAddCustomBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    const newBadge: BrandAsset = {
      id: `badge-${Date.now()}`,
      name: newAssetName.trim(),
      kind: newAssetKind,
      type: "badge",
      text: newAssetText.trim() || newAssetName.trim().toUpperCase(),
    };

    await saveStoredAsset(newBadge);
    setAssets((prev) => [...prev, newBadge]);
    setNewAssetName("");
    setNewAssetText("");
    showToast(`Utworzono i zapisano badge: ${newBadge.name}`);
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

            {/* Filter chips + Card background mode */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  ["all", "Wszystkie"],
                  ["video", "Do Wideo"],
                  ["static", "Do Grafik"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      filter === key
                        ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] shadow-xs"
                        : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] gap-0.5" title="Tło podglądu PNG/SVG">
                {(
                  [
                    ["checker", "Szachownica"],
                    ["dark", "Ciemne"],
                    ["light", "Jasne"],
                  ] as const
                ).map(([bgKey, bgLabel]) => (
                  <button
                    key={bgKey}
                    type="button"
                    onClick={() => setCardBgMode(bgKey)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                      cardBgMode === bgKey
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    {bgLabel}
                  </button>
                ))}
              </div>
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
                className="w-full pl-3 pr-8 py-1.5 rounded-lg text-xs border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)] shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => toggleSelectAll(filteredAssets)}
                className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium text-[11px] transition-colors cursor-pointer"
              >
                {selectedIds.length === filteredAssets.length && filteredAssets.length > 0
                  ? "Odznacz wszystkie"
                  : `Zaznacz widoczne (${filteredAssets.length})`}
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>🗑 Usuń zaznaczone ({selectedIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFiles(true);
            }}
            onDragLeave={() => setIsDraggingFiles(false)}
            onDrop={handleDropFiles}
            className={`px-4 py-3 rounded-xl border border-dashed text-center text-xs transition-all ${
              isDraggingFiles
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--ink-primary)]"
                : "border-[var(--border-strong)] bg-[var(--bg-subtle)]/60 text-[var(--ink-muted)]"
            }`}
          >
            Przeciągnij i upuść pliki <b className="text-[var(--ink-secondary)]">PNG / SVG</b> tutaj, aby zapisać je w bibliotece marki.
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
                          className="w-3.5 h-3.5 accent-[#7c5cff] rounded cursor-pointer"
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
                    <div
                      className={`h-24 rounded-lg border border-[var(--border-subtle)] grid place-items-center p-2 overflow-hidden text-center ${
                        cardBgMode === "dark"
                          ? "bg-[#09080f]"
                          : cardBgMode === "light"
                          ? "bg-[#f4f4f8]"
                          : "bg-[var(--bg-card)]"
                      }`}
                      style={
                        cardBgMode === "checker"
                          ? {
                              backgroundImage:
                                "linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)",
                              backgroundSize: "16px 16px",
                              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                            }
                          : undefined
                      }
                    >
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

                    {/* Attachment button (Grafiki) */}
                    <div className="pt-1.5 border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaticAssetId(isStaticSelected ? null : asset.id);
                          showToast(isStaticSelected ? `Odpięto od grafik: ${asset.name}` : `Przypięto do grafik: ${asset.name}`);
                        }}
                        className={`w-full px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          isStaticSelected
                            ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                            : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {isStaticSelected ? "✓ Przypięte do Grafik" : "+ Przypnij do Grafik"}
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
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-muted)]">
              Aktywnie przypięte w zakładce Grafiki
            </h3>
            <div className="text-xs">
              <span className="text-[var(--ink-muted)]">Wybrana nakładka / badge: </span>
              <strong className="text-[var(--ink-primary)]">
                {assets.find((a) => a.id === selectedStaticAssetId)?.name || "Brak"}
              </strong>
            </div>
            {onGoToStatic && (
              <button
                type="button"
                onClick={onGoToStatic}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--ink-primary)] hover:bg-[var(--accent)] hover:text-white transition-all cursor-pointer"
              >
                Otwórz w Grafikach →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animated Sinsay Intro / Outro Brand Kit Section */}
      <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[#9d85ff] grid place-items-center text-lg">
              🎬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Animowane Logotypy Sinsay (Intro / Outro)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#193328] text-[#75d9ae]">
                  Brand Kit LPP
                </span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Ustaw domyślne Intro / Outro dla Generatora AI i Montażu wideo albo wgraj własną animację (.gif / .mp4 / .mov).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <label className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer">
              <span>＋ Wgraj własne Intro/Outro</span>
              <input
                type="file"
                multiple
                accept="image/gif,video/mp4,video/quicktime,video/webm"
                onChange={handleUploadCustomLogoAnim}
                className="hidden"
              />
            </label>

            <div className="inline-flex p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-strong)] gap-1">
              <button
                type="button"
                onClick={() => setLogoPreviewColor("white")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logoPreviewColor === "white"
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                Białe
              </button>
              <button
                type="button"
                onClick={() => setLogoPreviewColor("black")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  logoPreviewColor === "black"
                    ? "bg-[var(--accent)] text-white shadow-xs"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                Czarne
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {LOGO_VARIANTS.map((variant) => {
            const gifSrc = logoPreviewColor === "white" ? variant.gifWhite : variant.gifBlack;
            const movSrc = logoPreviewColor === "white" ? variant.fileWhite : variant.fileBlack;
            const isDefIntro = defaultIntroId === variant.id;
            const isDefOutro = defaultOutroId === variant.id;
            const colorLabel = logoPreviewColor === "white" ? "Białe" : "Czarne";
            const cfg: StoredLogoConfig = {
              variantId: variant.id,
              colorScheme: logoPreviewColor,
              filePath: movSrc,
              gifPath: gifSrc,
              durationSec: variant.durationSec,
              name: `${variant.name.split(" (")[0]} (${colorLabel})`,
            };
            return (
              <div
                key={variant.id}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[var(--ink-primary)] truncate">
                      {variant.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[#9d85ff] shrink-0">
                      {variant.durationSec}s
                    </span>
                  </div>

                  <div
                    className={`h-24 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center p-3 overflow-hidden ${
                      logoPreviewColor === "white" ? "bg-[#09080f]" : "bg-[#f4f4f8]"
                    }`}
                  >
                    <img
                      src={gifSrc}
                      alt={variant.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <p className="text-[11px] text-[var(--ink-muted)] leading-snug">
                    {variant.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetDefaultLogo("intro", cfg)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        isDefIntro
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      {isDefIntro ? "✓ Domyślne Intro" : "Ustaw jako Intro"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDefaultLogo("outro", cfg)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        isDefOutro
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      {isDefOutro ? "✓ Domyślne Outro" : "Ustaw jako Outro"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={movSrc}
                      download
                      className="flex-1 text-center px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] hover:border-[var(--accent)] transition-colors"
                    >
                      ⬇ Pobierz .MOV
                    </a>
                    <a
                      href={gifSrc}
                      download
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--ink-secondary)] hover:border-[var(--accent)] hover:text-[var(--ink-primary)] transition-colors"
                    >
                      .GIF
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {customLogoAnims.map((anim) => {
            const src = anim.url || anim.dataUrl || "";
            const isVideo = src.startsWith("data:video/") || /\.(mp4|mov|webm)$/i.test(anim.name);
            const isDefIntro = defaultIntroId === anim.id;
            const isDefOutro = defaultOutroId === anim.id;
            const cfg: StoredLogoConfig = {
              variantId: anim.id,
              colorScheme: "white",
              filePath: src,
              gifPath: src,
              durationSec: anim.durationSec || 2.0,
              name: `${anim.name} (Własne)`,
            };
            return (
              <div
                key={anim.id}
                className="p-4 rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-subtle)] flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[var(--ink-primary)] truncate">
                      {anim.name}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteStoredAsset(anim.id);
                        setCustomLogoAnims((prev) => prev.filter((item) => item.id !== anim.id));
                        showToast(`Usunięto własną animację: ${anim.name}`);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                      title="Usuń własną animację"
                    >
                      🗑
                    </button>
                  </div>

                  <div className="h-24 rounded-lg border border-[var(--border-subtle)] bg-[#09080f] flex items-center justify-center p-2 overflow-hidden">
                    {isVideo ? (
                      <video src={src} autoPlay loop muted playsInline className="max-h-full max-w-full object-contain" />
                    ) : (
                      <img src={src} alt={anim.name} className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => handleSetDefaultLogo("intro", cfg)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      isDefIntro
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {isDefIntro ? "✓ Domyślne Intro" : "Ustaw jako Intro"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDefaultLogo("outro", cfg)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      isDefOutro
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {isDefOutro ? "✓ Domyślne Outro" : "Ustaw jako Outro"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio / BGM Library with Preview Player */}
      <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
        <audio
          ref={audioPlayerRef}
          onEnded={() => setPlayingBgmId(null)}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[#9d85ff] grid place-items-center text-lg">
              🎵
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                Podkłady audio (BGM)
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Odsłuchaj dostępne podkłady lub wgraj własny plik .MP3 / .M4A / .WAV — pojawi się od razu w Generatorze AI i Montażu.
              </p>
            </div>
          </div>

          <label className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer self-start sm:self-auto">
            <span>＋ Wgraj własny BGM</span>
            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleUploadCustomBgm}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BUILTIN_BGM_TRACKS.map((track) => {
            const isPlaying = playingBgmId === track.id;
            return (
              <div
                key={track.id}
                className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--ink-primary)] truncate">
                    {track.name}
                  </div>
                  <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                    Wbudowany · {track.durationHint}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => togglePlayBgm(track.id, track.src)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                    isPlaying
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                  }`}
                >
                  {isPlaying ? "❚❚ Stop" : "▶ Odsłuchaj"}
                </button>
              </div>
            );
          })}

          {customBgmTracks.map((track) => {
            const src = track.url || track.dataUrl || "";
            const isPlaying = playingBgmId === track.id;
            return (
              <div
                key={track.id}
                className="p-3.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-subtle)] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--ink-primary)] truncate">
                    {track.name}
                  </div>
                  <div className="text-[10px] text-[#9d85ff] mt-0.5">
                    Własny podkład (zapisany)
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePlayBgm(track.id, src)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      isPlaying
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {isPlaying ? "❚❚" : "▶"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (isPlaying && audioPlayerRef.current) {
                        audioPlayerRef.current.pause();
                        setPlayingBgmId(null);
                      }
                      await deleteStoredAsset(track.id);
                      setCustomBgmTracks((prev) => prev.filter((item) => item.id !== track.id));
                      showToast(`Usunięto podkład audio: ${track.name}`);
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Usuń podkład"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Sinsay Brand Typography Section */}
      <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#6e1d2f] text-white font-sinsay font-bold text-base grid place-items-center shadow-sm">
              Aa
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[var(--ink-primary)]">
                  Oficjalna Typografia: Euclid Circular B
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#193328] text-[#75d9ae]">
                  ✓ Zainstalowany (10 odmian)
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Używany automatycznie przy wypalaniu napisów wideo i na grafikach statycznych.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTypographyPreview((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer self-start sm:self-auto"
          >
            {showTypographyPreview ? "Zwiń podgląd krojów ▲" : "Pokaż podgląd krojów ▼"}
          </button>
        </div>

        {showTypographyPreview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sinsay pt-3 border-t border-[var(--border-subtle)]">
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

          <div className="p-4 rounded-xl border border-[#7c5cff]/40 dark:border-[#9d85ff]/40 bg-[var(--accent-soft)] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-[#7c5cff] dark:text-[#9d85ff] font-mono font-bold">
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
        )}
      </div>
      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-sinsay text-base font-bold text-[var(--ink-primary)]">
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
