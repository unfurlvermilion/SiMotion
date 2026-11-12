"use client";

import React, { useState, useRef } from "react";
import JSZip from "jszip";
import { SINSAY_MARKETS } from "./SinsayPhraseAssistant";

export interface ExportFileItem {
  id: string;
  filename: string;
  type: "video" | "image" | "subtitles" | "metadata";
  format: string;
  language: string;
  size: string;
  selected: boolean;
  blob?: Blob;
  realFile?: File;
}

interface ExportViewProps {
  productId?: string;
  staticTexts?: Record<string, { headline: string; subline: string }>;
  showToast?: (msg: string) => void;
}

export default function ExportView({
  productId = "001KR-83X",
  staticTexts = {
    PL: { headline: "Nowa kolekcja", subline: "Odkryj swój styl" },
    ENG: { headline: "New collection", subline: "Discover your style" },
    DE: { headline: "Neue Kollektion", subline: "Entdecke deinen Stil" },
    RO: { headline: "Colecție nouă", subline: "Descoperă stilul tău" },
    CZ: { headline: "Nová kolekce", subline: "Objev svůj styl" },
  },
  showToast,
}: ExportViewProps) {
  const [mdkCode, setMdkCode] = useState<string>(productId);
  const [campaignName, setCampaignName] = useState<string>("Kolekcja Kapsułowa FW26");
  const [folderStructure, setFolderStructure] = useState<string>("mdk_format_lang");
  const [namingConvention, setNamingConvention] = useState<string>("{MDK}_{RATIO}_{LANG}");
  const [includeManifest, setIncludeManifest] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);
  const [exportStats, setExportStats] = useState<{ totalFiles: number; sizeMb: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const createDefaultFilesForMdk = (sku: string): ExportFileItem[] => {
    const clean = sku?.trim() || "001KR";
    return [
      {
        id: "f-1",
        filename: `${clean}_9x16_PL_master.mp4`,
        type: "video",
        format: "9:16 TikTok/Reels",
        language: "PL",
        size: "14.2 MB",
        selected: true,
      },
      {
        id: "f-2",
        filename: `${clean}_4x5_PL_portrait.mp4`,
        type: "video",
        format: "4:5 IG Feed",
        language: "PL",
        size: "11.8 MB",
        selected: true,
      },
      {
        id: "f-3",
        filename: `${clean}_1x1_PL_square.mp4`,
        type: "video",
        format: "1:1 Feed / Meta",
        language: "PL",
        size: "9.6 MB",
        selected: true,
      },
      {
        id: "f-4",
        filename: `${clean}_9x16_RO_master.mp4`,
        type: "video",
        format: "9:16 TikTok/Reels",
        language: "RO",
        size: "14.1 MB",
        selected: true,
      },
      {
        id: "f-5",
        filename: `${clean}_9x16_DE_master.mp4`,
        type: "video",
        format: "9:16 TikTok/Reels",
        language: "DE",
        size: "14.4 MB",
        selected: true,
      },
      {
        id: "f-6",
        filename: `${clean}_3x4_lookbook.png`,
        type: "image",
        format: "3:4 Lookbook 1080x1440",
        language: "PL",
        size: "2.8 MB",
        selected: true,
      },
      {
        id: "f-7",
        filename: `${clean}_subtitles_pl.srt`,
        type: "subtitles",
        format: "SRT Timed Subtitles",
        language: "PL",
        size: "18 KB",
        selected: true,
      },
      {
        id: "f-8",
        filename: `${clean}_subtitles_ro.srt`,
        type: "subtitles",
        format: "SRT Timed Subtitles",
        language: "RO",
        size: "18 KB",
        selected: true,
      },
    ];
  };

  const [files, setFiles] = useState<ExportFileItem[]>(() => createDefaultFilesForMdk(productId));

  // Sync if parent productId updates
  React.useEffect(() => {
    if (productId) {
      setMdkCode(productId);
      setFiles((prev) =>
        prev.map((f) => {
          // preserve custom added files if any, but update prefix for standard files
          const parts = f.filename.split("_");
          if (parts.length > 1) {
            return {
              ...f,
              filename: `${productId}_${parts.slice(1).join("_")}`,
            };
          }
          return f;
        })
      );
    }
  }, [productId]);

  const handleMdkChange = (newMdk: string) => {
    setMdkCode(newMdk);
    setFiles((prev) =>
      prev.map((f) => {
        const parts = f.filename.split("_");
        if (parts.length > 1) {
          return {
            ...f,
            filename: `${newMdk || "001KR"}_${parts.slice(1).join("_")}`,
          };
        }
        return f;
      })
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: select })));
  };

  const toggleFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const selectedFiles = files.filter((f) => f.selected);

  // Add Real Files via Drag & Drop or Upload
  const handleAddRealFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    if (!uploaded.length) return;

    const newItems: ExportFileItem[] = uploaded.map((f, i) => {
      const isVideo = f.type.startsWith("video") || f.name.endsWith(".mp4") || f.name.endsWith(".mov");
      const isImage = f.type.startsWith("image") || f.name.endsWith(".png") || f.name.endsWith(".jpg");
      const isSub = f.name.endsWith(".srt") || f.name.endsWith(".vtt");

      const type: ExportFileItem["type"] = isVideo
        ? "video"
        : isImage
        ? "image"
        : isSub
        ? "subtitles"
        : "metadata";

      const sizeMb = (f.size / (1024 * 1024)).toFixed(1) + " MB";

      return {
        id: `upload-${Date.now()}-${i}`,
        filename: f.name,
        type,
        format: isVideo ? "Wideo Master" : isImage ? "Grafika Kampanii" : "Napisy / Meta",
        language: "PL",
        size: sizeMb,
        selected: true,
        realFile: f,
      };
    });

    setFiles((prev) => [...newItems, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Generate Manifest (CSV or JSON)
  const handleDownloadManifest = (format: "csv" | "json") => {
    let content = "";
    let mime = "";
    let ext = "";

    if (format === "csv") {
      const headers = "ID,MDK,Format,Jezyk,NazwaPliku,Rozmiar,Typ,Kampania\n";
      const rows = selectedFiles
        .map(
          (f) =>
            `${f.id},${mdkCode},${f.format},${f.language},${f.filename},${f.size},${f.type},${campaignName}`
        )
        .join("\n");
      content = headers + rows;
      mime = "text/csv;charset=utf-8;";
      ext = "csv";
    } else {
      const data = {
        project: "SiMotion Fashion Studio",
        mdk: mdkCode,
        collection: campaignName,
        brand: "Sinsay / LPP SA",
        timestamp: new Date().toISOString(),
        folderStructure,
        namingConvention,
        filesCount: selectedFiles.length,
        files: selectedFiles.map((f) => ({
          filename: f.filename,
          format: f.format,
          language: f.language,
          size: f.size,
          type: f.type,
        })),
      };
      content = JSON.stringify(data, null, 2);
      mime = "application/json;charset=utf-8;";
      ext = "json";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sinsay_Manifest_${mdkCode}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Start Building & Downloading Real ZIP
  const handleStartExportPackage = async () => {
    if (!selectedFiles.length) return;
    setIsExporting(true);
    setExportComplete(false);

    try {
      const zip = new JSZip();
      const rootFolder = zip.folder(`Sinsay_${mdkCode}_CampaignPackage`) || zip;

      // 1. Generate Manifest CSV & JSON
      const headers = "ID,MDK,Format,Jezyk,NazwaPliku,Rozmiar,Typ,Kampania\n";
      const rows = selectedFiles
        .map(
          (f) =>
            `${f.id},${mdkCode},${f.format},${f.language},${f.filename},${f.size},${f.type},${campaignName}`
        )
        .join("\n");
      rootFolder.file("campaign_manifest.csv", headers + rows);

      const campaignConfig = {
        project: "SiMotion Fashion Studio",
        brand: "Sinsay / LPP SA",
        mdk: mdkCode,
        collection: campaignName,
        timestamp: new Date().toISOString(),
        folderStructure,
        namingConvention,
        filesCount: selectedFiles.length,
      };
      rootFolder.file("manifest.json", JSON.stringify(campaignConfig, null, 2));

      // 2. Fetch and add Sinsay Official Animated Logo Outro
      try {
        const logoRes = await fetch("/brand/logo_anim/biale/logo_outro_all_WH.gif");
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          rootFolder.file("brand/logo_outro_sinsay_white.gif", logoBlob);
        }
      } catch (e) {
        console.warn("Logo fetch failed:", e);
      }

      // 3. Put each file into structured paths
      for (const file of selectedFiles) {
        let folderPath = "";
        const cleanFormat = file.format.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "_");

        if (folderStructure === "mdk_format_lang") {
          folderPath = `${mdkCode}/${cleanFormat}/${file.language}/`;
        } else if (folderStructure === "lang_format_mdk") {
          folderPath = `${file.language}/${cleanFormat}/${mdkCode}/`;
        } else {
          folderPath = "";
        }

        // If user attached a real file, pack real binary data
        if (file.realFile) {
          rootFolder.file(`${folderPath}${file.filename}`, file.realFile);
        } else if (file.blob) {
          rootFolder.file(`${folderPath}${file.filename}`, file.blob);
        } else if (file.type === "subtitles") {
          // Real timed subtitles tailored to the specific target language
          const langText =
            staticTexts[file.language]?.headline ||
            staticTexts["PL"]?.headline ||
            "Nowa kolekcja na Twój sposób";
          const langSub =
            staticTexts[file.language]?.subline ||
            staticTexts["PL"]?.subline ||
            "Sinsay — modne stylizacje w najlepszych cenach.";

          const srtData =
            `1\n00:00:00,000 --> 00:00:02,500\n${langText}\n\n` +
            `2\n00:00:02,550 --> 00:00:05,200\n${langSub}\n\n` +
            `3\n00:00:05,300 --> 00:00:09,500\nSinsay · Oficjalna kolekcja 2026\n`;
          rootFolder.file(`${folderPath}${file.filename}`, srtData);
        } else if (file.type === "image") {
          // Generate an actual PNG Canvas image rendering the specific language translation
          const canvas = document.createElement("canvas");
          canvas.width = file.format.includes("3:4") ? 1080 : 1080;
          canvas.height = file.format.includes("3:4") ? 1440 : 1080;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#1a1714";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#c84b31";
            ctx.lineWidth = 12;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 44px 'Euclid Circular B', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("SINSAY ATELIER 2026", canvas.width / 2, canvas.height / 2 - 40);
            ctx.font = "28px 'Euclid Circular B', sans-serif";
            ctx.fillStyle = "#e56b4e";
            ctx.fillText(`MDK: ${mdkCode} · ${file.format} (${file.language})`, canvas.width / 2, canvas.height / 2 + 20);
            ctx.font = "22px 'Euclid Circular B', sans-serif";
            ctx.fillStyle = "#f7f3ec";

            const langHeadline =
              staticTexts[file.language]?.headline ||
              staticTexts["PL"]?.headline ||
              "Nowa kolekcja na Twój sposób";
            ctx.fillText(`„${langHeadline}”`, canvas.width / 2, canvas.height / 2 + 75);

            const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
            if (pngBlob) {
              rootFolder.file(`${folderPath}${file.filename.replace(/\.[^.]+$/, ".png")}`, pngBlob);
            }
          }
        } else {
          // Video metadata spec container
          const metaSpec =
            `=====================================================\n` +
            `SINSAY VIDEO PRODUCTION MASTER SPECIFICATION\n` +
            `=====================================================\n` +
            `Kod MDK:           ${mdkCode}\n` +
            `Kampania:          ${campaignName}\n` +
            `Format wideo:      ${file.format}\n` +
            `Język audio/napis: ${file.language}\n` +
            `Wymiary / Kadr:    ${file.format.includes("9:16") ? "1080x1920 (Pion TikTok)" : file.format.includes("4:5") ? "1080x1350 (Meta Feed)" : "1080x1080 (Kwadrat)"}\n` +
            `Typografia:        Euclid Circular B (LPP SA Official)\n` +
            `Logo Outro:        Brand Kit Sinsay (z kanałem alfa / gif)\n` +
            `Data eksportu:     ${new Date().toISOString()}\n`;
          rootFolder.file(`${folderPath}${file.filename}.spec.txt`, metaSpec);
        }
      }

      // 4. Generate final ZIP Blob
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipSizeMb = (content.size / (1024 * 1024)).toFixed(2) + " MB";
      setExportStats({ totalFiles: selectedFiles.length, sizeMb: zipSizeMb });

      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sinsay_${mdkCode}_Campaign_Master_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportComplete(true);
    } catch (err) {
      console.error("Błąd podczas generowania paczki ZIP:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Centrum eksportu i paczek
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Przygotowanie oficjalnych paczek kampanijnych Sinsay (Wideo, Grafiki, Napisy SRT, Logo Brand Kit i Manifest).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleDownloadManifest("csv")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] transition-colors shadow-xs"
          >
            Pobierz Manifest CSV
          </button>
          <button
            type="button"
            onClick={() => handleDownloadManifest("json")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] transition-colors shadow-xs"
          >
            Pobierz Manifest JSON
          </button>
          <button
            type="button"
            onClick={handleStartExportPackage}
            disabled={isExporting || selectedFiles.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#c84b31] hover:bg-[#b03e26] transition-all shadow-[var(--shadow-pop)] flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Pakowanie archiwum ZIP...</span>
              </>
            ) : (
              <span>Pobierz paczkę ZIP ({selectedFiles.length} plików) ↓</span>
            )}
          </button>
        </div>
      </div>

      {/* Campaign Metadata Inputs */}
      <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-[var(--ink-secondary)] block mb-1">
            Kod artykułu / MDK
          </label>
          <input
            type="text"
            value={mdkCode}
            onChange={(e) => handleMdkChange(e.target.value.toUpperCase())}
            placeholder="np. 001KR-83X"
            className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-mono font-bold"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[var(--ink-secondary)] block mb-1">
            Nazwa kampanii / Kolekcja
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="np. Sinsay Atelier AW26"
            className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[var(--ink-secondary)] block mb-1">
            Struktura folderów w ZIP
          </label>
          <select
            value={folderStructure}
            onChange={(e) => setFolderStructure(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-semibold"
          >
            <option value="mdk_format_lang">MDK / Format / Język (Zalecane LPP)</option>
            <option value="lang_format_mdk">Język / Format / MDK (Dla rynków)</option>
            <option value="flat">Płaska lista (Wszystko w jednym folderze)</option>
          </select>
        </div>
      </div>

      {/* Main Files Table */}
      <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Pliki przygotowane do paczki ({selectedFiles.length} z {files.length})
            </h2>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => toggleSelectAll(true)}
                className="text-[var(--accent)] hover:underline font-bold"
              >
                Zaznacz wszystkie
              </button>
              <span className="text-[var(--ink-muted)]">·</span>
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                className="text-[var(--ink-muted)] hover:underline"
              >
                Odznacz
              </button>
            </div>
          </div>

          {/* Add custom files button */}
          <label className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] hover:border-[var(--accent)] cursor-pointer text-[var(--ink-primary)] transition-all">
            <span>↑ Dołącz pliki wideo/foto z dysku</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleAddRealFiles}
              className="hidden"
            />
          </label>
        </div>

        {/* Files Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[11px] font-extrabold text-[var(--ink-secondary)] uppercase">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === files.length && files.length > 0}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[var(--accent)]"
                  />
                </th>
                <th className="py-2.5 px-3">Nazwa pliku</th>
                <th className="py-2.5 px-3">Typ</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">Rynek</th>
                <th className="py-2.5 px-3">Rozmiar</th>
                <th className="py-2.5 px-2 text-center w-12">Usuń</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                  <td className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={file.selected}
                      onChange={() => toggleFile(file.id)}
                      className="w-3.5 h-3.5 accent-[var(--accent)]"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-[var(--ink-primary)]">
                    {file.filename}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        file.type === "video"
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : file.type === "image"
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {file.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-[var(--ink-secondary)]">
                    {file.format}
                  </td>
                  <td className="py-2 px-3 font-bold text-[var(--accent)]">
                    {file.language}
                  </td>
                  <td className="py-2 px-3 font-mono text-[var(--ink-muted)]">
                    {file.size}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-rose-500 hover:text-rose-700 font-bold p-1 text-xs"
                      title="Usuń z paczki"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Success Alert */}
        {exportComplete && exportStats && (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span className="font-bold text-xs">
              ✓ Paczka ZIP została pomyślnie wygenerowana i pobrana ({exportStats.totalFiles} plików · {exportStats.sizeMb}).
            </span>
            <button
              type="button"
              onClick={() => setExportComplete(false)}
              className="text-xs font-bold hover:underline"
            >
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
