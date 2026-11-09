"use client";

import React, { useState } from "react";
import JSZip from "jszip";

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

  const handleStartExportPackage = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      const zip = new JSZip();

      // 1. Generate Manifest CSV inside the ZIP
      const headers = "ID,MDK,Format,Jezyk,NazwaPliku,Rozmiar,Typ,Kampania\n";
      const rows = selectedFiles
        .map(
          (f) =>
            `${f.id},001KR-83X,${f.format},${f.language},${f.filename},${f.size},${f.type},SiMotion_FW26_Capsule`
        )
        .join("\n");
      zip.file("campaign_manifest.csv", headers + rows);

      // 2. Generate JSON configuration
      const campaignConfig = {
        project: "SiMotion Atelier",
        mdk: "001KR-83X",
        collection: "Jedwab & Kaszmir",
        timestamp: new Date().toISOString(),
        folderStructure,
        namingConvention,
        filesCount: selectedFiles.length,
      };
      zip.file("config.json", JSON.stringify(campaignConfig, null, 2));

      // 3. Put files into folders according to selected folder structure
      selectedFiles.forEach((file) => {
        let folderPath = "";
        const cleanFormat = file.format.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "_");

        if (folderStructure === "mdk_format_lang") {
          folderPath = `001KR-83X/${cleanFormat}/${file.language}/`;
        } else if (folderStructure === "lang_format_mdk") {
          folderPath = `${file.language}/${cleanFormat}/001KR-83X/`;
        } else {
          folderPath = "";
        }

        if (file.type === "subtitles") {
          const srtData = `1\n00:00:00,000 --> 00:00:02,150\nJedwab i kaszmir — nowa definicja luksusu.\n\n2\n00:00:02,200 --> 00:00:04,800\nKolekcja kapsułowa FW26.\n\n3\n00:00:04,900 --> 00:00:07,500\nAtelier SiMotion — Odkryj w butiku online.\n`;
          zip.file(`${folderPath}${file.filename}`, srtData);
        } else if (file.type === "image") {
          // Provide an SVG banner or text descriptor for the static creative
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="100%" height="100%" fill="#1a1714"/>
  <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="#dfd5c6" stroke-width="2"/>
  <text x="540" y="460" font-family="serif" font-size="52" fill="#faf7f2" text-anchor="middle">JEDWAB &amp; KASZMIR</text>
  <text x="540" y="520" font-family="sans-serif" font-size="24" fill="#bfa890" text-anchor="middle" letter-spacing="4">KOLEKCJA KAPSUŁOWA FW26</text>
  <text x="540" y="620" font-family="serif" font-size="38" fill="#e56b4e" text-anchor="middle">od 1 290 PLN</text>
  <text x="540" y="700" font-family="sans-serif" font-size="18" fill="#877b72" text-anchor="middle">MDK: 001KR-83X · ATELIER SIMOTION</text>
</svg>`;
          zip.file(`${folderPath}${file.filename.replace(/\.png$/, ".svg")}`, svgContent);
        } else {
          // Video container mock specification file
          const metaInfo = `SiMotion Production Master Video\n` +
            `=================================\n` +
            `MDK: 001KR-83X\n` +
            `Target Format: ${file.format}\n` +
            `Audio Dubbing Language: ${file.language}\n` +
            `Resolution: ${file.format.includes("9:16") ? "1080x1920" : file.format.includes("4:5") ? "1080x1350" : "1080x1080"}\n` +
            `Codec: H.264 / AAC\n` +
            `Smart Crop Applied: YES (Offset 0px)\n` +
            `ElevenLabs Word Timestamps: Embedded\n` +
            `QA Check: PASSED (Character limit verified)\n` +
            `Mastering Timestamp: ${new Date().toISOString()}\n`;
          zip.file(`${folderPath}${file.filename}.meta.txt`, metaInfo);
        }
      });

      // Add brand kit animated logo asset to ZIP
      try {
        const logoRes = await fetch("/brand/logo_anim/biale/logo_outro_all_WH.gif");
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          zip.file("brand/sinsay_animated_outro_logo.gif", logoBlob);
        }
      } catch (e) {
        // fallback
      }

      // 4. Generate the actual ZIP blob and trigger browser download
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SiMotion_001KR-83X_Export_Package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setExportComplete(true);
    } catch (err) {
      console.error("Export zip error:", err);
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dfd5c6] dark:border-[#38302b] pb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c1816] dark:text-[#f7f3ec]">
            Eksport i paczki
          </h2>
          <p className="text-xs text-[#655a53] dark:text-[#b8aea4] mt-0.5">
            Pobieranie plików wideo, grafik i napisów wraz z manifestami pod kampanie.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDownloadManifest("json")}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] hover:bg-[#faf7f2] dark:hover:bg-[#292420] text-[#1c1816] dark:text-[#f7f3ec] transition-colors shadow-sm"
          >
            Manifest JSON
          </button>
          <button
            onClick={() => handleDownloadManifest("csv")}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] hover:bg-[#faf7f2] dark:hover:bg-[#292420] text-[#1c1816] dark:text-[#f7f3ec] transition-colors shadow-sm"
          >
            Manifest CSV
          </button>
          <button
            onClick={handleStartExportPackage}
            disabled={selectedFiles.length === 0 || isExporting}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#c84b31] dark:bg-[#e56b4e] hover:opacity-90 disabled:opacity-50 text-white shadow-sm transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Pakowanie archiwum...</span>
              </>
            ) : (
              <span>Pobierz paczkę ZIP ({selectedFiles.length})</span>
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
