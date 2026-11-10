// Persistent Storage for Brand Kit Assets using IndexedDB
// Allows saving logos, campaign stickers, badges, and fonts permanently in the browser

export interface StoredAsset {
  id: string;
  name: string;
  kind: "video" | "static" | "both";
  type: "badge" | "cta" | "frame" | "star" | "image";
  text?: string;
  url?: string;
  dataUrl?: string; // Persistent Base64 for images/badges
  createdAt?: string;
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
