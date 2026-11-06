"use client";

import React, { useState } from "react";

interface ExportFileItem {
  id: string;
  filename: string;
  type: "video" | "image" | "subtitles" | "metadata";
  format: string;
  language: string;
  size: string;
  selected: boolean;
}

const SAMPLE_FILES: ExportFileItem[] = [
  {
    id: "f-1",
    filename: "001KR-83X_9x16_PL_master.mp4",
    type: "video",
    format: "9:16 TikTok/Reels",
    language: "PL",
    size: "14.2 MB",
    selected: true,
  },
  {
    id: "f-2",
    filename: "001KR-83X_4x5_PL_portrait.mp4",
    type: "video",
    format: "4:5 IG Feed",
    language: "PL",
    size: "11.8 MB",
    selected: true,
  },
  {
    id: "f-3",
    filename: "001KR-83X_1x1_PL_square.mp4",
    type: "video",
    format: "1:1 Feed / Meta",
    language: "PL",
    size: "9.6 MB",
    selected: true,
  },
  {
    id: "f-4",
    filename: "001KR-83X_9x16_DE_master.mp4",
    type: "video",
    format: "9:16 TikTok/Reels",
    language: "DE",
    size: "14.4 MB",
    selected: true,
  },
  {
    id: "f-5",
    filename: "001KR-83X_4x5_DE_portrait.mp4",
    type: "video",
    format: "4:5 IG Feed",
    language: "DE",
    size: "11.9 MB",
    selected: true,
  },
  {
    id: "f-6",
    filename: "001KR-83X_1x1_static_creative.png",
    type: "image",
    format: "1:1 PNG 1080x1080",
    language: "PL",
    size: "2.1 MB",
    selected: true,
  },
  {
    id: "f-7",
    filename: "001KR-83X_subtitles_karaoke.srt",
    type: "subtitles",
    format: "SRT Timed Subtitles",
    language: "PL",
    size: "18 KB",
    selected: true,
  },
];

export default function ExportView() {
  const [files, setFiles] = useState<ExportFileItem[]>(SAMPLE_FILES);
  const [folderStructure, setFolderStructure] = useState<string>("mdk_format_lang");
  const [namingConvention, setNamingConvention] = useState<string>("{MDK}_{RATIO}_{LANG}");
  const [includeManifest, setIncludeManifest] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  const toggleSelectAll = (select: boolean) => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: select })));
  };

  const toggleFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const selectedFiles = files.filter((f) => f.selected);

  const handleDownloadManifest = (format: "csv" | "json") => {
    let content = "";
    let mime = "";
    let ext = "";

    if (format === "csv") {
      const headers = "ID,MDK,Format,Jezyk,NazwaPliku,Rozmiar,Typ,Kampania\n";
      const rows = selectedFiles
        .map(
          (f) =>
            `${f.id},001KR-83X,${f.format},${f.language},${f.filename},${f.size},${f.type},SiMotion_FW26_Capsule`
        )
        .join("\n");
      content = headers + rows;
      mime = "text/csv;charset=utf-8;";
      ext = "csv";
    } else {
      const data = {
        project: "SiMotion Atelier",
        mdk: "001KR-83X",
        collection: "Jedwab & Kaszmir",
        timestamp: new Date().toISOString(),
        folderStructure,
        namingConvention,
        files: selectedFiles,
      };
      content = JSON.stringify(data, null, 2);
      mime = "application/json;charset=utf-8;";
      ext = "json";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `simotion_campaign_manifest_001KR-83X.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartExportPackage = () => {
    setIsExporting(true);
    setExportComplete(false);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      // Automatically download the campaign CSV manifest as part of the package
      handleDownloadManifest("csv");
    }, 1800);
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dfd5c6] dark:border-[#38302b] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#c84b31] dark:text-[#e56b4e] mb-1">
            <span>● Moduł 06</span>
            <span>·</span>
            <span>Export & Delivery</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-serif text-[#1c1816] dark:text-[#f7f3ec]">
            Centrum Eksportu & Paczki Kampanijne
          </h2>
          <p className="text-sm text-[#655a53] dark:text-[#b8aea4] mt-1">
            Przygotuj spakowane warianty wideo i grafiki wraz z gotowymi manifestami pod Meta Ads, TikTok i Google.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownloadManifest("json")}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] hover:bg-[#faf7f2] dark:hover:bg-[#292420] text-[#1c1816] dark:text-[#f7f3ec] transition-colors shadow-sm"
          >
            Pobierz Manifest JSON
          </button>
          <button
            onClick={() => handleDownloadManifest("csv")}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] hover:bg-[#faf7f2] dark:hover:bg-[#292420] text-[#1c1816] dark:text-[#f7f3ec] transition-colors shadow-sm"
          >
            Pobierz Manifest CSV
          </button>
          <button
            onClick={handleStartExportPackage}
            disabled={selectedFiles.length === 0 || isExporting}
            className="px-5 py-2 text-xs font-medium rounded-lg bg-[#c84b31] dark:bg-[#e56b4e] hover:opacity-90 disabled:opacity-50 text-white shadow-sm transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Pakowanie archiwum...</span>
              </>
            ) : (
              <span>↓ Pobierz Paczkę ({selectedFiles.length} plików)</span>
            )}
          </button>
        </div>
      </div>

      {exportComplete && (
        <div className="p-4 rounded-xl border border-[#1d6346] dark:border-[#75d9ae] bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span className="font-medium">
              Paczka kampanijna oraz manifest zostały pomyślnie wygenerowane i pobrane na Twój dysk!
            </span>
          </div>
          <button
            onClick={() => setExportComplete(false)}
            className="text-[11px] underline hover:no-underline"
          >
            Zamknij powiadomienie
          </button>
        </div>
      )}

      {/* Grid: Configurations & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Packaging Rules */}
        <div className="p-5 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] shadow-sm space-y-5">
          <h3 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec] border-b border-[#dfd5c6] dark:border-[#38302b] pb-2">
            Struktura folderów paczki ZIP
          </h3>

          <div className="space-y-3 text-xs">
            <label className="block text-[#655a53] dark:text-[#b8aea4]">
              Układ katalogów docelowych:
            </label>
            <div className="space-y-2">
              {[
                {
                  id: "mdk_format_lang",
                  label: "MDK / Format / Język",
                  sub: "np. 001KR-83X / 9x16 / PL / wideo.mp4",
                },
                {
                  id: "lang_format_mdk",
                  label: "Język / Format / MDK",
                  sub: "np. PL / 9x16 / 001KR-83X / wideo.mp4",
                },
                {
                  id: "flat_prefixed",
                  label: "Płaski folder (Prefiksy w nazwach)",
                  sub: "Wszystkie pliki w jednym katalogu",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    folderStructure === opt.id
                      ? "border-[#c84b31] dark:border-[#e56b4e] bg-[#fceee9]/30 dark:bg-[#38211c]/30"
                      : "border-[#dfd5c6] dark:border-[#38302b] hover:bg-[#faf7f2] dark:hover:bg-[#1a1714]"
                  }`}
                >
                  <input
                    type="radio"
                    name="folder_opt"
                    checked={folderStructure === opt.id}
                    onChange={() => setFolderStructure(opt.id)}
                    className="mt-0.5 accent-[#c84b31]"
                  />
                  <div>
                    <p className="font-medium text-[#1c1816] dark:text-[#f7f3ec]">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-[#877b72] dark:text-[#8e8379]">
                      {opt.sub}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2">
            <label className="block text-[#655a53] dark:text-[#b8aea4]">
              Szablon nazewnictwa plików:
            </label>
            <input
              type="text"
              value={namingConvention}
              onChange={(e) => setNamingConvention(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] font-mono text-[11px] text-[#1c1816] dark:text-[#f7f3ec] focus:outline-none focus:border-[#c84b31]"
            />
            <p className="text-[10px] text-[#877b72] dark:text-[#8e8379]">
              Dostępne zmienne: &#123;MDK&#125;, &#123;RATIO&#125;, &#123;LANG&#125;, &#123;DATE&#125;
            </p>
          </div>

          <div className="pt-2 border-t border-[#dfd5c6] dark:border-[#38302b]">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1c1816] dark:text-[#f7f3ec]">
              <input
                type="checkbox"
                checked={includeManifest}
                onChange={(e) => setIncludeManifest(e.target.checked)}
                className="accent-[#c84b31]"
              />
              <span>Dołącz automatyczny manifest kampanii (CSV)</span>
            </label>
          </div>
        </div>

        {/* Right 2 columns: File selection list */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#dfd5c6] dark:border-[#38302b] pb-3">
            <div>
              <h3 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec]">
                Zawartość paczki do eksportu
              </h3>
              <p className="text-xs text-[#655a53] dark:text-[#b8aea4]">
                Zaznaczono {selectedFiles.length} z {files.length} plików
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => toggleSelectAll(true)}
                className="px-2.5 py-1 rounded bg-[#faf7f2] dark:bg-[#1a1714] text-[#655a53] dark:text-[#b8aea4] hover:text-[#1c1816] dark:hover:text-[#f7f3ec] transition-colors"
              >
                Zaznacz wszystkie
              </button>
              <button
                onClick={() => toggleSelectAll(false)}
                className="px-2.5 py-1 rounded bg-[#faf7f2] dark:bg-[#1a1714] text-[#655a53] dark:text-[#b8aea4] hover:text-[#1c1816] dark:hover:text-[#f7f3ec] transition-colors"
              >
                Odznacz
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#dfd5c6] dark:divide-[#38302b] text-xs">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => toggleFile(file.id)}
                className="py-3 flex items-center justify-between hover:bg-[#faf7f2]/50 dark:hover:bg-[#1a1714]/30 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={file.selected}
                    onChange={() => {}}
                    className="accent-[#c84b31]"
                  />
                  <div>
                    <p className="font-mono font-medium text-[#1c1816] dark:text-[#f7f3ec]">
                      {file.filename}
                    </p>
                    <p className="text-[11px] text-[#877b72] dark:text-[#8e8379]">
                      {file.format} · Język: {file.language}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-[#877b72] dark:text-[#8e8379]">
                    {file.size}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      file.type === "video"
                        ? "bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e]"
                        : file.type === "image"
                        ? "bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae]"
                        : "bg-[#f2ece1] dark:bg-[#292420] text-[#655a53] dark:text-[#b8aea4]"
                    }`}
                  >
                    {file.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#dfd5c6] dark:border-[#38302b] flex items-center justify-between text-xs text-[#877b72] dark:text-[#8e8379]">
            <span>Szacowany rozmiar paczki: ~64.3 MB</span>
            <span className="font-medium text-[#1c1816] dark:text-[#f7f3ec]">
              Kompresja ZIP: Deflate Max
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
