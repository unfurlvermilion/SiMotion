"use client";

import React, { useState, useEffect } from "react";

export interface IntegrationConfig {
  mode: "live";
  seedanceModel: string;
}

export const INTEGRATIONS_STORAGE_KEY = "simotion_integrations_config";

/** Modele wideo dostępne w interfejsie (klucze rozpoznawane przez /api/video). */
export const VIDEO_ENGINE_OPTIONS = [
  { value: "seedance-2.5", label: "Seedance 2.5" },
  { value: "seedance-2.0", label: "Seedance 2.0" },
] as const;

export type VideoEngine = (typeof VIDEO_ENGINE_OPTIONS)[number]["value"];

/** Zamienia zapisane wcześniej nazwy (seedance-2.5-pro/turbo/omni, higgsfield) na aktualne. */
export function normalizeVideoEngine(value: string | undefined | null): VideoEngine {
  const v = (value || "").toLowerCase();
  if (v === "seedance-2.0") return "seedance-2.0";
  return "seedance-2.5";
}

const DEFAULT_CONFIG: IntegrationConfig = {
  mode: "live",
  seedanceModel: "seedance-2.5",
};

/**
 * Zwraca konfigurację produkcyjną (tryb zawsze Live; klucze API wyłącznie po stronie serwera).
 */
export function readIntegrationsConfig(): IntegrationConfig {
  return DEFAULT_CONFIG;
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
  const [videoServerConfig, setVideoServerConfig] = useState<VideoServerConfig | null>(null);
  const [videoTestMessage, setVideoTestMessage] = useState<string>("");
  const [pcmTestMessage, setPcmTestMessage] = useState<string>("");
  const [testStatus, setTestStatus] = useState<{ [key: string]: "idle" | "testing" | "success" | "error" }>({
    video: "idle",
    pcm: "idle",
  });

  useEffect(() => {
    // Wyczyść ewentualne stare ustawienia/klucze zapisane wcześniej w przeglądarce
    try {
      localStorage.removeItem(INTEGRATIONS_STORAGE_KEY);
    } catch {}
    fetchVideoServerConfig().then(setVideoServerConfig);
  }, []);

  const handleTestConnection = async (key: "video" | "pcm") => {
    setTestStatus((prev) => ({ ...prev, [key]: "testing" }));
    try {
      if (key === "video") {
        setVideoTestMessage("");
        const res = await fetch("/api/video?check=1", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        setVideoTestMessage(data.message || (res.ok ? "Połączono z BytePlus ModelArk." : `HTTP ${res.status}`));
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      } else if (key === "pcm") {
        setPcmTestMessage("");
        const res = await fetch("/api/pcm?mdk=001KR-83X", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setPcmTestMessage(data.message || `Błąd PCM (HTTP ${res.status})`);
          throw new Error(data.message || `HTTP ${res.status}`);
        }
        setPcmTestMessage(
          data.pcmFound
            ? `Połączono z PCM LPP (${data.totalAssets} zdjęć dla 001KR-83X).`
            : "PCM odpowiada, brak zdjęć dla testowego MDK."
        );
      }
      setTestStatus((prev) => ({ ...prev, [key]: "success" }));
    } catch {
      setTestStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#dcd9ec] dark:border-[#262338] pb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-[#13111c] dark:text-[#f4f4f8]">
          Status systemu
        </h2>
        <p className="text-xs text-[#5c5870] dark:text-[#c4c1d6] mt-1">
          Połączenia produkcyjne zarządzane po stronie serwera (Google Secret Manager · Cloud Storage · LPP PCM).
        </p>
      </div>

      {/* 1. BytePlus Seedance */}
      <div className="p-5 rounded-2xl border border-[#dcd9ec] dark:border-[#262338] bg-white dark:bg-[#151320] space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 flex items-center justify-center text-base">
              🎬
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#13111c] dark:text-[#f4f4f8]">
                Generator Wideo AI (BytePlus Seedance 2.5)
              </h3>
              <p className="text-[11px] text-[#5c5870] dark:text-[#9d99b5]">
                Tryb produkcyjny · klucze API przechowywane wyłącznie na serwerze
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTestConnection("video")}
            disabled={testStatus.video === "testing"}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] hover:border-[#7c5cff] text-[#13111c] dark:text-[#f4f4f8] cursor-pointer disabled:opacity-50"
          >
            {testStatus.video === "testing" ? "Sprawdzanie..." : "Sprawdź połączenie"}
          </button>
        </div>

        {videoServerConfig && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-[#dcd9ec] dark:border-[#262338]">
            <div>
              <span className="text-[#5c5870] dark:text-[#9d99b5] block text-[11px]">Klucz API serwera:</span>
              <span className="font-semibold flex items-center gap-1.5 mt-0.5 text-[#13111c] dark:text-[#f4f4f8]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    videoServerConfig.seedance.keyConfigured ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                {videoServerConfig.seedance.keyConfigured ? "Aktywny (Secret Manager)" : "Brak na serwerze"}
              </span>
            </div>
            <div>
              <span className="text-[#5c5870] dark:text-[#9d99b5] block text-[11px]">Endpoint API:</span>
              <span className="font-mono text-[11px] text-[#13111c] dark:text-[#f4f4f8] mt-0.5 block">
                {videoServerConfig.seedance.endpointHost}
              </span>
            </div>
            <div>
              <span className="text-[#5c5870] dark:text-[#9d99b5] block text-[11px]">Archiwum wideo:</span>
              <span className="font-mono text-[11px] text-[#13111c] dark:text-[#f4f4f8] mt-0.5 block">
                {videoServerConfig.seedance.storageConfigured ? "Google Cloud Storage" : "Link tymczasowy 24h"}
              </span>
            </div>
          </div>
        )}

        {videoTestMessage && (
          <p
            className={`text-xs font-medium ${
              testStatus.video === "error" ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {videoTestMessage}
          </p>
        )}
      </div>

      {/* 2. LPP PCM */}
      <div className="p-5 rounded-2xl border border-[#dcd9ec] dark:border-[#262338] bg-white dark:bg-[#151320] space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-base">
              📦
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#13111c] dark:text-[#f4f4f8]">
                Baza Packshotów LPP (PCM)
              </h3>
              <p className="text-[11px] text-[#5c5870] dark:text-[#9d99b5]">
                Pobieranie wyretuszowanych zdjęć 050/051/052 po kodzie MDK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTestConnection("pcm")}
            disabled={testStatus.pcm === "testing"}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#dcd9ec] dark:border-[#262338] bg-[#f4f4fa] dark:bg-[#0d0c14] hover:border-[#7c5cff] text-[#13111c] dark:text-[#f4f4f8] cursor-pointer disabled:opacity-50"
          >
            {testStatus.pcm === "testing" ? "Testowanie..." : "Testuj PCM"}
          </button>
        </div>

        {pcmTestMessage && (
          <p
            className={`text-xs font-medium ${
              testStatus.pcm === "error" ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {pcmTestMessage}
          </p>
        )}
      </div>
    </div>
  );
}
