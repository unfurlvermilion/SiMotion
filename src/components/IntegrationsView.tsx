"use client";

import React, { useState, useEffect } from "react";

export interface IntegrationConfig {
  mode: "sandbox" | "live";
  seedanceModel: string;
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

export const INTEGRATIONS_STORAGE_KEY = "simotion_integrations_config";

/** Modele wideo dostępne w interfejsie (klucze rozpoznawane przez /api/video). */
export const VIDEO_ENGINE_OPTIONS = [
  { value: "seedance-2.5", label: "Seedance 2.5" },
  { value: "seedance-2.0", label: "Seedance 2.0" },
  { value: "higgsfield-cinema-2.0", label: "Higgsfield Cinema 2.0" },
] as const;

export type VideoEngine = (typeof VIDEO_ENGINE_OPTIONS)[number]["value"];

/** Zamienia zapisane wcześniej nazwy (seedance-2.5-pro/turbo/omni) na aktualne. */
export function normalizeVideoEngine(value: string | undefined | null): VideoEngine {
  const v = (value || "").toLowerCase();
  if (v.includes("higgsfield")) return "higgsfield-cinema-2.0";
  if (v === "seedance-2.0") return "seedance-2.0";
  return "seedance-2.5";
}

const DEFAULT_CONFIG: IntegrationConfig = {
  mode: "sandbox",
  seedanceModel: "seedance-2.5",
  elevenLabsApiKey: "",
  elevenLabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
  elevenLabsTimestamps: true,
  pcmEndpoint: "http://pcm.lppapps.com",
  pcmToken: "",
  excelTenantId: "72f988bf-86f1-41af-91ab-2d7cd011db47",
  excelClientId: "e85741e9-9231-41f2-9594-814cb2091c6e",
  excelWorkbookId: "01ABCDEF23456789!9876",
  excelSheetName: "Kolekcja_FW26_Statusy",
};

/**
 * Odczyt zapisanych ustawień integracji. Usuwa pola klucza i adresu Seedance
 * zapisane przez starsze wersje aplikacji — klucz jest wyłącznie na serwerze.
 */
export function readIntegrationsConfig(): IntegrationConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(INTEGRATIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) || {};
    const { seedanceApiKey: _legacyKey, seedanceEndpoint: _legacyEndpoint, ...rest } = parsed;
    return {
      ...DEFAULT_CONFIG,
      ...rest,
      mode: rest.mode === "live" ? "live" : "sandbox",
      seedanceModel: normalizeVideoEngine(rest.seedanceModel),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export interface VideoServerConfig {
  seedance: {
    keyConfigured: boolean;
    endpointHost: string;
    resolution: string;
    generateAudio: boolean;
    storageConfigured: boolean;
    models: {
      key: string;
      label: string;
      arkModelId: string;
      minDuration: number;
      maxDuration: number;
      usdPerMillionTokens: number | null;
    }[];
  };
  higgsfield: { keyConfigured: boolean };
}

/** Konfiguracja silnika wideo po stronie serwera (bez sekretów). */
export async function fetchVideoServerConfig(): Promise<VideoServerConfig | null> {
  try {
    const res = await fetch("/api/video?config=1", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as VideoServerConfig;
  } catch {
    return null;
  }
}

export default function IntegrationsView() {
  const [config, setConfig] = useState<IntegrationConfig>(DEFAULT_CONFIG);
  const [videoServerConfig, setVideoServerConfig] = useState<VideoServerConfig | null>(null);
  const [videoTestMessage, setVideoTestMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "pcm" | "excel">("video");
  const [testStatus, setTestStatus] = useState<{ [key: string]: "idle" | "testing" | "success" | "error" }>({
    video: "idle",
    audio: "idle",
    pcm: "idle",
    excel: "idle",
  });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    setConfig(readIntegrationsConfig());
    fetchVideoServerConfig().then(setVideoServerConfig);
  }, []);

  const handleSave = () => {
    localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(config));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async (key: "video" | "audio" | "pcm" | "excel") => {
    setTestStatus((prev) => ({ ...prev, [key]: "testing" }));
    try {
      if (key === "video") {
        // Test bez generowania (lista zadań BytePlus) — nie generuje kosztów
        setVideoTestMessage("");
        const res = await fetch("/api/video?check=1", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        setVideoTestMessage(data.message || (res.ok ? "Połączono." : `HTTP ${res.status}`));
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dcd9ec] dark:border-[#262338] pb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#13111c] dark:text-[#f4f4f8]">
            Ustawienia API
          </h2>
          <p className="text-xs text-[#5c5870] dark:text-[#c4c1d6] mt-0.5">
            Połączenia z Seedance, ElevenLabs, PCM i arkuszem SharePoint.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#f2ece1] dark:bg-[#0d0c14] p-1 rounded-xl border border-[#dcd9ec] dark:border-[#262338]">
            <button
              onClick={() => setConfig((prev) => ({ ...prev, mode: "sandbox" }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                config.mode === "sandbox"
                  ? "bg-white dark:bg-[#151320] text-[#13111c] dark:text-[#f4f4f8] shadow-sm font-semibold"
                  : "text-[#5c5870] dark:text-[#c4c1d6]"
              }`}
            >
              Testowy (Sandbox)
            </button>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, mode: "live" }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                config.mode === "live"
                  ? "bg-[#7c5cff] text-white shadow-sm font-semibold"
                  : "text-[#5c5870] dark:text-[#c4c1d6]"
              }`}
            >
              Produkcyjny (Live)
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#7c5cff] dark:bg-[#9d85ff] hover:opacity-90 text-white shadow-sm transition-colors"
          >
            Zapisz
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl border border-[#10b981] dark:border-[#75d9ae] bg-[#e6f4ed] dark:bg-[#193328] text-[#10b981] dark:text-[#75d9ae] text-xs flex items-center gap-2">
          <span>✓</span>
          <span>Zapisano ustawienia.</span>
        </div>
      )}

      {config.mode === "sandbox" ? (
        <div className="p-3.5 rounded-xl border border-[#c4bfdc] dark:border-[#383352] bg-[#fdf1e1]/50 dark:bg-[#382916]/30 text-xs text-[#8f4f0e] dark:text-[#f5bc7a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>ℹ</span>
            <span>
              <strong>Tryb testowy:</strong> Zapytania do Seedance i ElevenLabs są symulowane (bez opłat).
            </span>
          </div>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, mode: "live" }))}
            className="underline hover:no-underline font-medium text-xs"
          >
            Przełącz na Live
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-[#7c5cff] dark:border-[#9d85ff] bg-[#efecff]/40 dark:bg-[#221b3d]/30 text-xs text-[#7c5cff] dark:text-[#9d85ff] flex items-center gap-2">
          <span>⚡</span>
          <span>
            <strong>Aktywny Tryb Live:</strong> Generowanie wideo trafia do płatnego API BytePlus ModelArk (Seedance) z kluczem skonfigurowanym na serwerze. Prompt i packshot są wysyłane poza infrastrukturę LPP. Ustawienie obowiązuje po kliknięciu „Zapisz”.
          </span>
        </div>
      )}

      {/* Main Grid: Tabs and Forms */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="space-y-2">
          {[
            { id: "video", label: "Silnik Wideo AI", desc: "Seedance 2.5 / 2.0 / Higgsfield" },
            { id: "audio", label: "Audio & TTS", desc: "ElevenLabs z word timestamps" },
            { id: "pcm", label: "Katalog PCM", desc: "Zdjęcia packshotowe & SKU" },
            { id: "excel", label: "Excel Online", desc: "Microsoft Graph API dwukierunkowo" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                activeTab === tab.id
                  ? "border-[#7c5cff] dark:border-[#9d85ff] bg-white dark:bg-[#151320] shadow-sm"
                  : "border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa]/50 dark:bg-[#0d0c14]/50 hover:bg-white dark:hover:bg-[#151320]"
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  activeTab === tab.id
                    ? "text-[#7c5cff] dark:text-[#9d85ff]"
                    : "text-[#13111c] dark:text-[#f4f4f8]"
                }`}
              >
                {tab.label}
              </p>
              <p className="text-[11px] text-[#7c7894] dark:text-[#9d99b5] mt-0.5">
                {tab.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 p-6 rounded-xl border border-[#dcd9ec] dark:border-[#262338] bg-white dark:bg-[#151320] shadow-sm space-y-6">
          {/* TAB 1: VIDEO ENGINE */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dcd9ec] dark:border-[#262338] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#13111c] dark:text-[#f4f4f8]">
                    Konfiguracja Silnika Generacji Wideo AI
                  </h3>
                  <p className="text-xs text-[#5c5870] dark:text-[#c4c1d6]">
                    Seedance 2.5 / 2.0 (BytePlus ModelArk) oraz Higgsfield z automatycznym Smart Cropem 9:16 do 4:5 i 1:1.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("video")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dcd9ec] dark:border-[#262338] hover:bg-[#f4f4fa] dark:hover:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] transition-colors"
                >
                  {testStatus.video === "testing"
                    ? "Testowanie..."
                    : testStatus.video === "success"
                    ? "✓ Połączono z BytePlus"
                    : testStatus.video === "error"
                    ? "✕ Błąd — testuj ponownie"
                    : "Testuj połączenie (bez generowania)"}
                </button>
              </div>

              {videoTestMessage && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] ${
                    testStatus.video === "error"
                      ? "border-[#7c5cff] text-[#7c5cff] dark:border-[#9d85ff] dark:text-[#9d85ff]"
                      : "border-[#10b981] text-[#10b981] dark:border-[#75d9ae] dark:text-[#75d9ae]"
                  }`}
                >
                  {videoTestMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    Wybór modelu AI:
                  </label>
                  <select
                    value={config.seedanceModel}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, seedanceModel: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8]"
                  >
                    {VIDEO_ENGINE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                        {opt.value.startsWith("higgsfield") && !videoServerConfig?.higgsfield.keyConfigured
                          ? " (symulacja — brak klucza)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    Klucz API Seedance:
                  </label>
                  <div className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] flex items-center gap-2">
                    {videoServerConfig === null ? (
                      <span className="text-[#7c7894] dark:text-[#9d99b5]">Sprawdzanie...</span>
                    ) : videoServerConfig.seedance.keyConfigured ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#10b981] dark:bg-[#75d9ae]" />
                        <span>skonfigurowany (Secret Manager)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#7c5cff] dark:bg-[#9d85ff]" />
                        <span>brak — tylko tryb testowy</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {videoServerConfig && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[#5c5870] dark:text-[#c4c1d6]">Rozdzielczość:</p>
                    <p className="font-mono text-[11px] text-[#13111c] dark:text-[#f4f4f8]">
                      {videoServerConfig.seedance.resolution}
                      {videoServerConfig.seedance.generateAudio ? " · z dźwiękiem" : " · bez dźwięku"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#5c5870] dark:text-[#c4c1d6]">API:</p>
                    <p className="font-mono text-[11px] text-[#13111c] dark:text-[#f4f4f8] break-all">
                      {videoServerConfig.seedance.endpointHost}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#5c5870] dark:text-[#c4c1d6]">Archiwum wideo:</p>
                    <p className="font-mono text-[11px] text-[#13111c] dark:text-[#f4f4f8]">
                      {videoServerConfig.seedance.storageConfigured
                        ? "Cloud Storage"
                        : "brak — link ważny 24 h"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIO & TTS */}
          {activeTab === "audio" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dcd9ec] dark:border-[#262338] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#13111c] dark:text-[#f4f4f8]">
                    Konfiguracja ElevenLabs TTS & Napisów
                  </h3>
                  <p className="text-xs text-[#5c5870] dark:text-[#c4c1d6]">
                    Synteza lektora z precyzyjnymi znacznikami czasu dla animacji napisów karaoke.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("audio")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dcd9ec] dark:border-[#262338] hover:bg-[#f4f4fa] dark:hover:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] transition-colors"
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
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    ElevenLabs API Key:
                  </label>
                  <input
                    type="password"
                    value={config.elevenLabsApiKey}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, elevenLabsApiKey: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] font-mono text-[11px]"
                    placeholder="xi_..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    Domyślny Voice ID:
                  </label>
                  <input
                    type="text"
                    value={config.elevenLabsVoiceId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, elevenLabsVoiceId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#13111c] dark:text-[#f4f4f8]">
                  <input
                    type="checkbox"
                    checked={config.elevenLabsTimestamps}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        elevenLabsTimestamps: e.target.checked,
                      }))
                    }
                    className="accent-[#7c5cff]"
                  />
                  <span>Włącz generowanie znaczników czasu słów (Word Timestamps) do karaoke</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PCM API */}
          {activeTab === "pcm" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dcd9ec] dark:border-[#262338] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#13111c] dark:text-[#f4f4f8]">
                    Połączenie z Katalogiem Produktów PCM
                  </h3>
                  <p className="text-xs text-[#5c5870] dark:text-[#c4c1d6]">
                    Automatyczne pobieranie packshotów i danych o tkaninach po kodzie MDK.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("pcm")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dcd9ec] dark:border-[#262338] hover:bg-[#f4f4fa] dark:hover:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] transition-colors"
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
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    PCM API Endpoint URL:
                  </label>
                  <input
                    type="text"
                    value={config.pcmEndpoint}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, pcmEndpoint: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    Klucz autoryzacyjny (Bearer Token):
                  </label>
                  <input
                    type="password"
                    value={config.pcmToken}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, pcmToken: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXCEL ONLINE */}
          {activeTab === "excel" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#dcd9ec] dark:border-[#262338] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-[#13111c] dark:text-[#f4f4f8]">
                    Microsoft Excel Online & Graph API
                  </h3>
                  <p className="text-xs text-[#5c5870] dark:text-[#c4c1d6]">
                    Dwukierunkowa synchronizacja: odczyt zleceń wideo i automatyczny zapis statusów/linków do arkusza.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection("excel")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#dcd9ec] dark:border-[#262338] hover:bg-[#f4f4fa] dark:hover:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] transition-colors"
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
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    Microsoft Azure Tenant ID:
                  </label>
                  <input
                    type="text"
                    value={config.excelTenantId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelTenantId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    App / Client ID:
                  </label>
                  <input
                    type="text"
                    value={config.excelClientId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelClientId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    ID Skoroszytu (Drive Item ID):
                  </label>
                  <input
                    type="text"
                    value={config.excelWorkbookId}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelWorkbookId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8] font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#5c5870] dark:text-[#c4c1d6]">
                    Nazwa zakładki arkusza:
                  </label>
                  <input
                    type="text"
                    value={config.excelSheetName}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, excelSheetName: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] text-[#13111c] dark:text-[#f4f4f8]"
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
