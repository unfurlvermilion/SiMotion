"use client";

import React, { useState } from "react";

export interface SinsayMarket {
  code: string;
  name: string;
  flag: string;
  region: "CEE" | "SEE / Bałkany" | "Zachód & Południe" | "Kraje Bałtyckie" | "Wschód & Azja";
}

export const SINSAY_MARKETS: SinsayMarket[] = [
  // CEE
  { code: "PL", name: "Polska", flag: "🇵🇱", region: "CEE" },
  { code: "RO", name: "Rumunia", flag: "🇷🇴", region: "CEE" },
  { code: "CZ", name: "Czechy", flag: "🇨🇿", region: "CEE" },
  { code: "SK", name: "Słowacja", flag: "🇸🇰", region: "CEE" },
  { code: "HU", name: "Węgry", flag: "🇭🇺", region: "CEE" },
  // Zachód & Południe
  { code: "DE", name: "Niemcy", flag: "🇩🇪", region: "Zachód & Południe" },
  { code: "IT", name: "Włochy", flag: "🇮🇹", region: "Zachód & Południe" },
  { code: "GR", name: "Grecja", flag: "🇬🇷", region: "Zachód & Południe" },
  { code: "ENG", name: "Angielski (Global)", flag: "🇬🇧", region: "Zachód & Południe" },
  // SEE / Bałkany
  { code: "HR", name: "Chorwacja", flag: "🇭🇷", region: "SEE / Bałkany" },
  { code: "BG", name: "Bułgaria", flag: "🇧🇬", region: "SEE / Bałkany" },
  { code: "SI", name: "Słowenia", flag: "🇸🇮", region: "SEE / Bałkany" },
  { code: "RS", name: "Serbia", flag: "🇷🇸", region: "SEE / Bałkany" },
  { code: "BA", name: "Bośnia i Hercegowina", flag: "🇧🇦", region: "SEE / Bałkany" },
  { code: "MK", name: "Macedonia Płn.", flag: "🇲🇰", region: "SEE / Bałkany" },
  { code: "AL", name: "Albania", flag: "🇦🇱", region: "SEE / Bałkany" },
  { code: "XK", name: "Kosowo", flag: "🇽🇰", region: "SEE / Bałkany" },
  // Kraje Bałtyckie
  { code: "LT", name: "Litwa", flag: "🇱🇹", region: "Kraje Bałtyckie" },
  { code: "LV", name: "Łotwa", flag: "🇱🇻", region: "Kraje Bałtyckie" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", region: "Kraje Bałtyckie" },
  { code: "FI", name: "Finlandia", flag: "🇫🇮", region: "Kraje Bałtyckie" },
  // Wschód & Azja
  { code: "UA", name: "Ukraina", flag: "🇺🇦", region: "Wschód & Azja" },
  { code: "KZ", name: "Kazachstan", flag: "🇰🇿", region: "Wschód & Azja" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", region: "Wschód & Azja" },
  { code: "AZ", name: "Azerbejdżan", flag: "🇦🇿", region: "Wschód & Azja" },
  { code: "MD", name: "Mołdawia", flag: "🇲🇩", region: "Wschód & Azja" },
  { code: "GE", name: "Gruzja", flag: "🇬🇪", region: "Wschód & Azja" },
  { code: "BY", name: "Białoruś", flag: "🇧🇾", region: "Wschód & Azja" },
];

export interface SinsayMatchItem {
  id: string;
  pl: string;
  en: string;
  score: number;
  category: string;
  translations: Record<string, string>;
}

interface SinsayPhraseAssistantProps {
  onSelectPhrase?: (phrase: SinsayMatchItem) => void;
  currentPrompt?: string;
}

export default function SinsayPhraseAssistant({
  onSelectPhrase,
  currentPrompt = "",
}: SinsayPhraseAssistantProps) {
  const [query, setQuery] = useState<string>(
    currentPrompt || "Jedwabna sukienka na wieczór, elegancka nowa kolekcja"
  );
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<SinsayMatchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SinsayMatchItem | null>(null);
  const [selectedMarketCode, setSelectedMarketCode] = useState<string>("RO");
  const [isFullMatrixOpen, setIsFullMatrixOpen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    setIsSearching(true);
    const q = searchQuery !== undefined ? searchQuery : query;
    try {
      const res = await fetch("/api/sinsay-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 20 }),
      });
      const data = await res.json();
      if (data && data.results) {
        setResults(data.results);
        if (data.results.length > 0) {
          setSelectedItem(data.results[0]);
        }
      }
    } catch (err) {
      console.error("Sinsay matching error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    const cleanName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .toLowerCase();

    const inferredQuery = `${cleanName} nowości trendy moda sinsay`;
    setQuery(inferredQuery);
    handleSearch(inferredQuery);
  };

  const activeMarket =
    SINSAY_MARKETS.find((m) => m.code === selectedMarketCode) || SINSAY_MARKETS[1];

  const activeTranslation = selectedItem
    ? selectedItem.translations[selectedMarketCode] ||
      selectedItem.translations["ENG"] ||
      selectedItem.pl
    : "";

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dfd5c6] dark:border-[#38302b] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c84b31] to-[#6e1d2f] text-white font-serif font-bold text-lg grid place-items-center shadow-md">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec]">
                Asystent Haseł Sinsay (Top 20 Rekomendacji AI)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae]">
                4 524 haseł · 28 rynków
              </span>
            </div>
            <p className="text-xs text-[#655a53] dark:text-[#b8aea4]">
              Wpisz prompt wideo lub wgraj packshot produktu – algorytm dopasuje 20 najbardziej trafnych haseł z matrycy Sinsay.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={isSearching}
          className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#c84b31] dark:bg-[#e56b4e] hover:opacity-90 disabled:opacity-50 text-white shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Dopasowywanie 20 haseł...</span>
            </>
          ) : (
            <span>✦ Znajdź 20 haseł Sinsay</span>
          )}
        </button>
      </div>

      {/* Input Row: Prompt / Features & Image Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prompt Input */}
        <div className="lg:col-span-2 space-y-2">
          <label className="text-xs font-medium text-[#1c1816] dark:text-[#f7f3ec] block">
            Prompt wideo, cechy produktu lub opis kampanii:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="np. jedwabna sukienka koktajlowa, jesienny camelowy płaszcz, nowości w super cenie..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-xs text-[#1c1816] dark:text-[#f7f3ec] focus:outline-none focus:border-[#c84b31]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-[#877b72] dark:text-[#8e8379] mr-1">Szybkie presety:</span>
            {[
              "Nowości w najlepszych cenach",
              "Dla Niej · Sukienki & Elegancja",
              "Otul się ciepłem · Płaszcze & Swetry",
              "Specjalnie dla Ciebie",
              "Wielka wyprzedaż sezonowa",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setQuery(preset);
                  handleSearch(preset);
                }}
                className="px-2.5 py-0.5 rounded-lg text-[11px] bg-[#f2ece1] dark:bg-[#292420] text-[#655a53] dark:text-[#b8aea4] hover:text-[#1c1816] dark:hover:text-[#f7f3ec] transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Image Packshot Drop / Upload */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#1c1816] dark:text-[#f7f3ec] block">
            Lub przeciągnij zdjęcie packshotu / lookbooku:
          </label>
          <label className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-[#bfa890] dark:border-[#5c4d42] bg-[#faf7f2]/70 dark:bg-[#1a1714]/60 hover:bg-[#f2ece1] dark:hover:bg-[#211d1a] cursor-pointer transition-colors">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Uploaded packshot"
                className="w-12 h-12 object-cover rounded-lg border border-[#dfd5c6] dark:border-[#38302b]"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#f2ece1] dark:bg-[#292420] text-[#877b72] dark:text-[#8e8379] grid place-items-center text-xl">
                📷
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1c1816] dark:text-[#f7f3ec] truncate">
                {uploadedImageName || "Wybierz plik ze zdjęciem"}
              </p>
              <p className="text-[10px] text-[#877b72] dark:text-[#8e8379]">
                PNG, JPG · Analiza cech i kolorystyki
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Results View: Left Top 20 list, Right Details Preview */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-[#dfd5c6] dark:border-[#38302b]">
          {/* Top 20 List (6 columns) */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#877b72] dark:text-[#8e8379]">
                Top 20 rekomendacji dopasowanych do promptu:
              </span>
              <span className="text-xs text-[#655a53] dark:text-[#b8aea4]">
                Wybierz hasło
              </span>
            </div>

            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {results.map((item, index) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-[#c84b31] dark:border-[#e56b4e] bg-[#fceee9]/40 dark:bg-[#38211c]/30 shadow-sm"
                        : "border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2]/40 dark:bg-[#1a1714]/30 hover:bg-[#faf7f2] dark:hover:bg-[#1a1714]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-[#f2ece1] dark:bg-[#292420] text-[#655a53] dark:text-[#b8aea4] text-[11px] font-mono font-bold grid place-items-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1c1816] dark:text-[#f7f3ec] truncate">
                          {item.pl}
                        </p>
                        {item.en && (
                          <p className="text-[11px] text-[#877b72] dark:text-[#8e8379] truncate">
                            {item.en}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae]">
                        {item.score}% Match
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & Clean Market Selector (6 columns) */}
          <div className="lg:col-span-6 p-5 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] space-y-4 flex flex-col justify-between">
            {selectedItem ? (
              <div className="space-y-4">
                {/* Header of selected item */}
                <div className="border-b border-[#dfd5c6] dark:border-[#38302b] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#c84b31] dark:text-[#e56b4e]">
                      Wybrane hasło z matrycy Sinsay
                    </span>
                    <span className="text-xs font-bold text-[#1d6346] dark:text-[#75d9ae]">
                      {selectedItem.score}% Dopasowania
                    </span>
                  </div>
                  <h4 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec] mt-1 font-semibold leading-snug">
                    „{selectedItem.pl}”
                  </h4>
                  {selectedItem.en && (
                    <p className="text-xs text-[#877b72] dark:text-[#8e8379] italic mt-0.5">
                      ENG: {selectedItem.en}
                    </p>
                  )}
                </div>

                {/* Sane Market Selection Area */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1c1816] dark:text-[#f7f3ec]">
                      Wybierz rynek docelowy (28 dostępnych):
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsFullMatrixOpen((prev) => !prev)}
                      className="text-[11px] font-semibold text-[#c84b31] dark:text-[#e56b4e] hover:underline flex items-center gap-1"
                    >
                      <span>{isFullMatrixOpen ? "Zwiń matrycę ▲" : "Pokaż wszystkie 28 rynków ⊞"}</span>
                    </button>
                  </div>

                  {/* Clean Dropdown with Optgroups */}
                  <div className="relative">
                    <select
                      value={selectedMarketCode}
                      onChange={(e) => setSelectedMarketCode(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] text-xs font-medium text-[#1c1816] dark:text-[#f7f3ec] focus:outline-none focus:border-[#c84b31] shadow-sm cursor-pointer"
                    >
                      {["CEE", "SEE / Bałkany", "Zachód & Południe", "Kraje Bałtyckie", "Wschód & Azja"].map(
                        (region) => (
                          <optgroup key={region} label={`─── ${region} ───`}>
                            {SINSAY_MARKETS.filter((m) => m.region === region).map((m) => (
                              <option key={m.code} value={m.code}>
                                {m.flag} {m.name} ({m.code})
                              </option>
                            ))}
                          </optgroup>
                        )
                      )}
                    </select>
                  </div>

                  {/* Quick Shortcut Pills for Top Sinsay Markets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#877b72] dark:text-[#8e8379] mr-1">
                      Szybki skrót:
                    </span>
                    {["RO", "DE", "CZ", "SK", "HU", "IT", "HR", "GR"].map((code) => {
                      const m = SINSAY_MARKETS.find((item) => item.code === code);
                      const isActive = selectedMarketCode === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setSelectedMarketCode(code)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            isActive
                              ? "bg-[#c84b31] text-white shadow-sm"
                              : "bg-white dark:bg-[#211d1a] border border-[#dfd5c6] dark:border-[#38302b] text-[#655a53] dark:text-[#b8aea4] hover:border-[#c84b31]"
                          }`}
                        >
                          <span>{m?.flag}</span>
                          <span>{code}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Translation Card for the Selected Market */}
                  <div className="p-4 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] space-y-2 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#dfd5c6]/60 dark:border-[#38302b]/60 pb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1816] dark:text-[#f7f3ec]">
                        <span className="text-base">{activeMarket.flag}</span>
                        <span>{activeMarket.name}</span>
                        <span className="font-mono text-[11px] text-[#877b72] dark:text-[#8e8379]">
                          ({activeMarket.code})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#877b72] dark:text-[#8e8379]">
                          Długość: <strong>{activeTranslation.length}</strong> znaków
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeTranslation, "single")}
                          className="text-[10px] text-[#c84b31] dark:text-[#e56b4e] hover:underline font-medium"
                        >
                          {copiedKey === "single" ? "✓ Skopiowano" : "Kopiuj"}
                        </button>
                      </div>
                    </div>

                    <p className="font-serif text-sm text-[#1c1816] dark:text-[#f7f3ec] leading-relaxed pt-1">
                      {activeTranslation}
                    </p>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectPhrase && selectedItem) {
                      onSelectPhrase(selectedItem);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#1d6346] hover:bg-[#164e37] text-white shadow-sm transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <span>✓ Zastosuj to hasło we wszystkich językach kreacji</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#877b72] dark:text-[#8e8379] italic py-12">
                Wybierz hasło z listy po lewej stronie
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full 28 Markets Grid Modal / Accordion */}
      {selectedItem && isFullMatrixOpen && (
        <div className="mt-4 p-5 rounded-xl border border-[#c84b31]/40 dark:border-[#e56b4e]/40 bg-[#faf7f2] dark:bg-[#1a1714] space-y-4">
          <div className="flex items-center justify-between border-b border-[#dfd5c6] dark:border-[#38302b] pb-2">
            <div>
              <h4 className="font-serif text-base font-semibold text-[#1c1816] dark:text-[#f7f3ec]">
                Pełna matryca 28 rynków Sinsay dla hasła: „{selectedItem.pl}”
              </h4>
              <p className="text-xs text-[#655a53] dark:text-[#b8aea4]">
                Zatwierdzone oficjalne tłumaczenia LPP SA na wszystkie rynki eksportowe
              </p>
            </div>
            <button
              onClick={() => setIsFullMatrixOpen(false)}
              className="text-xs font-semibold text-[#877b72] hover:text-[#1c1816] dark:hover:text-[#f7f3ec]"
            >
              Zamknij widok matrycy ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {SINSAY_MARKETS.map((m) => {
              const text =
                selectedItem.translations[m.code] ||
                selectedItem.translations["ENG"] ||
                selectedItem.pl;
              const isCopied = copiedKey === m.code;

              return (
                <div
                  key={m.code}
                  className="p-3 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#1c1816] dark:text-[#f7f3ec] flex items-center gap-1">
                      <span>{m.flag}</span>
                      <span>{m.code} · {m.name}</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(text, m.code)}
                      className="text-[10px] text-[#c84b31] dark:text-[#e56b4e] hover:underline"
                    >
                      {isCopied ? "✓" : "Kopiuj"}
                    </button>
                  </div>
                  <p className="text-xs text-[#1c1816] dark:text-[#f7f3ec] line-clamp-2 font-medium">
                    {text}
                  </p>
                  <span className="text-[10px] text-[#877b72] dark:text-[#8e8379] block">
                    {text.length} zn.
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
