"use client";

import React, { useState } from "react";
import JSZip from "jszip";

interface BatchItem {
  id: string;
  mdk: string;
  name: string;
  category: string;
  markets: string[];
  formats: string[];
  pcmStatus: "ready" | "missing_media" | "pending";
  qaStatus: "passed" | "warning" | "error";
  progress: number;
  status: "idle" | "queued" | "rendering" | "completed" | "failed";
}

const INITIAL_BATCH: BatchItem[] = [
  {
    id: "b-1",
    mdk: "001KR-83X",
    name: "Jedwab & Kaszmir — Płaszcz Camel",
    category: "Outerwear / Premium",
    markets: ["PL", "DE", "CZ", "RO", "HU"],
    formats: ["9:16", "4:5", "1:1"],
    pcmStatus: "ready",
    qaStatus: "passed",
    progress: 100,
    status: "completed",
  },
  {
    id: "b-2",
    mdk: "002KR-91Y",
    name: "Koszula Silk Minimalist Ecru",
    category: "Shirts / Atelier",
    markets: ["PL", "DE", "RO"],
    formats: ["9:16", "4:5"],
    pcmStatus: "ready",
    qaStatus: "passed",
    progress: 65,
    status: "rendering",
  },
  {
    id: "b-3",
    mdk: "003KR-14A",
    name: "Spodnie Wide Leg Wool Taupe",
    category: "Pants / Sartorial",
    markets: ["PL", "DE", "CZ"],
    formats: ["9:16", "1:1"],
    pcmStatus: "missing_media",
    qaStatus: "warning",
    progress: 0,
    status: "queued",
  },
  {
    id: "b-4",
    mdk: "004KR-55C",
    name: "Sukienka Maxi Velvet Burgundy",
    category: "Dresses / Evening",
    markets: ["PL", "DE", "CZ", "RO", "HU"],
    formats: ["9:16", "4:5", "1:1"],
    pcmStatus: "ready",
    qaStatus: "passed",
    progress: 0,
    status: "queued",
  },
];

export default function BatchProductionView() {
  const [items, setItems] = useState<BatchItem[]>(INITIAL_BATCH);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [filterMarket, setFilterMarket] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lastSharePointSync, setLastSharePointSync] = useState<string>("");
  const [logMessages, setLogMessages] = useState<string[]>([
    "[10:00:12] Zainicjalizowano kolejkę wsadową SiMotion",
    "[10:00:15] Zaimportowano 4 pozycje MDK ze skoroszytu SharePoint Excel Online",
    "[10:01:02] Zakończono generowanie 15 wariantów dla MDK: 001KR-83X",
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("pl-PL");
    setLogMessages((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const fetchSharepointRows = async () => {
    try {
      const res = await fetch("/api/spreadsheet");
      const data = await res.json();
      if (data && Array.isArray(data.rows)) {
        setItems(
          data.rows.map((row: any) => ({
            id: `sp-${row.mdk}`,
            mdk: row.mdk,
            name: row.name,
            category: row.category,
            markets: row.markets || ["PL", "DE"],
            formats: row.formats || ["9:16", "4:5"],
            pcmStatus: row.pcmStatus || "ready",
            qaStatus: "passed",
            progress: row.status === "completed" ? 100 : row.status === "rendering" ? 50 : 0,
            status: row.status || "queued",
          }))
        );
        setLastSharePointSync(data.displayTime || new Date().toLocaleTimeString("pl-PL"));
        addLog(`Pobrano ${data.totalRows} aktualnych pozycji ze skoroszytu SharePoint Excel.`);
      }
    } catch (err) {
      console.error("Fetch sharepoint rows error:", err);
    }
  };

  // Initial sync with SharePoint on mount only once to avoid destroying user changes
  React.useEffect(() => {
    fetchSharepointRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartBatch = () => {
    setIsProcessing(true);
    addLog("Rozpoczęto hurtowe generowanie wariantów wideo...");

    const interval = setInterval(() => {
      setItems((prev) => {
        let allDone = true;
        const updated = prev.map((item) => {
          if (item.status === "completed") return item;
          allDone = false;

          if (item.status === "queued" || item.status === "idle") {
            return { ...item, status: "rendering" as const, progress: 15 };
          }
          if (item.status === "rendering") {
            const nextProgress = Math.min(100, item.progress + 25);
            if (nextProgress >= 100) {
              // Push completed status back to SharePoint Excel
              fetch("/api/spreadsheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "update_status",
                  mdk: item.mdk,
                  newStatus: "completed",
                  videoUrl: `https://si-motion.vercel.app/preview/${item.mdk}_master.mp4`,
                }),
              }).catch(() => {});
              return { ...item, status: "completed" as const, progress: 100 };
            }
            return { ...item, progress: nextProgress };
          }
          return item;
        });

        if (allDone) {
          clearInterval(interval);
          setIsProcessing(false);
          addLog("Wszystkie zadania w kolejce batchowej zostały ukończone!");
        }
        return updated;
      });
    }, 1200);
  };

  const handlePauseBatch = () => {
    setIsProcessing(false);
    addLog("Wstrzymano kolejkę wsadową");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      
      const newItems: BatchItem[] = [];
      lines.slice(1).forEach((line, idx) => {
        const parts = line.split(/[,;\t]/).map((p) => p.trim());
        if (parts.length >= 2) {
          newItems.push({
            id: `upload-${Date.now()}-${idx}`,
            mdk: parts[0] || `MDK-${100 + idx}`,
            name: parts[1] || "Produkt z pliku CSV",
            category: parts[2] || "Kolekcja Kapsułowa",
            markets: parts[3] ? parts[3].split("+") : ["PL", "DE"],
            formats: ["9:16", "4:5", "1:1"],
            pcmStatus: "ready",
            qaStatus: "passed",
            progress: 0,
            status: "queued",
          });
        }
      });

      if (newItems.length > 0) {
        setItems((prev) => [...newItems, ...prev]);
        addLog(`Pomyślnie zaimportowano ${newItems.length} nowych pozycji z pliku ${file.name}`);
      } else {
        addLog(`Załadowano plik ${file.name}. Użyj formatu: MDK,Nazwa,Kategoria,Rynki`);
      }
    };
    reader.readAsText(file);
  };

  const loadPresetCSV = () => {
    const sampleItems: BatchItem[] = [
      {
        id: `csv-${Date.now()}-1`,
        mdk: "005KR-19Z",
        name: "Golf Wełniany Merino Camel",
        category: "Knitwear / Premium",
        markets: ["PL", "DE", "CZ"],
        formats: ["9:16", "4:5"],
        pcmStatus: "ready",
        qaStatus: "passed",
        progress: 0,
        status: "queued",
      },
      {
        id: `csv-${Date.now()}-2`,
        mdk: "006KR-44B",
        name: "Trencz Skórzany Espresso",
        category: "Outerwear / Atelier",
        markets: ["PL", "DE", "RO", "HU"],
        formats: ["9:16", "4:5", "1:1"],
        pcmStatus: "ready",
        qaStatus: "passed",
        progress: 0,
        status: "queued",
      },
    ];
    setItems((prev) => [...sampleItems, ...prev]);
    addLog("Załadowano przykładowy zestaw testowy CSV (2 nowe kody MDK)");
  };

  const [isExportingBatch, setIsExportingBatch] = useState(false);

  const handleExportBatchZip = async () => {
    const doneItems = items.filter((i) => i.status === "completed");
    if (!doneItems.length) {
      addLog("Brak ukończonych produktów do pobrania. Uruchom najpierw batch!");
      return;
    }

    setIsExportingBatch(true);
    addLog(`Generowanie hurtowego archiwum ZIP dla ${doneItems.length} ukończonych produktów...`);

    try {
      const zip = new JSZip();
      const root = zip.folder(`Sinsay_Batch_Export_${new Date().toISOString().slice(0, 10)}`) || zip;

      // 1. Master CSV Summary
      let csv = "MDK,Nazwa,Kategoria,Status,Rynki,Formaty,Data\n";
      doneItems.forEach((it) => {
        csv += `${it.mdk},"${it.name}","${it.category}",${it.status},"${it.markets.join("+")}","${it.formats.join("+")}",${new Date().toISOString()}\n`;
      });
      root.file("batch_summary.csv", csv);

      // 2. Add each item's folder with SRT subtitles and render specs
      doneItems.forEach((it) => {
        const itemFolder = root.folder(it.mdk) || root;
        const info = {
          mdk: it.mdk,
          name: it.name,
          category: it.category,
          markets: it.markets,
          formats: it.formats,
          subtitlesFont: "Euclid Circular B (LPP SA Brand Kit)",
          outroLogo: "Sinsay Outro All (Białe)",
          completedAt: new Date().toISOString(),
        };
        itemFolder.file("item_manifest.json", JSON.stringify(info, null, 2));

        // SRT subtitles for each market
        it.markets.forEach((m) => {
          const srt = `1\n00:00:00,000 --> 00:00:02,400\n${it.name}\n\n2\n00:00:02,450 --> 00:00:05,000\nSinsay — Nowa kolekcja na Twój sposób.\n`;
          itemFolder.file(`subtitles_${m}_euclid.srt`, srt);
        });

        // 3 formats specs
        itemFolder.file(
          "video_specs.txt",
          `Warianty wideo dla ${it.mdk}:\n- 9:16 (TikTok/Reels)\n- 4:5 (Meta Feed Smart Crop)\n- 1:1 (Kwadrat)\nFont napisów: Euclid Circular B\nLogo Outro: Sinsay After Effects\n`
        );
      });

      // 3. Add Brand Kit animated logo asset
      try {
        const logoRes = await fetch("/brand/logo_anim/biale/logo_outro_all_WH.gif");
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          root.file("brand/sinsay_animated_outro_logo.gif", logoBlob);
        }
      } catch (e) {}

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sinsay_Batch_${doneItems.length}_Products_Export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addLog(`✓ Pomyślnie pobrano hurtową paczkę ZIP (${doneItems.length} produktów)!`);
    } catch (e) {
      console.error(e);
      addLog("Błąd generowania paczki ZIP");
    } finally {
      setIsExportingBatch(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.mdk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarket =
      filterMarket === "ALL" || item.markets.includes(filterMarket);
    return matchesSearch && matchesMarket;
  });

  const totalVariants = items.reduce(
    (acc, it) => acc + it.markets.length * it.formats.length,
    0
  );
  const completedItems = items.filter((i) => i.status === "completed").length;

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dfd5c6] dark:border-[#38302b] pb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c1816] dark:text-[#f7f3ec]">
            Produkcja seryjna (Batch)
          </h2>
          <p className="text-xs text-[#655a53] dark:text-[#b8aea4] mt-0.5">
            Generowanie partii wideo z pliku CSV lub SharePointa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchSharepointRows}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#193328] bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae] hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>↻</span>
            <span>SharePoint {lastSharePointSync ? `(${lastSharePointSync})` : ""}</span>
          </button>
          <label className="cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] hover:bg-[#faf7f2] dark:hover:bg-[#292420] text-[#1c1816] dark:text-[#f7f3ec] transition-colors flex items-center gap-2 shadow-sm">
            <span>↑ Wgraj CSV</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={loadPresetCSV}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-dashed border-[#bfa890] dark:border-[#5c4d42] text-[#655a53] dark:text-[#b8aea4] hover:text-[#1c1816] dark:hover:text-[#f7f3ec] transition-colors"
          >
            + Przykładowy CSV
          </button>
          {completedItems > 0 && (
            <button
              onClick={handleExportBatchZip}
              disabled={isExportingBatch}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1d6346] hover:bg-[#164e37] text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>{isExportingBatch ? "Pakowanie..." : `💾 Pobierz Batch ZIP (${completedItems})`}</span>
            </button>
          )}
          {isProcessing ? (
            <button
              onClick={handlePauseBatch}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-[#b84a62] hover:bg-[#9e3a50] text-white shadow-sm transition-colors"
            >
              ⏸ Wstrzymaj kolejkę
            </button>
          ) : (
            <button
              onClick={handleStartBatch}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-[#c84b31] dark:bg-[#e56b4e] hover:opacity-90 text-white shadow-sm transition-colors flex items-center gap-2"
            >
              <span>▶ Uruchom Batch ({items.length} MDK)</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#877b72] dark:text-[#8e8379]">
            Wszystkie kody MDK
          </p>
          <p className="text-2xl font-serif text-[#1c1816] dark:text-[#f7f3ec] mt-1">
            {items.length}
          </p>
          <p className="text-xs text-[#655a53] dark:text-[#b8aea4] mt-1">
            Ukończone: {completedItems} / {items.length}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#877b72] dark:text-[#8e8379]">
            Wszystkie warianty
          </p>
          <p className="text-2xl font-serif text-[#c84b31] dark:text-[#e56b4e] mt-1">
            {totalVariants}
          </p>
          <p className="text-xs text-[#655a53] dark:text-[#b8aea4] mt-1">
            Formaty × Rynki językowe
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#877b72] dark:text-[#8e8379]">
            Oszczędność API (Smart Crop)
          </p>
          <p className="text-2xl font-serif text-[#1d6346] dark:text-[#75d9ae] mt-1">
            -66.7%
          </p>
          <p className="text-xs text-[#655a53] dark:text-[#b8aea4] mt-1">
            Tylko 1 bazowy render na MDK
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#877b72] dark:text-[#8e8379]">
            Status kolejki
          </p>
          <p className="text-lg font-medium text-[#1c1816] dark:text-[#f7f3ec] mt-1 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isProcessing
                  ? "bg-[#1d6346] dark:bg-[#75d9ae] animate-pulse"
                  : "bg-[#877b72] dark:text-[#8e8379]"
              }`}
            />
            {isProcessing ? "Przetwarzanie..." : "Gotowa do startu"}
          </p>
          <p className="text-xs text-[#655a53] dark:text-[#b8aea4] mt-1">
            Silnik: Seedance 2.0 + ElevenLabs
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#211d1a] p-3 rounded-xl border border-[#dfd5c6] dark:border-[#38302b]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#877b72] dark:text-[#8e8379]">Szukaj:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj MDK lub nazwy produktu..."
            className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] focus:outline-none focus:border-[#c84b31]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#877b72] dark:text-[#8e8379]">Filtruj rynek:</span>
          {["ALL", "PL", "DE", "CZ", "RO", "HU"].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMarket(m)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                filterMarket === m
                  ? "bg-[#c84b31] dark:bg-[#e56b4e] text-white"
                  : "bg-[#faf7f2] dark:bg-[#1a1714] text-[#655a53] dark:text-[#b8aea4] hover:bg-[#f2ece1] dark:hover:bg-[#292420]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Table */}
      <div className="rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf7f2] dark:bg-[#1a1714] border-b border-[#dfd5c6] dark:border-[#38302b] text-[#877b72] dark:text-[#8e8379] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Kod MDK</th>
                <th className="py-3 px-4">Produkt & Kategoria</th>
                <th className="py-3 px-4">Rynki docelowe</th>
                <th className="py-3 px-4">Formaty</th>
                <th className="py-3 px-4">Status PCM</th>
                <th className="py-3 px-4">Postęp</th>
                <th className="py-3 px-4 text-right">Akcja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfd5c6] dark:divide-[#38302b]">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#faf7f2]/60 dark:hover:bg-[#1a1714]/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-[#c84b31] dark:text-[#e56b4e]">
                    {item.mdk}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-[#1c1816] dark:text-[#f7f3ec]">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[#877b72] dark:text-[#8e8379]">
                      {item.category}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.markets.map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#f2ece1] dark:bg-[#292420] text-[#655a53] dark:text-[#b8aea4]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex gap-1 text-[11px] font-mono">
                      {item.formats.map((f) => (
                        <span
                          key={f}
                          className="px-1.5 py-0.5 rounded bg-[#f6f1e8] dark:bg-[#1a1714] border border-[#dfd5c6] dark:border-[#38302b] text-[#655a53] dark:text-[#b8aea4]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.pcmStatus === "ready" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#1d6346] dark:text-[#75d9ae]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1d6346] dark:bg-[#75d9ae]" />
                        Zsynchronizowane
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8f4f0e] dark:text-[#f5bc7a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8f4f0e] dark:bg-[#f5bc7a]" />
                        Brak mediów PCM
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-[#f2ece1] dark:bg-[#292420] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.progress === 100
                              ? "bg-[#1d6346] dark:bg-[#75d9ae]"
                              : "bg-[#c84b31] dark:bg-[#e56b4e]"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#877b72] dark:text-[#8e8379] w-8 text-right">
                        {item.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? {
                                  ...i,
                                  status: (i.status === "completed" ? "queued" : "completed") as "queued" | "completed",
                                  progress: i.status === "completed" ? 0 : 100,
                                }
                              : i
                          )
                        );
                        addLog(`Przełączono status dla ${item.mdk}`);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded border border-[#dfd5c6] dark:border-[#38302b] hover:bg-[#faf7f2] dark:hover:bg-[#1a1714] text-[#655a53] dark:text-[#b8aea4] transition-colors"
                    >
                      {item.status === "completed" ? "Resetuj" : "Oznacz gotowe"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Log Console */}
      <div className="p-4 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-[#1a1714] text-[#f7f3ec] shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#38302b] pb-2 mb-3">
          <span className="flex items-center gap-2 text-[#75d9ae]">
            <span className="w-2 h-2 rounded-full bg-[#75d9ae] animate-pulse" />
            Dziennik operacji wsadowych (Batch Live Log)
          </span>
          <button
            onClick={() => setLogMessages([])}
            className="text-[10px] text-[#8e8379] hover:text-[#f7f3ec] transition-colors"
          >
            Wyczyść log
          </button>
        </div>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2 text-[#b8aea4]">
          {logMessages.length === 0 ? (
            <p className="text-[#8e8379] italic">Brak nowych zdarzeń.</p>
          ) : (
            logMessages.map((msg, idx) => (
              <p key={idx} className={idx === 0 ? "text-[#f7f3ec]" : ""}>
                {msg}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
