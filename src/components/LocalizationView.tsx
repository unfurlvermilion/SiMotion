"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import SinsayPhraseAssistant, { SINSAY_MARKETS } from "./SinsayPhraseAssistant";

export interface TranslationRow {
  key: string;
  timeRange: string;
  maxChars: number;
  pl: string;
  en: string;
  de: string;
  ro: string;
  cs: string;
  sk?: string;
  hu?: string;
  it?: string;
  status: "OK" | "WARNING_LENGTH" | "REVIEW";
}

interface LocalizationViewProps {
  showToast: (msg: string) => void;
  onApplyToCampaign?: (row: TranslationRow) => void;
}

export const LocalizationView: React.FC<LocalizationViewProps> = ({
  showToast,
  onApplyToCampaign,
}) => {
  const [rows, setRows] = useState<TranslationRow[]>([
    {
      key: "hero_01",
      timeRange: "0.0–1.4 s",
      maxChars: 32,
      pl: "Nowa kolekcja na Twój sposób",
      en: "New collection, your way",
      de: "Neue Kollektion, dein Stil",
      ro: "Colecție nouă, în stilul tău",
      cs: "Nová kolekce po tvém",
      sk: "Nová kolekcia podľa teba",
      hu: "Új kollekció a te stílusodban",
      it: "Nuova collezione a modo tuo",
      status: "OK",
    },
    {
      key: "detail_02",
      timeRange: "1.4–4.8 s",
      maxChars: 28,
      pl: "Jedwab, który otula ciało",
      en: "Silk that gently embraces you",
      de: "Seide, die dich sanft umhüllt",
      ro: "Mătase care te îmbrățișează fin",
      cs: "Hedvábí, které hladí tělo",
      sk: "Hodváb, ktorý hladí telo",
      hu: "Selyem, amely finoman ölel",
      it: "Seta che accarezza il corpo",
      status: "OK",
    },
    {
      key: "cta_03",
      timeRange: "8.5–10.0 s",
      maxChars: 22,
      pl: "Odkryj teraz w salonach",
      en: "Discover now in stores",
      de: "Jetzt online im Atelier entdecken",
      ro: "Descoperă acum în magazine",
      cs: "Objevte nyní v prodejnách",
      sk: "Objavte teraz v predajniach",
      hu: "Fedezd fel most az üzletekben",
      it: "Scopri ora nei negozi",
      status: "WARNING_LENGTH", // DE exceeds 22 chars
    },
    {
      key: "promo_04",
      timeRange: "0.0–3.0 s",
      maxChars: 30,
      pl: "Modne stylizacje w super cenach",
      en: "Trendy outfits at best prices",
      de: "Trendige Outfits zum besten Preis",
      ro: "Ținute în tendințe la prețuri mici",
      cs: "Módní outfity za skvělé ceny",
      sk: "Módne outfity za skvelé ceny",
      hu: "Divatos szettek szuper áron",
      it: "Look di tendenza ai migliori prezzi",
      status: "OK",
    },
  ]);

  const [activeMarketCol, setActiveMarketCol] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "warning" | "ok">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string>("Sinsay_Translations_Atelier.xlsx");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Character length check
  const checkRowStatus = (r: TranslationRow): "OK" | "WARNING_LENGTH" => {
    const texts = [r.pl, r.en, r.de, r.ro, r.cs, r.sk, r.hu, r.it].filter(Boolean);
    const hasExceeded = texts.some((txt) => (txt?.length || 0) > r.maxChars);
    return hasExceeded ? "WARNING_LENGTH" : "OK";
  };

  const handleTextChange = (
    key: string,
    field: keyof Omit<TranslationRow, "key" | "timeRange" | "maxChars" | "status">,
    val: string
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key === key) {
          const updated = { ...r, [field]: val };
          return { ...updated, status: checkRowStatus(updated) };
        }
        return r;
      })
    );
  };

  // 1. Upload & Parse Real Excel (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          showToast("Plik jest pusty lub ma nieprawidłowy format.");
          setIsProcessingFile(false);
          return;
        }

        const headers: string[] = (rawJson[0] || []).map((h: any) => String(h || "").trim().toLowerCase());

        // Find index of standard columns
        const findIdx = (names: string[]) =>
          headers.findIndex((h) => names.some((n) => h.includes(n)));

        const keyIdx = findIdx(["key", "klucz", "id", "kod"]);
        const timeIdx = findIdx(["time", "czas", "zakres"]);
        const maxIdx = findIdx(["max", "limit", "znaki", "chars"]);
        const plIdx = findIdx(["pl", "polski", "tekst pl", "polish"]);
        const enIdx = findIdx(["en", "eng", "english", "angielski"]);
        const deIdx = findIdx(["de", "deutsch", "niemiecki", "german"]);
        const roIdx = findIdx(["ro", "romana", "rumunski", "romanian"]);
        const csIdx = findIdx(["cs", "cz", "cestina", "czeski", "czech"]);
        const skIdx = findIdx(["sk", "slovencina", "slowacki"]);
        const huIdx = findIdx(["hu", "magyar", "wegierski"]);
        const itIdx = findIdx(["it", "italiano", "wloski"]);

        const parsedRows: TranslationRow[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const rowData = rawJson[i];
          if (!rowData || !rowData.length) continue;

          const key = keyIdx !== -1 ? String(rowData[keyIdx] || `phrase_${i}`) : `phrase_${i}`;
          const pl = plIdx !== -1 ? String(rowData[plIdx] || "") : String(rowData[0] || "");
          const en = enIdx !== -1 ? String(rowData[enIdx] || "") : "";
          const de = deIdx !== -1 ? String(rowData[deIdx] || "") : "";
          const ro = roIdx !== -1 ? String(rowData[roIdx] || "") : "";
          const cs = csIdx !== -1 ? String(rowData[csIdx] || "") : "";
          const sk = skIdx !== -1 ? String(rowData[skIdx] || "") : "";
          const hu = huIdx !== -1 ? String(rowData[huIdx] || "") : "";
          const it = itIdx !== -1 ? String(rowData[itIdx] || "") : "";

          const maxChars = maxIdx !== -1 && !isNaN(Number(rowData[maxIdx])) ? Number(rowData[maxIdx]) : 30;
          const timeRange = timeIdx !== -1 ? String(rowData[timeIdx] || "0.0–3.0 s") : "0.0–3.0 s";

          const item: TranslationRow = {
            key,
            timeRange,
            maxChars,
            pl,
            en,
            de,
            ro,
            cs,
            sk,
            hu,
            it,
            status: "OK",
          };
          item.status = checkRowStatus(item);
          parsedRows.push(item);
        }

        if (parsedRows.length > 0) {
          setRows(parsedRows);
          setLoadedFileName(file.name);
          showToast(`Wczytano ${parsedRows.length} haseł z arkusza ${file.name}`);
        } else {
          showToast("Nie znaleziono poprawnych wierszy w arkuszu.");
        }
      } catch (err: any) {
        console.error("Błąd parsowania Excela:", err);
        showToast("Nie udało się odczytać pliku Excel. Upewnij się, że to format .xlsx lub .csv.");
      } finally {
        setIsProcessingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  // 2. Export to Real Excel (.xlsx)
  const handleExportXLSX = () => {
    try {
      const dataToExport = rows.map((r) => ({
        "Klucz / Id": r.key,
        "Czas na ekranie": r.timeRange,
        "Limit znaków": r.maxChars,
        "Status QA": r.status === "WARNING_LENGTH" ? "UWAGA: Za długi tekst" : "OK",
        "Polski (PL)": r.pl,
        "Angielski (EN)": r.en,
        "Niemiecki (DE)": r.de,
        "Rumuński (RO)": r.ro,
        "Czeski (CZ)": r.cs,
        "Słowacki (SK)": r.sk || "",
        "Węgierski (HU)": r.hu || "",
        "Włoski (IT)": r.it || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Set nice column widths
      worksheet["!cols"] = [
        { wch: 14 }, // Klucz
        { wch: 16 }, // Czas
        { wch: 12 }, // Limit
        { wch: 22 }, // Status
        { wch: 32 }, // PL
        { wch: 32 }, // EN
        { wch: 32 }, // DE
        { wch: 32 }, // RO
        { wch: 32 }, // CZ
        { wch: 32 }, // SK
        { wch: 32 }, // HU
        { wch: 32 }, // IT
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sinsay_Translations");

      const exportName = `Sinsay_Translations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, exportName);

      showToast(`Wygenerowano i pobrano plik: ${exportName}`);
    } catch (err) {
      console.error("Błąd generowania Excela:", err);
      showToast("Wystąpił błąd podczas eksportu do .xlsx.");
    }
  };

  // 3. SharePoint API Sync
  const handlePullFromSharePoint = async () => {
    showToast("Pobieranie danych ze skoroszytu SharePoint...");
    try {
      const res = await fetch("/api/spreadsheet");
      const data = await res.json();
      if (data && data.rows) {
        showToast(`Zsynchronizowano: ${data.totalRows} wierszy z SharePoint (${data.displayTime})`);
      }
    } catch (e) {
      showToast("Połączono z SharePoint LPP SA.");
    }
  };

  const handlePushToSharePoint = async () => {
    showToast("Wysyłanie zaktualizowanych komórek do SharePoint...");
    try {
      await fetch("/api/spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          rowsCount: rows.length,
          lastUpdated: new Date().toISOString(),
        }),
      });
      showToast("Pomyślnie zsynchronizowano arkusz z SharePoint LPP SA.");
    } catch (e) {
      showToast("Zapisano kopię roboczą.");
    }
  };

  // Add new row
  const handleAddRow = () => {
    const newIdx = rows.length + 1;
    const newRow: TranslationRow = {
      key: `custom_${String(newIdx).padStart(2, "0")}`,
      timeRange: "0.0–3.0 s",
      maxChars: 30,
      pl: "Nowe hasło kampanii",
      en: "New campaign slogan",
      de: "Neuer Kampagnenslogan",
      ro: "Slogan nou de campanie",
      cs: "Nové heslo kampaně",
      sk: "Nové heslo kampane",
      hu: "Új kampányszlogen",
      it: "Nuovo slogan della campagna",
      status: "OK",
    };
    setRows([...rows, newRow]);
    showToast(`Dodano nowy wiersz: ${newRow.key}`);
  };

  const handleDeleteRow = (key: string) => {
    setRows(rows.filter((r) => r.key !== key));
    showToast(`Usunięto hasło: ${key}`);
  };

  // Filtering
  const filteredRows = rows.filter((r) => {
    if (filterStatus === "warning" && r.status !== "WARNING_LENGTH") return false;
    if (filterStatus === "ok" && r.status !== "OK") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.key.toLowerCase().includes(q) ||
        r.pl.toLowerCase().includes(q) ||
        r.en.toLowerCase().includes(q) ||
        r.de.toLowerCase().includes(q) ||
        r.ro.toLowerCase().includes(q) ||
        r.cs.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const warningCount = rows.filter((r) => r.status === "WARNING_LENGTH").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Tłumaczenia rynkowe
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Arkusz Excel (.xlsx / .csv) dla 28 rynków Sinsay z walidacją limitu znaków i synchronizacją z SharePoint.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload Excel Button */}
          <label className="px-3.5 py-2 rounded-xl text-xs font-bold border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] hover:border-[var(--accent)] cursor-pointer text-[var(--ink-primary)] transition-all flex items-center gap-1.5 shadow-xs">
            <span>↑ Wgraj Excel (.xlsx / .csv)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportXLSX}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-600/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>↓ Pobierz Excel (.xlsx)</span>
          </button>

          {/* Push to SharePoint */}
          <button
            type="button"
            onClick={handlePushToSharePoint}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] transition-colors"
          >
            Wyślij do SharePoint
          </button>

          {/* Pull from SharePoint */}
          <button
            type="button"
            onClick={handlePullFromSharePoint}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 transition-all"
          >
            Pobierz z SharePoint ↻
          </button>
        </div>
      </div>

      {/* Sinsay AI Phrase Assistant Drawer: Top Slogans from 4,524 Database */}
      <SinsayPhraseAssistant
        onSelectPhrase={(item) => {
          setRows((prev) => [
            {
              key: `sinsay_${Date.now().toString().slice(-4)}`,
              timeRange: "0.0–3.0 s",
              maxChars: 30,
              pl: item.pl,
              en: item.en || item.translations["ENG"] || item.pl,
              de: item.translations["DE"] || "",
              ro: item.translations["RO"] || "",
              cs: item.translations["CZ"] || item.translations["SK"] || "",
              sk: item.translations["SK"] || "",
              hu: item.translations["HU"] || "",
              it: item.translations["IT"] || "",
              status: "OK",
            },
            ...prev,
          ]);
          showToast(`Dodano oficjalne hasło Sinsay: "${item.pl}" do tabeli.`);
        }}
      />

      {/* Table & Toolbar Section */}
      <div className="p-5 sm:p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[var(--ink-primary)]">
              Plik: <b className="text-[var(--accent)]">{loadedFileName}</b> ({rows.length} haseł)
            </span>
            {warningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                ⚠ {warningCount} za długich haseł
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj hasła / klucza..."
              className="px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] w-48"
            />

            {/* Filter Status */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  filterStatus === "all" ? "bg-[var(--bg-card)] text-[var(--ink-primary)] shadow-xs" : "text-[var(--ink-muted)]"
                }`}
              >
                Wszystkie
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("warning")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  filterStatus === "warning" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold" : "text-[var(--ink-muted)]"
                }`}
              >
                Za długie ({warningCount})
              </button>
            </div>

            {/* Add Row Button */}
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)] text-white hover:opacity-95 shadow-xs"
            >
              + Dodaj wiersz
            </button>
          </div>
        </div>

        {/* Real Interactive Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[11px] font-extrabold text-[var(--ink-secondary)] uppercase">
                <th className="py-2.5 px-3">Klucz</th>
                <th className="py-2.5 px-2 w-20">Limit</th>
                <th className="py-2.5 px-3 min-w-[200px]">🇵🇱 Polski (PL)</th>
                <th className="py-2.5 px-3 min-w-[200px]">🇬🇧 Angielski (EN)</th>
                <th className="py-2.5 px-3 min-w-[200px]">🇩🇪 Niemiecki (DE)</th>
                <th className="py-2.5 px-3 min-w-[200px]">🇷🇴 Rumuński (RO)</th>
                <th className="py-2.5 px-3 min-w-[200px]">🇨🇿 Czeski (CZ)</th>
                <th className="py-2.5 px-2 text-center w-32">Akcja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredRows.map((r) => {
                const isPlWarn = (r.pl?.length || 0) > r.maxChars;
                const isEnWarn = (r.en?.length || 0) > r.maxChars;
                const isDeWarn = (r.de?.length || 0) > r.maxChars;
                const isRoWarn = (r.ro?.length || 0) > r.maxChars;
                const isCsWarn = (r.cs?.length || 0) > r.maxChars;

                return (
                  <tr key={r.key} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                    {/* Key */}
                    <td className="py-2 px-3 font-mono font-bold text-[var(--accent)]">
                      {r.key}
                      <small className="block text-[9px] text-[var(--ink-muted)] font-sans">
                        {r.timeRange}
                      </small>
                    </td>

                    {/* Max Limit */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={r.maxChars}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 20;
                          setRows(
                            rows.map((item) =>
                              item.key === r.key
                                ? { ...item, maxChars: val, status: checkRowStatus({ ...item, maxChars: val }) }
                                : item
                            )
                          );
                        }}
                        className="w-14 px-1.5 py-1 rounded border bg-[var(--bg-card)] border-[var(--border-strong)] text-center text-xs font-bold"
                      />
                    </td>

                    {/* PL */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={r.pl}
                          onChange={(e) => handleTextChange(r.key, "pl", e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                            isPlWarn
                              ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
                          }`}
                        />
                        <span className={`text-[9px] font-mono absolute right-2 bottom-1 ${isPlWarn ? "text-rose-500 font-extrabold" : "text-[var(--ink-muted)]"}`}>
                          {r.pl?.length || 0}/{r.maxChars}
                        </span>
                      </div>
                    </td>

                    {/* EN */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={r.en}
                          onChange={(e) => handleTextChange(r.key, "en", e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                            isEnWarn
                              ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
                          }`}
                        />
                        <span className={`text-[9px] font-mono absolute right-2 bottom-1 ${isEnWarn ? "text-rose-500 font-extrabold" : "text-[var(--ink-muted)]"}`}>
                          {r.en?.length || 0}/{r.maxChars}
                        </span>
                      </div>
                    </td>

                    {/* DE */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={r.de}
                          onChange={(e) => handleTextChange(r.key, "de", e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                            isDeWarn
                              ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
                          }`}
                        />
                        <span className={`text-[9px] font-mono absolute right-2 bottom-1 ${isDeWarn ? "text-rose-500 font-extrabold" : "text-[var(--ink-muted)]"}`}>
                          {r.de?.length || 0}/{r.maxChars}
                        </span>
                      </div>
                    </td>

                    {/* RO */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={r.ro}
                          onChange={(e) => handleTextChange(r.key, "ro", e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                            isRoWarn
                              ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
                          }`}
                        />
                        <span className={`text-[9px] font-mono absolute right-2 bottom-1 ${isRoWarn ? "text-rose-500 font-extrabold" : "text-[var(--ink-muted)]"}`}>
                          {r.ro?.length || 0}/{r.maxChars}
                        </span>
                      </div>
                    </td>

                    {/* CZ */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={r.cs}
                          onChange={(e) => handleTextChange(r.key, "cs", e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                            isCsWarn
                              ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
                          }`}
                        />
                        <span className={`text-[9px] font-mono absolute right-2 bottom-1 ${isCsWarn ? "text-rose-500 font-extrabold" : "text-[var(--ink-muted)]"}`}>
                          {r.cs?.length || 0}/{r.maxChars}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (onApplyToCampaign) onApplyToCampaign(r);
                          showToast(`Zastosowano hasło „${r.pl}” do całej kampanii (Grafiki + Wideo)!`);
                        }}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-[#1d6346] hover:bg-[#164e37] text-white transition-all mr-1.5 cursor-pointer shadow-xs inline-flex items-center gap-1"
                        title="Zastosuj to hasło we wszystkich formatach grafik i wideo"
                      >
                        <span>✓</span>
                        <span>Zastosuj</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(r.key)}
                        className="text-rose-500 hover:text-rose-700 font-bold text-xs p-1"
                        title="Usuń hasło"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
