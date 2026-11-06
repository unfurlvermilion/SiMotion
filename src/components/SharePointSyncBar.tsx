"use client";

import React, { useState, useEffect } from "react";

interface SharePointSyncBarProps {
  onSyncComplete?: (data: any) => void;
}

export default function SharePointSyncBar({ onSyncComplete }: SharePointSyncBarProps) {
  const [sharepointUrl, setSharepointUrl] = useState<string>(
    "https://firma.sharepoint.com/:x:/r/sites/FashionStudio/Shared%20Documents/Kolekcja_FW26_Statusy.xlsx?web=1"
  );
  const [sheetName, setSheetName] = useState<string>("Statusy_Wideo");
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);
  const [syncIntervalSec, setSyncIntervalSec] = useState<number>(30);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [syncCount, setSyncCount] = useState<number>(0);

  // Load saved config
  useEffect(() => {
    const savedUrl = localStorage.getItem("simotion_sharepoint_url");
    const savedSheet = localStorage.getItem("simotion_sharepoint_sheet");
    const savedAuto = localStorage.getItem("simotion_sharepoint_autosync");
    if (savedUrl) setSharepointUrl(savedUrl);
    if (savedSheet) setSheetName(savedSheet);
    if (savedAuto !== null) setIsAutoSync(savedAuto === "true");

    // Initial sync
    triggerSync();
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/spreadsheet?url=${encodeURIComponent(sharepointUrl)}`);
      const data = await res.json();
      setLastSyncTime(data.displayTime || new Date().toLocaleTimeString("pl-PL"));
      setSyncCount((prev) => prev + 1);
      if (onSyncComplete) {
        onSyncComplete(data);
      }
    } catch (err) {
      console.error("SharePoint sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Background Auto-Sync
  useEffect(() => {
    if (!isAutoSync) return;
    const interval = setInterval(() => {
      triggerSync();
    }, syncIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [isAutoSync, syncIntervalSec, sharepointUrl]);

  const saveSettings = () => {
    localStorage.setItem("simotion_sharepoint_url", sharepointUrl);
    localStorage.setItem("simotion_sharepoint_sheet", sheetName);
    localStorage.setItem("simotion_sharepoint_autosync", String(isAutoSync));
    setIsSettingsOpen(false);
    triggerSync();
  };

  const downloadExcelTemplate = () => {
    const csvContent =
      "MDK,Nazwa_Produktu,Kategoria,Rynki,Formaty,Status_Produkcji,Link_Wideo,Ostatnia_Zmiana\n" +
      "001KR-83X,Jedwab & Kaszmir — Płaszcz Camel,Outerwear / Premium,PL+DE+CZ+RO+HU,9:16+4:5+1:1,Zatwierdzony,https://si-motion.vercel.app/preview/001KR-83X.mp4,2026-11-06 08:30\n" +
      "002KR-91Y,Koszula Silk Minimalist Ecru,Shirts / Atelier,PL+DE+RO,9:16+4:5,W trakcie renderu,,2026-11-06 09:12\n" +
      "003KR-14A,Spodnie Wide Leg Wool Taupe,Pants / Sartorial,PL+DE+CZ,9:16+1:1,Czeka na packshot PCM,,2026-11-06 09:45\n" +
      "004KR-55C,Sukienka Maxi Velvet Burgundy,Dresses / Evening,PL+DE+CZ+RO+HU,9:16+4:5+1:1,Kolejka batchowa,,2026-11-06 10:05\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Szablon_Excel_SharePoint_SiMotion.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Top Bar Indicator Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] hover:border-[#c84b31] dark:hover:border-[#e56b4e] transition-colors shadow-sm"
          title="Kliknij, aby skonfigurować połączenie ze skoroszytem SharePoint"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSyncing
                ? "bg-[#c84b31] animate-ping"
                : isAutoSync
                ? "bg-[#1d6346] dark:bg-[#75d9ae]"
                : "bg-[#877b72]"
            }`}
          />
          <span className="text-[#1c1816] dark:text-[#f7f3ec] font-semibold hidden md:inline">
            SharePoint Excel:
          </span>
          <span className="text-[#655a53] dark:text-[#b8aea4]">
            {isSyncing ? "Pobieranie..." : lastSyncTime ? `Zsynchronizowano: ${lastSyncTime}` : "Połączono"}
          </span>
          <span className="text-[10px] text-[#877b72] dark:text-[#8e8379] bg-[#f2ece1] dark:bg-[#292420] px-1.5 py-0.5 rounded">
            ⚙ Ustawienia
          </span>
        </button>

        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="p-1.5 rounded-full border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] hover:bg-[#faf7f2] dark:hover:bg-[#292420] text-[#1c1816] dark:text-[#f7f3ec] text-xs transition-colors shadow-sm disabled:opacity-50"
          title="Wymuś synchronizację z SharePoint teraz"
        >
          <span className={`inline-block ${isSyncing ? "animate-spin" : ""}`}>↻</span>
        </button>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[#38302b] bg-[#1a1714] text-[#f7f3ec] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#38302b] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#193328] text-[#75d9ae] grid place-items-center font-bold text-sm">
                  ⊞
                </span>
                <div>
                  <h3 className="font-serif text-lg text-[#f7f3ec]">
                    Połączenie z Microsoft SharePoint / Excel Online
                  </h3>
                  <p className="text-xs text-[#b8aea4]">
                    Automatyczna, stała synchronizacja zleceń wideo z Twoim arkuszem w chmurze
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#8e8379] hover:text-[#f7f3ec] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#b8aea4] block font-medium">
                  Link do skoroszytu Excel na SharePoint / OneDrive:
                </label>
                <input
                  type="text"
                  value={sharepointUrl}
                  onChange={(e) => setSharepointUrl(e.target.value)}
                  placeholder="https://twojadomena.sharepoint.com/:x:/r/sites/.../Plik.xlsx?web=1"
                  className="w-full px-3 py-2 rounded-xl border border-[#38302b] bg-[#211d1a] text-[#f7f3ec] font-mono text-[11px] focus:outline-none focus:border-[#e56b4e]"
                />
                <p className="text-[10px] text-[#8e8379]">
                  Wklej link z opcji <em>Udostępnij / Kopiuj link</em> ze swojego Excela w SharePoint.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#b8aea4] block font-medium">
                    Nazwa arkusza (zakładki):
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#38302b] bg-[#211d1a] text-[#f7f3ec]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#b8aea4] block font-medium">
                    Częstotliwość Auto-Sync w tle:
                  </label>
                  <select
                    value={syncIntervalSec}
                    onChange={(e) => setSyncIntervalSec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#38302b] bg-[#211d1a] text-[#f7f3ec]"
                  >
                    <option value={15}>Co 15 sekund (Na żywo)</option>
                    <option value={30}>Co 30 sekund (Rekomendowane)</option>
                    <option value={60}>Co 1 minutę</option>
                    <option value={300}>Co 5 minut</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#38302b] bg-[#211d1a] flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#f7f3ec]">Automatyczna synchronizacja w tle</p>
                  <p className="text-[11px] text-[#8e8379]">
                    Pobiera zmiany z SharePoint bez konieczności odświeżania strony
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isAutoSync}
                  onChange={(e) => setIsAutoSync(e.target.checked)}
                  className="w-4 h-4 accent-[#c84b31]"
                />
              </div>

              <div className="p-3 rounded-xl border border-[#193328] bg-[#193328]/40 text-[#75d9ae] flex items-center justify-between">
                <div>
                  <p className="font-medium">Potrzebujesz wzorca kolumn?</p>
                  <p className="text-[11px] text-[#b8aea4]">
                    Pobierz gotowy plik CSV ze strukturą kolumn (MDK, Nazwa, Rynki, Status) do wgrania na SharePoint.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="px-3 py-1.5 rounded-lg bg-[#193328] hover:bg-[#1d6346] border border-[#75d9ae]/30 text-white font-medium text-xs transition-colors whitespace-nowrap"
                >
                  ↓ Pobierz szablon
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#38302b] pt-4">
              <span className="text-[11px] text-[#8e8379]">
                Liczba wykonanych synchronizacji: <strong>{syncCount}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#b8aea4] hover:text-[#f7f3ec]"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveSettings}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#c84b31] hover:bg-[#e56b4e] text-white transition-colors"
                >
                  Zapisz i połącz na stałe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
