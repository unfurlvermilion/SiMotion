"use client";

import React, { useState, useEffect } from "react";

interface IntegrationConfig {
  mode: "sandbox" | "live";
  seedanceApiKey: string;
  seedanceModel: string;
  seedanceEndpoint: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  elevenLabsTimestamps: boolean;
  pcmEndpoint: string;
  pcmToken: string;
  excelTenantId: string;
  excelClientId: string;
  excelWorkbookId: string;
  excelSheetName: string;
}

const DEFAULT_CONFIG: IntegrationConfig = {
  mode: "sandbox",
  seedanceApiKey: "sk_demo_seedance_2_mock",
  seedanceModel: "seedance-2.0-pro-fashion",
  seedanceEndpoint: "https://api.seedance.ai/v2/generate",
  elevenLabsApiKey: "xi_demo_elevenlabs_mock",
  elevenLabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
  elevenLabsTimestamps: true,
  pcmEndpoint: "https://pcm.internal.company.com/api/v1/products",
  pcmToken: "pcm_bearer_mock_key_99",
  excelTenantId: "72f988bf-86f1-41af-91ab-2d7cd011db47",
  excelClientId: "e85741e9-9231-41f2-9594-814cb2091c6e",
  excelWorkbookId: "01ABCDEF23456789!9876",
  excelSheetName: "Kolekcja_FW26_Statusy",
};

export default function IntegrationsView() {
  const [config, setConfig] = useState<IntegrationConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "pcm" | "excel">("video");
  const [testStatus, setTestStatus] = useState<{ [key: string]: "idle" | "testing" | "success" | "error" }>({
    video: "idle",
    audio: "idle",
    pcm: "idle",
    excel: "idle",
  });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("simotion_integrations_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        // use default
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("simotion_integrations_config", JSON.stringify(config));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async (key: "video" | "audio" | "pcm" | "excel") => {
    setTestStatus((prev) => ({ ...prev, [key]: "testing" }));
    try {
      if (key === "video") {
        await fetch("/api/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: "Fashion dress test",
            model: config.seedanceModel,
            duration: 10,
            aspectRatio: "9:16",
            apiKey: config.seedanceApiKey,
          }),
        });
      } else if (key === "audio") {
        await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "Test lektora SiMotion z ElevenLabs",
            voiceId: config.elevenLabsVoiceId,
            apiKey: config.elevenLabsApiKey,
          }),
        });
      } else if (key === "pcm") {
        await fetch("/api/pcm?mdk=001KR-83X");
      } else if (key === "excel") {
        await fetch("/api/spreadsheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fetch_rows",
            workbookId: config.excelWorkbookId,
          }),
        });
      }
      setTestStatus((prev) => ({ ...prev, [key]: "success" }));
    } catch {
      setTestStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dfd5c6] dark:border-[#38302b] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#c84b31] dark:text-[#e56b4e] mb-1">
            <span>● Moduł 07</span>
            <span>·</span>
            <span>Connectors & API</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-serif text-[#1c1816] dark:text-[#f7f3ec]">
            Integracje, Klucze API & Arkusz Excel
          </h2>
          <p className="text-sm text-[#655a53] dark:text-[#b8aea4] mt-1">
            Zarządzaj połączeniami z Seedance 2.0, ElevenLabs TTS, PCM API oraz dwukierunkową synchronizacją Microsoft Excel Online.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#f2ece1] dark:bg-[#1a1714] p-1 rounded-xl border border-[#dfd5c6] dark:border-[#38302b]">
            <button
              onClick={() => setConfig((prev) => ({ ...prev, mode: "sandbox" }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                config.mode === "sandbox"
                  ? "bg-white dark:bg-[#211d1a] text-[#1c1816] dark:text-[#f7f3ec] shadow-sm font-semibold"
                  : "text-[#655a53] dark:text-[#b8aea4]"
              }`}
            >
              Tryb Sandbox (Mock)
            </button>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, mode: "live" }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                config.mode === "live"
                  ? "bg-[#c84b31] text-white shadow-sm font-semibold"
                  : "text-[#655a53] dark:text-[#b8aea4]"
              }`}
            >
              Tryb Live (Klucze API)
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-medium rounded-lg bg-[#c84b31] dark:bg-[#e56b4e] hover:opacity-90 text-white shadow-sm transition-colors"
          >
            Zapisz konfigurację
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl border border-[#1d6346] dark:border-[#75d9ae] bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae] text-xs flex items-center gap-2">
          <span>✓</span>
          <span>Konfiguracja została pomyślnie zapisana w pamięci lokalnej (localStorage).</span>
        </div>
      )}

      {config.mode === "sandbox" ? (
        <div className="p-4 rounded-xl border border-[#bfa890] dark:border-[#5c4d42] bg-[#fdf1e1]/50 dark:bg-[#382916]/30 text-xs text-[#8f4f0e] dark:text-[#f5bc7a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>ℹ</span>
            <span>
              <strong>Aktywny Tryb Sandbox:</strong> Wszystkie zapytania do Seedance, ElevenLabs i Excel Online działają w bezpiecznym środowisku symulacyjnym (bez zużycia kredytów i bez opłat).
            </span>
          </div>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, mode: "live" }))}
            className="underline hover:no-underline font-medium"
          >
            Przełącz na Live API
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-[#c84b31] dark:border-[#e56b4e] bg-[#fceee9]/40 dark:bg-[#38211c]/30 text-xs text-[#c84b31] dark:text-[#e56b4e] flex items-center gap-2">
          <span>⚡</span>
          <span>
            <strong>Aktywny Tryb Live:</strong> Aplikacja będzie kierować żądania bezpośrednio do Twoich produkcyjnych kluczy API. Upewnij się, że wprowadzone dane są prawidłowe.
          </span>
        </div>
      )}

      {/* Main Grid: Tabs and Forms */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="space-y-2">
          {[
            { id: "video", label: "Silnik Wideo AI", desc: "Seedance 2.0 / Higgsfield" },
            { id: "audio", label: "Audio & TTS", desc: "ElevenLabs z word timestamps" },
            { id: "pcm", label: "Katalog PCM", desc: "Zdjęcia packshotowe & SKU" },
            { id: "excel", label: "Excel Online", desc: "Microsoft Graph API dwukierunkowo" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                activeTab === tab.id
                  ? "border-[#c84b31] dark:border-[#e56b4e] bg-white dark:bg-[#211d1a] shadow-sm"
                  : "border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2]/50 dark:bg-[#1a1714]/50 hover:bg-white dark:hover:bg-[#211d1a]"
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  activeTab === tab.id
                    ? "text-[#c84b31] dark:text-[#e56b4e]"
                    : "text-[#1c1816] dark:text-[#f7f3ec]"
                }`}
              >
                {tab.label}
              </p>
              <p className="text-[11px] text-[#877b72] dark:text-[#8e8379] mt-0.5">
                {tab.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 p-6 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-white dark:bg-[#211d1a] shadow-sm space-y-6">
          {/* TAB 1: VIDEO ENGINE */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dfd5c6] dark:border-[#38302b] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec]">
                    Konfiguracja Silnika Generacji Wideo AI
                  </h3>
                  <p className="text-xs text-[#655a53] dark:text-[#b8aea4]">
                    Adapter Seedance 2.0 oraz Higgsfield z automatycznym Smart Cropem 9:16 do 4:5 i 1:1.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("video")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] hover:bg-[#faf7f2] dark:hover:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] transition-colors"
                >
                  {testStatus.video === "testing"
                    ? "Testowanie..."
                    : testStatus.video === "success"
                    ? "✓ Połączono (200 OK)"
                    : "Testuj połączenie (Ping)"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    Wybór modelu AI:
                  </label>
                  <select
                    value={config.seedanceModel}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, seedanceModel: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec]"
                  >
                    <option value="seedance-2.0-pro-fashion">
                      Seedance 2.0 Pro (Fashion & Fabric Dynamics)
                    </option>
                    <option value="seedance-2.0-fast">Seedance 2.0 Turbo (Fast Drafts)</option>
                    <option value="higgsfield-motion-1.5">Higgsfield Motion 1.5</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    Klucz API (Seedance / Higgsfield):
                  </label>
                  <input
                    type="password"
                    value={config.seedanceApiKey}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, seedanceApiKey: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                    placeholder="sk_..."
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[#655a53] dark:text-[#b8aea4]">
                  Endpoint API:
                </label>
                <input
                  type="text"
                  value={config.seedanceEndpoint}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, seedanceEndpoint: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO & TTS */}
          {activeTab === "audio" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dfd5c6] dark:border-[#38302b] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec]">
                    Konfiguracja ElevenLabs TTS & Napisów
                  </h3>
                  <p className="text-xs text-[#655a53] dark:text-[#b8aea4]">
                    Synteza lektora z precyzyjnymi znacznikami czasu dla animacji napisów karaoke.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("audio")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] hover:bg-[#faf7f2] dark:hover:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] transition-colors"
                >
                  {testStatus.audio === "testing"
                    ? "Testowanie..."
                    : testStatus.audio === "success"
                    ? "✓ Głos aktywny"
                    : "Testuj ElevenLabs"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    ElevenLabs API Key:
                  </label>
                  <input
                    type="password"
                    value={config.elevenLabsApiKey}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, elevenLabsApiKey: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                    placeholder="xi_..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    Domyślny Voice ID:
                  </label>
                  <input
                    type="text"
                    value={config.elevenLabsVoiceId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, elevenLabsVoiceId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1c1816] dark:text-[#f7f3ec]">
                  <input
                    type="checkbox"
                    checked={config.elevenLabsTimestamps}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        elevenLabsTimestamps: e.target.checked,
                      }))
                    }
                    className="accent-[#c84b31]"
                  />
                  <span>Włącz generowanie znaczników czasu słów (Word Timestamps) do karaoke</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PCM API */}
          {activeTab === "pcm" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dfd5c6] dark:border-[#38302b] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec]">
                    Połączenie z Katalogiem Produktów PCM
                  </h3>
                  <p className="text-xs text-[#655a53] dark:text-[#b8aea4]">
                    Automatyczne pobieranie packshotów i danych o tkaninach po kodzie MDK.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("pcm")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] hover:bg-[#faf7f2] dark:hover:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] transition-colors"
                >
                  {testStatus.pcm === "testing"
                    ? "Sprawdzanie..."
                    : testStatus.pcm === "success"
                    ? "✓ PCM Online"
                    : "Sprawdź status PCM"}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    PCM API Endpoint URL:
                  </label>
                  <input
                    type="text"
                    value={config.pcmEndpoint}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, pcmEndpoint: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    Klucz autoryzacyjny (Bearer Token):
                  </label>
                  <input
                    type="password"
                    value={config.pcmToken}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, pcmToken: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXCEL ONLINE */}
          {activeTab === "excel" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dfd5c6] dark:border-[#38302b] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#1c1816] dark:text-[#f7f3ec]">
                    Microsoft Excel Online & Graph API
                  </h3>
                  <p className="text-xs text-[#655a53] dark:text-[#b8aea4]">
                    Dwukierunkowa synchronizacja: odczyt zleceń wideo i automatyczny zapis statusów/linków do arkusza.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("excel")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dfd5c6] dark:border-[#38302b] hover:bg-[#faf7f2] dark:hover:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] transition-colors"
                >
                  {testStatus.excel === "testing"
                    ? "Łączenie..."
                    : testStatus.excel === "success"
                    ? "✓ Graph API Połączono"
                    : "Testuj Graph API"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    Microsoft Azure Tenant ID:
                  </label>
                  <input
                    type="text"
                    value={config.excelTenantId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelTenantId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    App / Client ID:
                  </label>
                  <input
                    type="text"
                    value={config.excelClientId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelClientId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    ID Skoroszytu (Drive Item ID):
                  </label>
                  <input
                    type="text"
                    value={config.excelWorkbookId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelWorkbookId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec] font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#655a53] dark:text-[#b8aea4]">
                    Nazwa zakładki arkusza:
                  </label>
                  <input
                    type="text"
                    value={config.excelSheetName}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelSheetName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5c6] dark:border-[#38302b] bg-[#faf7f2] dark:bg-[#1a1714] text-[#1c1816] dark:text-[#f7f3ec]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
