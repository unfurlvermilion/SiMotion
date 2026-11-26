// Persistent Storage for Brand Kit Assets using IndexedDB
// Allows saving logos, campaign stickers, badges, and fonts permanently in the browser

export interface StoredAsset {
  id: string;
  name: string;
  kind: "video" | "static" | "both";
  type: "badge" | "cta" | "frame" | "star" | "image" | "audio" | "logo_anim";
  text?: string;
  url?: string;
  dataUrl?: string; // Persistent Base64 for images/badges/audio/logo_anim
  durationSec?: number;
  createdAt?: string;
}

export interface StoredLogoConfig {
  variantId: string;
  colorScheme: "black" | "white";
  filePath: string;
  gifPath: string;
  durationSec: number;
  name: string;
}

export const BUILTIN_BGM_TRACKS = [
  { id: "runway", name: "Warm Runway House (122 BPM)", src: "/audio/runway_house.m4a", durationHint: "Dynamiczny" },
  { id: "lofi", name: "Atelier Lo-Fi Beats (98 BPM)", src: "/audio/atelier_lofi.m4a", durationHint: "Spokojny" },
] as const;

export function isVideoLogoSrc(src?: string | null): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  return lower.startsWith("data:video/") || /\.(mp4|mov|webm)(\?|$)/i.test(lower);
}

const DEFAULT_INTRO_KEY = "simotion_default_intro";
const DEFAULT_OUTRO_KEY = "simotion_default_outro";

export function saveDefaultLogoConfig(slot: "intro" | "outro", config: StoredLogoConfig): void {
  if (typeof window === "undefined") return;
  try {
    // Nie zapisujemy wielkich data: URL-i w localStorage (limit ~5 MB) — dociągamy je z IndexedDB po variantId
    const compact: StoredLogoConfig = config.variantId.startsWith("logoanim-")
      ? { ...config, filePath: "", gifPath: "" }
      : config;
    localStorage.setItem(slot === "intro" ? DEFAULT_INTRO_KEY : DEFAULT_OUTRO_KEY, JSON.stringify(compact));
  } catch (err) {
    console.warn("Failed to save default logo config:", err);
  }
}

export function clearDefaultLogoConfig(slot: "intro" | "outro"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(slot === "intro" ? DEFAULT_INTRO_KEY : DEFAULT_OUTRO_KEY);
  } catch {}
}

export function loadDefaultLogoConfig(slot: "intro" | "outro"): StoredLogoConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(slot === "intro" ? DEFAULT_INTRO_KEY : DEFAULT_OUTRO_KEY);
    return raw ? (JSON.parse(raw) as StoredLogoConfig) : null;
  } catch {
    return null;
  }
}

export async function resolveDefaultLogoConfig(slot: "intro" | "outro"): Promise<StoredLogoConfig | null> {
  const cfg = loadDefaultLogoConfig(slot);
  if (!cfg) return null;
  if (cfg.variantId.startsWith("logoanim-") && !cfg.gifPath) {
    const customAnims = await loadCustomMediaAssets("logo_anim");
    const found = customAnims.find((a) => a.id === cfg.variantId);
    const src = found?.url || found?.dataUrl || "";
    if (!src) return null;
    return { ...cfg, filePath: src, gifPath: src };
  }
  return cfg;
}

const DB_NAME = "simotion_brand_kit";
const STORE_NAME = "assets";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Convert File/Blob to Base64 Data URL for universal cross-session rendering
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function saveStoredAsset(asset: StoredAsset): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(asset);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB save failed, falling back to localStorage", e);
    try {
      const saved = JSON.parse(localStorage.getItem("simotion_custom_assets") || "[]");
      const filtered = saved.filter((a: any) => a.id !== asset.id);
      filtered.push(asset);
      localStorage.setItem("simotion_custom_assets", JSON.stringify(filtered));
    } catch (lsErr) {
      console.error("Storage error:", lsErr);
    }
  }
}

export async function loadStoredAssets(): Promise<StoredAsset[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("IndexedDB load failed, trying localStorage", e);
    try {
      return JSON.parse(localStorage.getItem("simotion_custom_assets") || "[]");
    } catch {
      return [];
    }
  }
}

export async function deleteStoredAsset(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    try {
      const saved = JSON.parse(localStorage.getItem("simotion_custom_assets") || "[]");
      const filtered = saved.filter((a: any) => a.id !== id);
      localStorage.setItem("simotion_custom_assets", JSON.stringify(filtered));
    } catch {}
  }
}

export async function loadCustomMediaAssets(type: "audio" | "logo_anim"): Promise<StoredAsset[]> {
  const all = await loadStoredAssets();
  return all.filter((item) => item.type === type);
}
