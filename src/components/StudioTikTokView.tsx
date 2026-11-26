"use client";

import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import SinsayPhraseAssistant, { SINSAY_MARKETS, SinsayMatchItem } from "./SinsayPhraseAssistant";
import AnimatedLogoModal, { SelectedLogoConfig, LOGO_VARIANTS } from "./AnimatedLogoModal";
import { SocialSafeAreaOverlay } from "./SocialSafeAreaOverlay";
import { burnSubtitlesToVideo, getVideoExtension } from "@/lib/videoSubtitleBurner";
import {
  StoredAsset,
  isVideoLogoSrc,
  loadCustomMediaAssets,
  resolveDefaultLogoConfig,
} from "@/lib/brandStorage";
import {
  VIDEO_ENGINE_OPTIONS,
  VideoEngine,
  VideoServerConfig,
  fetchVideoServerConfig,
  normalizeVideoEngine,
  readIntegrationsConfig,
} from "./IntegrationsView";

/** Limity obrazu referencyjnego BytePlus: boki 300–6000 px, proporcje 0,4–2,5. */
const PACKSHOT_MAX_SIDE = 2048;
const PACKSHOT_MIN_SIDE = 300;

/**
 * Zamienia packshot (proxy PCM lub plik z dysku) na JPEG w base64,
 * bo BytePlus nie ma dostępu do adresów w sieci LPP ani do plików przeglądarki.
 */
async function packshotToDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`nie udało się wczytać packshotu (HTTP ${res.status})`);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const ratio = bitmap.width / bitmap.height;
    if (ratio < 0.4 || ratio > 2.5) {
      throw new Error("proporcje packshotu poza zakresem 0,4–2,5 wymaganym przez Seedance");
    }
    const scale = Math.min(1, PACKSHOT_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    if (Math.min(width, height) < PACKSHOT_MIN_SIDE) {
      throw new Error(`packshot jest za mały (minimum ${PACKSHOT_MIN_SIDE} px na boku)`);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("brak obsługi canvas w przeglądarce");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    bitmap.close();
  }
}

/** Rozmiar pliku wideo z nagłówka Content-Range (bez pobierania całości). */
async function probeVideoSize(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
    const total = Number((res.headers.get("content-range") || "").split("/")[1]);
    await res.body?.cancel();
    return Number.isFinite(total) && total > 0 ? `${(total / (1024 * 1024)).toFixed(1)} MB` : null;
  } catch {
    return null;
  }
}

export interface StoryboardScene {
  id: string;
  name: string;
  timeRange: string;
  prompt: string;
  pcmImage: string;
  durationSec: number;
}

export interface SubtitleCue {
  id: string;
  startSec: number;
  endSec: number;
  type: "hook" | "speech" | "feature" | "cta";
  label: string;
  text: string;
  line2?: string;
  translations?: Record<string, { line1: string; line2?: string }>;
}

export const GARMENT_PRESETS = [
  {
    label: "👗 Sukienka",
    prompt: "Dynamiczny try-on sukienki midi. Zwiewny ruch tkaniny, miękkie załamania światła w atelier, zbliżenie na dekolt i szwy wykończeniowe, swobodny krok modelki.",
    voiceover: "Hej dziewczyny! Zobaczcie tę nowość sukienkową w Sinsay. Krój układa się obłędnie, a materiał jest lekki jak chmurka. Sprawdźcie w aplikacji i salonach!",
    cues: [
      { text: "Nowa sukienka midi", line2: "Zwiewny lekki krój" },
      { text: "Układa się idealnie", line2: "w każdym ruchu" },
      { text: "Detal tkaniny & jakość", line2: "na co dzień i wieczór" },
      { text: "Kup teraz w aplikacji", line2: "Sinsay · Great Fashion" },
    ],
  },
  {
    label: "🧥 Płaszcz / Kurtka",
    prompt: "Elegancki try-on okrycia wierzchniego. Wyrazista faktura materiału, precyzyjne cięcia, naturalny krok modelki w ruchu w minimalistycznym ciepłym świetle.",
    voiceover: "Idealne okrycie na chłodniejsze dni już w Sinsay! Zobaczcie ten krój, świetny materiał i dopracowane wykończenie. Sprawdźcie w salonach i online!",
    cues: [
      { text: "Nowe okrycie wierzchnie", line2: "Idealny krój na sezon" },
      { text: "Ciepły materiał & styl", line2: "naturalna elegancja" },
      { text: "Wytrzymałe wykończenie", line2: "ponadczasowy fason" },
      { text: "Odkryj w Sinsay", line2: "Sprawdź całą kolekcję" },
    ],
  },
  {
    label: "👔 Koszula / Top",
    prompt: "Prezentacja koszuli w stylu minimalistycznym. Czysty fason, detale kołnierzyka, guziki z masy perłowej, naturalne załamania światła na tkaninie w ruchu.",
    voiceover: "Klasyczna koszula, która pasuje do wszystkiego! Świetny fason do biura i na miasto. Zobaczcie jak leży i sprawdźcie w aplikacji Sinsay.",
    cues: [
      { text: "Klasyczna koszula Sinsay", line2: "Must-have w szafie" },
      { text: "Wygodny naturalny krój", line2: "do pracy i na miasto" },
      { text: "Detale i wykończenie", line2: "idealna jakość" },
      { text: "Zamów w aplikacji", line2: "Sinsay · Great Fashion" },
    ],
  },
  {
    label: "👖 Spodnie / Jeans",
    prompt: "Sylwetka w spodniach z prostą nogawką. Swobodny chód, idealne układanie się materiału w kroku, detal paska i kieszeni, dynamiczny obrót.",
    voiceover: "Te spodnie to hit! Krój z wysokim stanem niesamowicie wydłuża nogi, a materiał daje pełen komfort. Sprawdźcie swój rozmiar w Sinsay!",
    cues: [
      { text: "Idealne spodnie na co dzień", line2: "Maksymalny komfort" },
      { text: "Wydłużający krój", line2: "świetnie leży w ruchu" },
      { text: "Dopracowane detale", line2: "szeroka gama rozmiarów" },
      { text: "Sprawdź w aplikacji", line2: "Sinsay · New Arrivals" },
    ],
  },
  {
    label: "🧶 Sweter / Dzianina",
    prompt: "Przytulny try-on miękkiej dzianiny. Ciepłe światło, makro zbliżenie na strukturę przędzy i ściągacze, naturalna miękkość i plastyczność w ruchu.",
    voiceover: "Miękki, przytulny sweter z nowej kolekcji Sinsay. Cieplutki splot, piękny odcień i super cena. Zobaczcie w salonach i aplikacji!",
    cues: [
      { text: "Miękka dzianina Sinsay", line2: "Ciepły otulający splot" },
      { text: "Przyjemny w dotyku", line2: "idealny na chłodne dni" },
      { text: "Modne kolory sezonu", line2: "w świetnej cenie" },
      { text: "Kup teraz w Sinsay", line2: "Szybka dostawa do salonu" },
    ],
  },
];

export interface PcmAsset {
  id: string;
  label: string;
  filename: string;
  url: string;
  rawPcmUrl?: string;
  source: "pcm" | "pdm" | "fallback";
  type: string;
  mdk?: string;
  selected?: boolean;
}

interface StudioTikTokViewProps {
  productId: string;
  setProductId: (val: string) => void;
  showToast: (msg: string) => void;
  onProceedToPost?: () => void;
  initialVideoUrl?: string | null;
  onVideoReady?: (url: string | null) => void;
  externalCaptions?: Record<string, { line1: string; line2: string }> | null;
  lockedMode?: "generate" | "edit";
  isActive?: boolean;
}

const ACTIVE_VIDEO_JOB_KEY = "simotion_active_video_job";
const MAX_VIDEO_POLL_MS = 12 * 60 * 1000; // 12 minut limitu bezpieczeństwa

export const StudioTikTokView: React.FC<StudioTikTokViewProps> = ({
  productId,
  setProductId,
  showToast,
  onProceedToPost,
  initialVideoUrl = null,
  onVideoReady,
  externalCaptions = null,
  lockedMode,
  isActive = true,
}) => {
  // Primary Workspace Mode & 4-Step Wizard State
  const [workspaceMode, setWorkspaceMode] = useState<"generate" | "edit">(lockedMode || "generate");
  useEffect(() => {
    if (lockedMode) setWorkspaceMode(lockedMode);
  }, [lockedMode]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [genAspectRatio, setGenAspectRatio] = useState<"9:16" | "3:4" | "4:5" | "1:1" | "16:9">("9:16");

  // Video File & Upload State (for edit mode)
  const [videoFile, setVideoFile] = useState<string | null>(initialVideoUrl);
  useEffect(() => {
    onVideoReady?.(videoFile);
  }, [videoFile, onVideoReady]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Model & AI Generation Settings
  const [aiEngine, setAiEngine] = useState<VideoEngine>("seedance-2.5");
  const [videoResolution, setVideoResolution] = useState<"480p" | "720p" | "1080p">("720p");
  const [videoServerConfig, setVideoServerConfig] = useState<VideoServerConfig | null>(null);
  const [integrationMode, setIntegrationMode] = useState<"sandbox" | "live">("live");

  const [customBgmTracks, setCustomBgmTracks] = useState<StoredAsset[]>([]);
  const isMountedRef = useRef<boolean>(true);
  const videoObjectUrlRef = useRef<string | null>(null);
  const packshotBlobUrlsRef = useRef<string[]>([]);
  const userPickedIntroRef = useRef<boolean>(false);
  const userPickedOutroRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
        videoObjectUrlRef.current = null;
      }
      packshotBlobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      packshotBlobUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const cfg = readIntegrationsConfig();
    setAiEngine(normalizeVideoEngine(cfg.seedanceModel));
    setIntegrationMode(cfg.mode);
    fetchVideoServerConfig().then(setVideoServerConfig);
  }, []);

  // Odświeżaj własne BGM oraz domyślne Intro/Outro przy wejściu na zakładkę
  useEffect(() => {
    if (!isActive) return;
    loadCustomMediaAssets("audio").then(setCustomBgmTracks).catch(() => {});
    if (!userPickedIntroRef.current) {
      resolveDefaultLogoConfig("intro").then((defIntro) => {
        if (defIntro && isMountedRef.current) setSelectedIntroLogo(defIntro);
      }).catch(() => {});
    }
    if (!userPickedOutroRef.current) {
      resolveDefaultLogoConfig("outro").then((defOutro) => {
        if (defOutro && isMountedRef.current) setSelectedLogo(defOutro);
      }).catch(() => {});
    }
  }, [isActive]);
  const [genMode, setGenMode] = useState<"storyboard" | "single">("storyboard");
  const [template, setTemplate] = useState("TikTok try-on · 6 scen");
  const [prompt, setPrompt] = useState(
    "Dynamiczny try-on nowej kolekcji. Zbliżenia na fakturę materiału, naturalny ruch modelki w ciepłym świetle atelier i wyraziste zakończenie z produktem."
  );
  const [duration, setDuration] = useState(10);

  // Subtitles & Translations System (collapsible toggleable panel like audio dubbing)
  const [isSubtitlesEnabled, setIsSubtitlesEnabled] = useState<boolean>(false);
  const [subtitleMode, setSubtitleMode] = useState<"timeline" | "static">("timeline");
  const [captionYPercent, setCaptionYPercent] = useState<number>(64); // 64% is default lower-third safe zone
  const [captionFont, setCaptionFont] = useState<"euclid" | "sans" | "serif">("euclid");
  const [captionWeight, setCaptionWeight] = useState<"bold" | "semibold" | "medium">("bold");
  const [captionStyle, setCaptionStyle] = useState<"pill" | "shadow" | "tiktok_neon" | "clean">("pill");
  const [captionSize, setCaptionSize] = useState<"sm" | "base" | "lg">("base");

  // Formats & Smart Crop
  const [selectedRatios, setSelectedRatios] = useState<string[]>(["3x4", "9x16", "4x5", "1x1"]);
  const [cropOffset, setCropOffset] = useState(0); // -50% to +50%
  const [showSafeAreas, setShowSafeAreas] = useState(true);
  const [separateRender, setSeparateRender] = useState(false);

  // Audio & Languages - Sinsay 28 Markets
  const [selectedTextLangs, setSelectedTextLangs] = useState<string[]>(["PL", "ENG", "DE", "RO", "CZ"]);
  const [isDubEnabled, setIsDubEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("maja");
  const [selectedBgm, setSelectedBgm] = useState("runway");
  const [selectedDubLangs, setSelectedDubLangs] = useState<string[]>(["PL", "ENG"]);
  const [spokenVoiceoverScript, setSpokenVoiceoverScript] = useState<string>(
    "Hej dziewczyny! Zobaczcie tę nowość z kolekcji Sinsay. Krój układa się obłędnie, a materiał jest lekki jak chmurka. Sprawdźcie w aplikacji i salonach!"
  );

  // Video Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // AI Video Generation State (Pipeline ready for live wallet & API keys)
  const [isGeneratingAiVideo, setIsGeneratingAiVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");

  // Animated Sinsay Logo Intro & Outro (niezależne)
  const [isLogoIntroEnabled, setIsLogoIntroEnabled] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [previewIntroForce, setPreviewIntroForce] = useState(false);
  const [selectedIntroLogo, setSelectedIntroLogo] = useState<SelectedLogoConfig>({
    variantId: "intro_all",
    colorScheme: "white",
    filePath: "/brand/logo_anim/biale/logo_intro_all_WH.mov",
    gifPath: "/brand/logo_anim/biale/logo_intro_all_WH.gif",
    durationSec: 1.8,
    name: "Intro All (Białe)",
  });

  const [isLogoOutroEnabled, setIsLogoOutroEnabled] = useState(true);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [previewOutroForce, setPreviewOutroForce] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<SelectedLogoConfig>({
    variantId: "outro_all",
    colorScheme: "white",
    filePath: "/brand/logo_anim/biale/logo_outro_all_WH.mov",
    gifPath: "/brand/logo_anim/biale/logo_outro_all_WH.gif",
    durationSec: 2.0,
    name: "Outro All (Białe)",
  });

  // Real LPP PCM packshot assets state (wielokrotne MDK + selekcja konkretnych zdjęć)
  const [mdkCodes, setMdkCodes] = useState<string[]>([]);
  const [pcmAssets, setPcmAssets] = useState<PcmAsset[]>([]);
  const [isFetchingPcm, setIsFetchingPcm] = useState<boolean>(false);
  const [pcmFetchSource, setPcmFetchSource] = useState<"pcm" | "pdm" | "fallback" | null>(null);

  const selectedReferenceAssets = React.useMemo(
    () => pcmAssets.filter((a) => a.selected !== false),
    [pcmAssets]
  );

  const toggleAssetSelection = (id: string) => {
    setPcmAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: a.selected === false } : a))
    );
  };

  const selectAllAssets = (selected: boolean) => {
    setPcmAssets((prev) => prev.map((a) => ({ ...a, selected })));
  };

  const removeMdkGroup = (mdkToRemove: string) => {
    setMdkCodes((prev) => prev.filter((c) => c !== mdkToRemove));
    setPcmAssets((prev) => prev.filter((a) => a.mdk !== mdkToRemove));
  };

  const handleFetchPcm = async () => {
    const raw = (productId || "").trim();
    if (!raw) {
      showToast("Wpisz najpierw kod artykułu MDK (np. 001KR-83X).");
      return;
    }
    const cleanCode = raw.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, "").toUpperCase();
    setIsFetchingPcm(true);
    try {
      const res = await fetch(`/api/pcm?mdk=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.assets) && data.assets.length > 0) {
        const tagged: PcmAsset[] = data.assets.map((a: PcmAsset, idx: number) => ({
          ...a,
          id: `${cleanCode}-${a.id || idx}-${Date.now()}`,
          mdk: cleanCode,
          selected: true,
        }));
        setMdkCodes((prev) => (prev.includes(cleanCode) ? prev : [...prev, cleanCode]));
        setPcmAssets((prev) => {
          // Zastąp wcześniejsze zdjęcia tego samego MDK, ale zachowaj inne MDK i uploady z dysku
          const others = prev.filter((item) => item.mdk !== cleanCode);
          return [...others, ...tagged];
        });
        setPcmFetchSource(data.source);
        showToast(`✓ Dodano ${tagged.length} zdjęć z PCM dla MDK: ${cleanCode}!`);
      } else {
        showToast(data.message || `Nie znaleziono zdjęć w PCM dla MDK: ${cleanCode}.`);
      }
    } catch (err: any) {
      showToast("Błąd pobierania z PCM: " + err.message);
    } finally {
      setIsFetchingPcm(false);
    }
  };

  const localPackshotInputRef = useRef<HTMLInputElement | null>(null);

  const maxAllowedDuration = aiEngine === "seedance-2.0" ? 15 : 30;
  const maxReferenceImages = aiEngine === "seedance-2.0" ? 9 : 12;

  const safeSku = React.useMemo(() => {
    const candidate = (productId || mdkCodes[0] || "Sinsay_Clip").trim();
    return candidate.replace(/[^a-zA-Z0-9_-]/g, "_") || "Sinsay_Clip";
  }, [productId, mdkCodes]);

  const resolveActiveBgmSrc = (): string | undefined => {
    if (selectedBgm === "none") return undefined;
    const custom = customBgmTracks.find((t) => t.id === selectedBgm);
    if (custom) return custom.url || custom.dataUrl;
    if (selectedBgm === "lofi") return "/audio/atelier_lofi.m4a";
    return "/audio/runway_house.m4a";
  };

  const handleUploadLocalPackshots = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAssets: PcmAsset[] = Array.from(files).map((f, i) => {
      const url = URL.createObjectURL(f);
      packshotBlobUrlsRef.current.push(url);
      return {
        id: `local-${Date.now()}-${i}`,
        label: f.name.replace(/\.[^/.]+$/, ""),
        filename: f.name,
        url,
        source: "pcm",
        type: "packshot",
        mdk: "Z dysku",
        selected: true,
      };
    });
    setPcmAssets((prev) => [...prev, ...newAssets]);
    setPcmFetchSource("pcm");
    showToast(`✓ Dodano ${newAssets.length} packshotów z dysku!`);
    e.target.value = "";
  };

  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([
    {
      id: "cue-1",
      startSec: 0.0,
      endSec: 2.5,
      type: "hook",
      label: "01 Hook (0.0–2.5 s)",
      text: "Nowa kolekcja jedwabna",
      line2: "Sprawdź ten look",
      translations: {
        PL: { line1: "Nowa kolekcja jedwabna", line2: "Sprawdź ten look" },
        ENG: { line1: "New Silk Collection", line2: "Check this look" },
        DE: { line1: "Neue Seidenkollektion", line2: "Entdecke diesen Look" },
        RO: { line1: "Colecție nouă de mătase", line2: "Vezi acest look" },
        CZ: { line1: "Nová hedvábná kolekce", line2: "Podívej se na tenhle look" },
        SK: { line1: "Nová hodvábna kolekcia", line2: "Pozri si tento look" },
        HU: { line1: "Új selyem kollekció", line2: "Nézd meg ezt a szettet" },
        IT: { line1: "Nuova collezione in seta", line2: "Scopri questo look" },
      },
    },
    {
      id: "cue-2",
      startSec: 2.5,
      endSec: 5.5,
      type: "speech",
      label: "02 Kwestia mówiona (2.5–5.5 s)",
      text: "Lekki krój, który układa się",
      line2: "idealnie w naturalnym ruchu",
      translations: {
        PL: { line1: "Lekki krój, który układa się", line2: "idealnie w naturalnym ruchu" },
        ENG: { line1: "Flowing fit that moves", line2: "gracefully with every step" },
        DE: { line1: "Leichter fließender Schnitt", line2: "perfekt in Bewegung" },
        RO: { line1: "Croială lejeră și fină", line2: "se așază impecabil în mișcare" },
        CZ: { line1: "Lehký splývavý střih", line2: "perfektně sedí v pohybu" },
      },
    },
    {
      id: "cue-3",
      startSec: 5.5,
      endSec: 8.0,
      type: "feature",
      label: "03 Detal & Jakość (5.5–8.0 s)",
      text: "Naturalny splot i subtelny połysk",
      line2: "stylizacje dzień i noc",
      translations: {
        PL: { line1: "Naturalny splot i subtelny połysk", line2: "stylizacje dzień i noc" },
        ENG: { line1: "Natural weave & subtle shine", line2: "day to night styling" },
        DE: { line1: "Natürliche Textur und Glanz", line2: "Tag und Nacht tragbar" },
        RO: { line1: "Țesătură naturală și luciu fin", line2: "pentru zi și seară" },
        CZ: { line1: "Přírodní vazba a jemný lesk", line2: "pro den i noc" },
      },
    },
    {
      id: "cue-4",
      startSec: 8.0,
      endSec: 10.0,
      type: "cta",
      label: "04 Outro & CTA (8.0–10.0 s)",
      text: "Kup teraz w aplikacji",
      line2: "Sinsay · Great Fashion",
      translations: {
        PL: { line1: "Kup teraz w aplikacji", line2: "Sinsay · Great Fashion" },
        ENG: { line1: "Shop now in app", line2: "Sinsay · Great Fashion" },
        DE: { line1: "Jetzt in der App shoppen", line2: "Sinsay · Great Fashion" },
        RO: { line1: "Cumpără acum în aplicație", line2: "Sinsay · Great Fashion" },
        CZ: { line1: "Nakupuj v aplikaci", line2: "Sinsay · Great Fashion" },
      },
    },
  ]);
  const [selectedCueId, setSelectedCueId] = useState<string>("cue-1");

  // Subtitles Copy Matrix per Market (Sinsay 4524 phrases integration)
  const [videoCaptions, setVideoCaptions] = useState<Record<string, { line1: string; line2: string }>>({
    PL: { line1: "Nowa kolekcja", line2: "na Twój sposób" },
    ENG: { line1: "New Collection", line2: "your way" },
    DE: { line1: "Neue Kollektion", line2: "dein Stil" },
    RO: { line1: "Colecție nouă", line2: "în stilul tău" },
    CZ: { line1: "Nová kolekce", line2: "po tvém" },
    SK: { line1: "Nová kolekcia", line2: "podľa teba" },
    HU: { line1: "Új kollekció", line2: "a te stílusodban" },
    IT: { line1: "Nuova collezione", line2: "a modo tuo" },
    GR: { line1: "Νέα συλλογή", line2: "με το δικό σου στυλ" },
    HR: { line1: "Nova kolekcija", line2: "na tvoj način" },
    BG: { line1: "Нова колекция", line2: "по твоя начин" },
    SI: { line1: "Nova kolekcija", line2: "po tvoje" },
    UA: { line1: "Нова колекція", line2: "на твій смак" },
  });

  useEffect(() => {
    if (externalCaptions) {
      setVideoCaptions((prev) => ({ ...prev, ...externalCaptions }));
      setIsSubtitlesEnabled(true);
      setSubtitleMode("static");
    }
  }, [externalCaptions]);
  const [previewLang, setPreviewLang] = useState<string>("PL");
  const [showPhraseAssistant, setShowPhraseAssistant] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  // Hardcoded Subtitles In-Browser Burning Engine State
  const [isBurningVideo, setIsBurningVideo] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [burnStatus, setBurnStatus] = useState<string>("");

  const buildCuesForLang = (lang: string) => {
    if (!isSubtitlesEnabled) return [];
    if (subtitleMode === "static") {
      const cap = videoCaptions[lang] || videoCaptions["ENG"] || videoCaptions["PL"] || { line1: "", line2: "" };
      if (!cap.line1 && !cap.line2) return [];
      return [
        {
          startSec: 0,
          endSec: Math.max(duration, 10),
          text: cap.line1,
          line2: cap.line2 || "",
        },
      ];
    }
    return subtitleCues.map((c) => ({
      startSec: c.startSec,
      endSec: c.endSec,
      text: c.translations?.[lang]?.line1 || c.translations?.["ENG"]?.line1 || c.text,
      line2: c.translations?.[lang]?.line2 || c.translations?.["ENG"]?.line2 || c.line2 || "",
    }));
  };

  const handleBurnAndDownloadSingleVideo = async (
    ratio: "9:16" | "3:4" | "4:5" | "1:1" = "9:16",
    onlyCrop = false
  ) => {
    if (!videoFile) {
      showToast("Wgraj plik wideo lub wygeneruj klip AI, aby wyeksportować format.");
      return;
    }

    setIsBurningVideo(true);
    setBurnProgress(0);
    setBurnStatus(onlyCrop ? `Kadrowanie wideo do formatu ${ratio}...` : "Inicjalizacja silnika renderującego klatki...");

    try {
      const mappedCues = onlyCrop || !isSubtitlesEnabled ? [] : buildCuesForLang(previewLang);
      const activeBgmSrc = isDubEnabled ? resolveActiveBgmSrc() : undefined;

      const blob = await burnSubtitlesToVideo({
        videoSrc: videoFile,
        targetRatio: ratio,
        cropOffsetPercent: cropOffset,
        cues: mappedCues,
        captionConfig: {
          yPercent: captionYPercent,
          font: captionFont,
          weight: captionWeight,
          style: captionStyle,
          size: captionSize,
        },
        durationSec: duration,
        playbackSpeed: 1.0,
        bgmAudioSrc: activeBgmSrc,
        logoIntro: isLogoIntroEnabled
          ? {
              imageSrc: selectedIntroLogo.gifPath,
              durationSec: selectedIntroLogo.durationSec,
            }
          : undefined,
        logoOutro: isLogoOutroEnabled
          ? {
              imageSrc: selectedLogo.gifPath,
              durationSec: selectedLogo.durationSec,
            }
          : undefined,
        onProgress: (pct, msg) => {
          setBurnProgress(pct);
          setBurnStatus(msg);
        },
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = getVideoExtension(blob);
      const suffix = mappedCues.length > 0 ? `${previewLang}_Wypalone_Napisy` : "Clean";
      a.download = `Sinsay_${safeSku}_${ratio.replace(":", "x")}_${suffix}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`✓ Pobrano wideo w formacie ${ratio}!`);
    } catch (err: any) {
      console.error("Burn video error:", err);
      showToast("Błąd podczas renderowania formatu: " + err.message);
    } finally {
      setIsBurningVideo(false);
    }
  };

  // Active cue based on current video playback timestamp
  const activeCue = subtitleCues.find(
    (c) => currentTime >= c.startSec && currentTime < c.endSec
  );

  const selectedCue = subtitleCues.find((c) => c.id === selectedCueId) || subtitleCues[0];

  const currentCaption = videoCaptions[previewLang] || videoCaptions["PL"] || {
    line1: "Nowa kolekcja",
    line2: "na Twój sposób",
  };

  const activeSubtitleText = isSubtitlesEnabled
    ? (activeCue
        ? (activeCue.translations?.[previewLang]?.line1 || activeCue.text)
        : (subtitleMode === "static" ? currentCaption.line1 : ""))
    : "";

  const activeSubtitleLine2 = isSubtitlesEnabled
    ? (activeCue
        ? (activeCue.translations?.[previewLang]?.line2 || activeCue.line2 || "")
        : (subtitleMode === "static" ? currentCaption.line2 : ""))
    : "";

  // AI Generator: Creates timed subtitle plan directly from video prompt and storyboard
  const generateCuesFromPrompt = () => {
    const clean = prompt.trim();
    const parts = clean.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 3);
    const cueCount = Math.max(3, Math.min(5, parts.length || 3));
    const effectiveDur = duration - (isLogoOutroEnabled ? selectedLogo.durationSec : 0);
    const step = effectiveDur / cueCount;

    const newCues: SubtitleCue[] = [];
    for (let i = 0; i < cueCount; i++) {
      const start = Number((i * step).toFixed(1));
      const end = Number(((i + 1) * step).toFixed(1));
      const textRaw = parts[i] || (i === 0 ? "Nowa kolekcja Sinsay" : i === cueCount - 1 ? "Odkryj teraz w aplikacji Sinsay" : "Wyjątkowy krój i naturalny ruch");
      
      const words = textRaw.split(" ");
      let l1 = textRaw;
      let l2 = "";
      if (words.length > 5) {
        const mid = Math.ceil(words.length / 2);
        l1 = words.slice(0, mid).join(" ");
        l2 = words.slice(mid).join(" ");
      }

      newCues.push({
        id: `cue-${Date.now()}-${i + 1}`,
        startSec: start,
        endSec: end,
        type: i === 0 ? "hook" : i === cueCount - 1 ? "cta" : i === 1 ? "speech" : "feature",
        label: i === 0 ? `01 Hook (${start}–${end}s)` : i === cueCount - 1 ? `0${i + 1} Outro CTA (${start}–${end}s)` : `0${i + 1} Kwestia (${start}–${end}s)`,
        text: l1,
        line2: l2,
        translations: {
          PL: { line1: l1, line2: l2 },
          ENG: { line1: l1, line2: l2 },
        },
      });
    }

    setSubtitleCues(newCues);
    setSelectedCueId(newCues[0]?.id || "");
    showToast(`✓ Wygenerowano plan ${newCues.length} segmentów napisów z promptu wideo!`);
  };

  // AI Generator: Syncs subtitles 1:1 with spoken TikTok voiceover text
  const syncSubtitlesWithVoiceover = () => {
    const clean = spokenVoiceoverScript.trim();
    if (!clean) {
      showToast("Wpisz najpierw tekst lektora do zsynchronizowania.");
      return;
    }

    const sentences = clean.split(/[,.!?]+/).map((s) => s.trim()).filter((s) => s.length > 2);
    const count = Math.max(2, Math.min(6, sentences.length));
    const effectiveDuration = duration - (isLogoOutroEnabled ? selectedLogo.durationSec : 0);
    const step = effectiveDuration / count;

    const newCues: SubtitleCue[] = sentences.map((phrase, idx) => {
      const start = Number((idx * step).toFixed(1));
      const end = Number(((idx + 1) * step).toFixed(1));

      return {
        id: `cue-voice-${Date.now()}-${idx + 1}`,
        startSec: start,
        endSec: end,
        type: idx === 0 ? "hook" : idx === count - 1 ? "cta" : "speech",
        label: idx === 0 ? `01 Hook (${start}–${end}s)` : `0${idx + 1} Kwestia mówiona (${start}–${end}s)`,
        text: phrase,
        line2: "",
        translations: {
          PL: { line1: phrase },
          ENG: { line1: phrase },
        },
      };
    });

    setSubtitleCues(newCues);
    setSelectedCueId(newCues[0]?.id || "");
    showToast(`✓ Zsynchronizowano napisy z kwestią mówioną lektora (${newCues.length} segmentów)!`);
  };

  const handleApplyPhrase = (item: SinsayMatchItem) => {
    const splitText = (txt: string) => {
      const clean = (txt || "").trim();
      const parts = clean.split(/[,·•|-]/);
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        return { line1: parts[0].trim(), line2: parts.slice(1).join(" ").trim() };
      }
      const words = clean.split(" ");
      if (words.length >= 4) {
        const mid = Math.ceil(words.length / 2);
        return { line1: words.slice(0, mid).join(" "), line2: words.slice(mid).join(" ") };
      }
      return { line1: clean, line2: "" };
    };

    if (subtitleMode === "timeline" && selectedCue) {
      const parsedPL = splitText(item.pl);
      const enText = item.en || item.translations?.["ENG"] || item.pl;
      const parsedEN = splitText(enText);

      const transMap: Record<string, { line1: string; line2?: string }> = {
        PL: parsedPL,
        ENG: parsedEN,
      };

      if (item.translations) {
        Object.entries(item.translations).forEach(([mCode, trans]) => {
          if (trans) transMap[mCode] = splitText(trans);
        });
      }

      setSubtitleCues((prev) =>
        prev.map((c) =>
          c.id === selectedCue.id
            ? {
                ...c,
                text: parsedPL.line1,
                line2: parsedPL.line2,
                translations: transMap,
              }
            : c
        )
      );
      showToast(`Zastosowano hasło Sinsay do segmentu "${selectedCue.label}": "${item.pl}"!`);
    } else {
      const newCaptions: Record<string, { line1: string; line2: string }> = { ...videoCaptions };
      newCaptions["PL"] = splitText(item.pl);
      const enText = item.en || item.translations?.["ENG"] || item.pl;
      newCaptions["ENG"] = splitText(enText);

      if (item.translations) {
        Object.entries(item.translations).forEach(([mCode, trans]) => {
          if (trans) {
            newCaptions[mCode] = splitText(trans);
          }
        });
      }
      setVideoCaptions(newCaptions);
      showToast(`Zastosowano hasło Sinsay: "${item.pl}" dla wszystkich rynków!`);
    }

    setShowPhraseAssistant(false);
  };

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const buildDaVinciFCPXML = (lang: string) => {
    const cues = buildCuesForLang(lang);
    const totalFrames = Math.max(1, Math.round(duration * 30));
    const titleNodes =
      cues.length > 0
        ? cues
            .map((c, idx) => {
              const offsetFrames = Math.max(0, Math.round(c.startSec * 30));
              const durFrames = Math.max(15, Math.round((c.endSec - c.startSec) * 30));
              const fullText = c.line2 ? `${c.text}\n${c.line2}` : c.text;
              return `            <title ref="r2" offset="${offsetFrames}/30s" name="Subtitle_${idx + 1}_${lang}" start="0s" duration="${durFrames}/30s">
              <text>
                <text-style font="Euclid Circular B" fontSize="48" fontFace="Bold" alignment="center">${escapeXml(fullText)}</text-style>
              </text>
            </title>`;
            })
            .join("\n")
        : `            <title ref="r2" offset="0s" name="Sinsay_Title_${lang}" start="0s" duration="${totalFrames}/30s">
              <text>
                <text-style font="Euclid Circular B" fontSize="48" fontFace="Bold" alignment="center">${escapeXml(productId || "Sinsay Kolekcja")}</text-style>
              </text>
            </title>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p1920" frameDuration="1/30s" width="1080" height="1920"/>
    <effect id="r2" name="Text" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>
  <library>
    <event name="Sinsay Fashion Studio (${escapeXml(productId || "MDK")})">
      <project name="Sinsay_${escapeXml(productId || "Master")}_${lang}_9x16">
        <sequence format="r1" duration="${totalFrames}/30s" tcStart="0s" tcFormat="NDF">
          <spine>
            <gap offset="0s" name="Master_Track_9x16" start="0s" duration="${totalFrames}/30s">
${titleNodes}
            </gap>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
  };

  const handleExportDaVinciFCPXML = () => {
    const fcpxml = buildDaVinciFCPXML(previewLang);
    const blob = new Blob([fcpxml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sinsay_${safeSku}_DaVinci_${previewLang}_9x16.fcpxml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`✓ Pobrano oś czasu DaVinci Resolve (.fcpxml) dla ${previewLang}!`);
  };

  const getSubtitleStyleClasses = () => {
    let classes = "";
    if (captionFont === "euclid") classes += " font-sinsay ";
    else if (captionFont === "serif") classes += " font-serif ";
    else classes += " font-sans ";

    if (captionWeight === "bold") classes += " font-extrabold ";
    else if (captionWeight === "semibold") classes += " font-semibold ";
    else classes += " font-medium ";

    if (captionSize === "sm") classes += " text-[10px] sm:text-xs ";
    else if (captionSize === "lg") classes += " text-sm sm:text-base tracking-wide ";
    else classes += " text-xs sm:text-sm ";

    if (captionStyle === "pill") {
      classes += " bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/20 shadow-lg ";
    } else if (captionStyle === "shadow") {
      classes += " text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] stroke-black px-2 ";
    } else if (captionStyle === "tiktok_neon") {
      classes += " bg-[#ffee00] text-black font-black px-2.5 py-1 rounded shadow-[0_4px_12px_rgba(255,238,0,0.4)] ";
    } else {
      classes += " bg-black/90 text-white px-3 py-1 rounded-sm shadow-md border-l-2 border-[#7c5cff] ";
    }

    return classes;
  };

  // Format time helpers for SRT export
  const formatSrtTime = (sec: number) => {
    const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, "0");
    const hours = pad(sec / 3600);
    const minutes = pad((sec % 3600) / 60);
    const seconds = pad(sec % 60);
    const millis = String(Math.floor((sec % 1) * 1000)).padStart(3, "0");
    return `${hours}:${minutes}:${seconds},${millis}`;
  };

  const formatVttTime = (sec: number) => {
    const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, "0");
    const minutes = pad((sec % 3600) / 60);
    const seconds = pad(sec % 60);
    const millis = String(Math.floor((sec % 1) * 1000)).padStart(3, "0");
    return `${minutes}:${seconds}.${millis}`;
  };

  // Direct 1-Click SRT Downloader
  const handleDownloadSrtOnly = (lang = previewLang) => {
    let srtContent = "";
    if (subtitleMode === "timeline" && subtitleCues.length > 0) {
      subtitleCues.forEach((cue, idx) => {
        const trans = cue.translations?.[lang];
        const l1 = trans?.line1 || cue.text;
        const l2 = trans?.line2 || cue.line2 || "";
        const textContent = l2 ? `${l1}\n${l2}` : l1;
        srtContent += `${idx + 1}\n${formatSrtTime(cue.startSec)} --> ${formatSrtTime(cue.endSec)}\n${textContent}\n\n`;
      });
    } else {
      const cap = videoCaptions[lang] || videoCaptions["PL"] || { line1: "Nowa kolekcja", line2: "na Twój sposób" };
      const endTs = formatSrtTime(Math.max(3, duration));
      srtContent = `1\n00:00:00,000 --> 00:00:02,500\n${cap.line1}\n${cap.line2}\n\n2\n00:00:02,550 --> ${endTs}\nSinsay — modne stylizacje w najlepszych cenach.\n`;
    }

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sinsay_${safeSku}_subtitles_${lang.toLowerCase()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`✓ Pobrano plik napisów .SRT dla rynku [${lang}]!`);
  };

  // Quick Export 4 Formats (ZIP)
  const handleQuickExportZip = async () => {
    setIsExportingZip(true);
    showToast("Generowanie paczki ZIP z 4 formatami i zasobami...");

    try {
      const zip = new JSZip();
      const folderName = `Sinsay_${safeSku}_Video_Package`;
      const root = zip.folder(folderName) || zip;

      // 1. Manifest
      const manifest = {
        sku: safeSku,
        brand: "Sinsay (LPP SA)",
        workspaceMode,
        videoSource: uploadedFileName ? `Własny plik: ${uploadedFileName}` : `Silnik AI: ${aiEngine}`,
        durationSec: duration,
        cropOffsetPercent: cropOffset,
        subtitlesEnabled: isSubtitlesEnabled,
        captionConfig: isSubtitlesEnabled ? {
          yPercent: captionYPercent,
          font: captionFont,
          style: captionStyle,
          weight: captionWeight,
        } : null,
        formatsIncluded: [
          { ratio: "3:4", resolution: "1440x1920", useCase: "Master Fashion Base (Sinsay E-Com)" },
          { ratio: "9:16", resolution: "1080x1920", useCase: "TikTok / Reels / Shorts (Side Crop)" },
          { ratio: "4:5", resolution: "1080x1350", useCase: "Meta Feed Smart Crop" },
          { ratio: "1:1", resolution: "1080x1080", useCase: "Kwadrat / Karuzele" },
        ],
        textLanguages: isSubtitlesEnabled ? selectedTextLangs : [],
        timestamp: new Date().toISOString(),
      };
      root.file("manifest.json", JSON.stringify(manifest, null, 2));

      // 2. Fetch and add selected animated logo
      if (isLogoOutroEnabled && selectedLogo.gifPath) {
        try {
          const logoRes = await fetch(selectedLogo.gifPath);
          if (logoRes.ok) {
            const logoBlob = await logoRes.blob();
            const logoFileName = selectedLogo.gifPath.split("/").pop() || "logo_outro.gif";
            root.file(`03_Brand_Kit_Outro/${logoFileName}`, logoBlob);
          }
        } catch (e) {
          console.warn("Logo fetch failed", e);
        }
      }

      // Generate SRT / VTT contents per language
      const srtMap: Record<string, { srt: string; vtt: string }> = {};
      if (isSubtitlesEnabled) {
        selectedTextLangs.forEach((lang) => {
          let srtContent = "";
          let vttContent = "WEBVTT\n\n";

          if (subtitleMode === "timeline" && subtitleCues.length > 0) {
            subtitleCues.forEach((cue, idx) => {
              const trans = cue.translations?.[lang];
              const l1 = trans?.line1 || cue.text;
              const l2 = trans?.line2 || cue.line2 || "";
              const textContent = l2 ? `${l1}\n${l2}` : l1;

              srtContent += `${idx + 1}\n${formatSrtTime(cue.startSec)} --> ${formatSrtTime(cue.endSec)}\n${textContent}\n\n`;
              vttContent += `${idx + 1}\n${formatVttTime(cue.startSec)} --> ${formatVttTime(cue.endSec)}\n${textContent}\n\n`;
            });
          } else {
            const cap = videoCaptions[lang] || videoCaptions["PL"] || { line1: "Nowa kolekcja", line2: "na Twój sposób" };
            const l1 = cap.line1 || "Nowa kolekcja";
            const l2 = cap.line2 || "na Twój sposób";
            const endTs = formatSrtTime(Math.max(3, duration));
            srtContent = `1\n00:00:00,000 --> 00:00:02,500\n${l1}\n${l2}\n\n2\n00:00:02,550 --> ${endTs}\nSinsay — modne stylizacje w najlepszych cenach.\n`;
            vttContent = `WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.500\n${l1}\n${l2}\n`;
          }

          srtMap[lang] = { srt: srtContent, vtt: vttContent };

          // Separate folder with all SRT/VTT for Premiere / DaVinci / TikTok import
          root.file(`02_Napisy_SRT_VTT/napisy_${lang.toLowerCase()}.srt`, srtContent);
          root.file(`02_Napisy_SRT_VTT/napisy_${lang.toLowerCase()}.vtt`, vttContent);
        });
      }

      // 4. Video files organized into Clean Master and Market Subtitled folders
      if (videoFile) {
        try {
          const vRes = await fetch(videoFile);
          const vBlob = await vRes.blob();

          const ratioSpecs: Array<{
            key: string;
            targetRatio: "3:4" | "9:16" | "4:5" | "1:1";
            cleanBase: string;
            marketBase: (lang: string) => string;
          }> = [
            {
              key: "3x4",
              targetRatio: "3:4",
              cleanBase: "00_Master_3x4_Clean",
              marketBase: (lang) => `00_Master_3x4_${lang}`,
            },
            {
              key: "9x16",
              targetRatio: "9:16",
              cleanBase: "01_Vertical_9x16_TikTok_Clean",
              marketBase: (lang) => `01_Vertical_9x16_TikTok_${lang}_Napisy_Wypalone`,
            },
            {
              key: "4x5",
              targetRatio: "4:5",
              cleanBase: "02_Feed_4x5_IG_Clean",
              marketBase: (lang) => `02_Feed_4x5_${lang}`,
            },
            {
              key: "1x1",
              targetRatio: "1:1",
              cleanBase: "03_Square_1x1_Catalog_Clean",
              marketBase: (lang) => `03_Square_1x1_${lang}`,
            },
          ];

          const activeSpecs = ratioSpecs.filter((r) => selectedRatios.includes(r.key));
          const specsToRender = activeSpecs.length > 0 ? activeSpecs : [ratioSpecs[1]];

          setIsBurningVideo(true);
          setBurnProgress(0);

          const activeBgmSrc = isDubEnabled ? resolveActiveBgmSrc() : undefined;

          const totalSteps =
            specsToRender.length +
            (isSubtitlesEnabled && selectedTextLangs.length > 0
              ? selectedTextLangs.length * specsToRender.length
              : 0);
          let completedSteps = 0;

          // 00: Czyste formaty bez napisów — renderujemy każdy wybrany format w jego docelowych proporcjach
          const cleanBlobs: Record<string, Blob> = {};
          for (const spec of specsToRender) {
            setBurnStatus(`Kadrowanie ${spec.targetRatio} (${spec.cleanBase}) — nie przełączaj karty...`);
            try {
              const croppedBlob = await burnSubtitlesToVideo({
                videoSrc: videoFile,
                targetRatio: spec.targetRatio,
                cropOffsetPercent: cropOffset,
                cues: [],
                captionConfig: {
                  yPercent: captionYPercent,
                  font: captionFont,
                  weight: captionWeight,
                  style: captionStyle,
                  size: captionSize,
                },
                durationSec: duration,
                playbackSpeed: 1.0,
                bgmAudioSrc: activeBgmSrc,
                logoIntro: isLogoIntroEnabled
                  ? {
                      imageSrc: selectedIntroLogo.gifPath,
                      durationSec: selectedIntroLogo.durationSec,
                    }
                  : undefined,
                logoOutro: isLogoOutroEnabled
                  ? {
                      imageSrc: selectedLogo.gifPath,
                      durationSec: selectedLogo.durationSec,
                    }
                  : undefined,
                onProgress: (subPct) => {
                  const overall = Math.round(((completedSteps + subPct / 100) / totalSteps) * 100);
                  setBurnProgress(overall);
                },
              });
              cleanBlobs[spec.key] = croppedBlob;
              const ext = getVideoExtension(croppedBlob);
              root.file(`00_Czyste_Bez_Napisow/${spec.cleanBase}.${ext}`, croppedBlob);
            } catch (cleanErr) {
              console.warn(`Błąd kadrowania czystego formatu ${spec.targetRatio}:`, cleanErr);
              cleanBlobs[spec.key] = vBlob;
              root.file(`00_Czyste_Bez_Napisow/${spec.cleanBase}.mp4`, vBlob);
            }
            completedSteps++;
            setBurnProgress(Math.round((completedSteps / totalSteps) * 100));
          }

          // 01: Wersje rynkowe z automatycznie wypalonymi napisami per rynek i per format
          if (isSubtitlesEnabled && selectedTextLangs.length > 0) {
            for (let i = 0; i < selectedTextLangs.length; i++) {
              const lang = selectedTextLangs[i];
              const langFolder = `01_Wersje_Rynkowe_Z_Napisami/${lang}`;
              const marketCues = buildCuesForLang(lang);

              for (const spec of specsToRender) {
                setBurnStatus(
                  `[${i + 1}/${selectedTextLangs.length}] Wypalanie ${lang} (${spec.targetRatio}) — nie przełączaj karty...`
                );
                try {
                  const burnedBlob = await burnSubtitlesToVideo({
                    videoSrc: videoFile,
                    targetRatio: spec.targetRatio,
                    cropOffsetPercent: cropOffset,
                    cues: marketCues,
                    captionConfig: {
                      yPercent: captionYPercent,
                      font: captionFont,
                      weight: captionWeight,
                      style: captionStyle,
                      size: captionSize,
                    },
                    durationSec: duration,
                    playbackSpeed: 1.0,
                    bgmAudioSrc: activeBgmSrc,
                    logoIntro: isLogoIntroEnabled
                      ? {
                          imageSrc: selectedIntroLogo.gifPath,
                          durationSec: selectedIntroLogo.durationSec,
                        }
                      : undefined,
                    logoOutro: isLogoOutroEnabled
                      ? {
                          imageSrc: selectedLogo.gifPath,
                          durationSec: selectedLogo.durationSec,
                        }
                      : undefined,
                    onProgress: (subPct) => {
                      const overall = Math.round(((completedSteps + subPct / 100) / totalSteps) * 100);
                      setBurnProgress(overall);
                    },
                  });
                  const ext = getVideoExtension(burnedBlob);
                  root.file(`${langFolder}/${spec.marketBase(lang)}.${ext}`, burnedBlob);
                } catch (burnErr) {
                  console.warn(`Błąd wypalania dla ${lang} (${spec.targetRatio}):`, burnErr);
                  const fallbackBlob = cleanBlobs[spec.key] || vBlob;
                  const ext = getVideoExtension(fallbackBlob);
                  root.file(`${langFolder}/${spec.marketBase(lang)}.${ext}`, fallbackBlob);
                }
                completedSteps++;
                setBurnProgress(Math.round((completedSteps / totalSteps) * 100));
              }

              if (srtMap[lang]) {
                root.file(`${langFolder}/napisy_${lang.toLowerCase()}.srt`, srtMap[lang].srt);
                root.file(`${langFolder}/napisy_${lang.toLowerCase()}.vtt`, srtMap[lang].vtt);
              }
            }

            setBurnProgress(100);
            setBurnStatus("Wszystkie formaty i wersje rynkowe wypalone! Generowanie pliku ZIP...");
          } else {
            setBurnProgress(100);
            setBurnStatus("Czyste formaty skadrowane! Generowanie pliku ZIP...");
          }
        } catch (e) {
          root.file("00_Czyste_Bez_Napisow/README.txt", "Wideo zmontowane z pliku: " + (uploadedFileName || "upload"));
        }
      } else {
        const videoSpecs = `SiMotion Video Production Render Specifications\n` +
          `===================================================\n` +
          `SKU: ${safeSku}\n` +
          `Tryb: ${workspaceMode === "generate" ? "Generator AI " + aiEngine : "Montaż wideo z pliku"}\n` +
          `Napisy: ${isSubtitlesEnabled ? "Włączone (Font: Euclid Circular B LPP SA)" : "Wyłączone (Czyste wideo)"}\n` +
          `Pozycja pionowa napisów (Oś Y): ${captionYPercent}% Safe Zone\n` +
          `Styl napisów: ${captionStyle} (${captionFont})\n` +
          `Rynki docelowe: ${isSubtitlesEnabled ? selectedTextLangs.join(", ") : "Brak"}\n` +
          `Struktura paczki produkcyjnej:\n` +
          `  ├── 00_Czyste_Bez_Napisow/ (Formaty 3:4, 9:16, 4:5, 1:1 bez napisów)\n` +
          `  ├── 01_Wersje_Rynkowe_Napisy/ (Katalog per rynek PL, RO, CZ... z formatami wideo i powiązanymi napisami)\n` +
          `  ├── 02_Napisy_SRT_VTT/ (Surowe pliki .srt i .vtt do DaVinci Resolve / Premiere / TikToka)\n` +
          `  └── 03_Brand_Kit_Outro/ (Oficjalne animowane logo outro)\n` +
          `Logo Outro Animation: ${isLogoOutroEnabled ? selectedLogo.name : "Wyłączone"}\n` +
          `Date: ${new Date().toISOString()}\n`;
        root.file("specyfikacja_renderu.txt", videoSpecs);
      }

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Sinsay_${safeSku}_Campaign_Package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast("✓ Pobrano paczkę formatów (ZIP)!");
    } catch (err) {
      console.error("ZIP export failed:", err);
      showToast("Błąd podczas generowania paczki ZIP.");
    } finally {
      setIsExportingZip(false);
      setIsBurningVideo(false);
    }
  };

  // Modular Storyboard Scenes (for generate mode)
  const [scenes, setScenes] = useState<StoryboardScene[]>([
    {
      id: "sc-1",
      name: "01 Hook",
      timeRange: "0.0–1.4 s",
      prompt: "Dynamiczne wejście modelki w kadr, ciepłe światło atelier, wzrok w obiektyw.",
      pcmImage: "model_full.jpg",
      durationSec: 1.4,
    },
    {
      id: "sc-2",
      name: "02 Sylwetka",
      timeRange: "1.4–3.2 s",
      prompt: "Prezentacja pełnego kroju sukienki midi w swobodnym kroku na neutralnym tle.",
      pcmImage: "model_full.jpg",
      durationSec: 1.8,
    },
    {
      id: "sc-3",
      name: "03 Detal tkaniny",
      timeRange: "3.2–5.0 s",
      prompt: "Makro zbliżenie na splot jedwabiu, szwy wykończeniowe i miękkie załamania światła.",
      pcmImage: "detail_fabric.jpg",
      durationSec: 1.8,
    },
    {
      id: "sc-4",
      name: "04 Ruch",
      timeRange: "5.0–7.0 s",
      prompt: "Lekki obrót modelki, tkanina unosi się w ruchu, naturalna dynamika materiału.",
      pcmImage: "model_full.jpg",
      durationSec: 2.0,
    },
    {
      id: "sc-5",
      name: "05 Hero Shot",
      timeRange: "7.0–8.6 s",
      prompt: "Mocny kadr półzbliżenia z uśmiechem, produkt doskonale wyeksponowany.",
      pcmImage: "packshot_front.jpg",
      durationSec: 1.6,
    },
    {
      id: "sc-6",
      name: "06 Outro + CTA",
      timeRange: "8.6–10.0 s",
      prompt: "Czysty packshot produktu z miejscem na logotyp SiMotion i hasło Odkryj teraz.",
      pcmImage: "packshot_front.jpg",
      durationSec: 1.4,
    },
  ]);

  const [activeEditingScene, setActiveEditingScene] = useState<string | null>(null);

  // Dynamic calculation of scene time ranges based on each scene's durationSec
  const computedScenes = React.useMemo(() => {
    let cur = 0;
    return scenes.map((s) => {
      const start = Number(cur.toFixed(1));
      const end = Number((start + s.durationSec).toFixed(1));
      cur = end;
      return {
        ...s,
        startSec: start,
        endSec: end,
        timeRange: `${start.toFixed(1)}–${end.toFixed(1)} s`,
      };
    });
  }, [scenes]);

  // Scaled duration handler when the main slider changes (e.g. from 10s to 21s)
  const handleDurationChange = (rawDur: number) => {
    const newDur =
      workspaceMode === "generate"
        ? Math.min(maxAllowedDuration, Math.max(4, Math.round(rawDur)))
        : Math.max(1, Math.round(rawDur * 10) / 10);
    setDuration(newDur);

    // 1. Proportionally scale all storyboard scenes so they sum to newDur
    setScenes((prev) => {
      const currentTotal = prev.reduce((sum, s) => sum + s.durationSec, 0) || 10;
      const ratio = newDur / currentTotal;
      let accumulated = 0;
      return prev.map((s, idx) => {
        let scaledDur: number;
        if (idx === prev.length - 1) {
          scaledDur = Number(Math.max(0.5, newDur - accumulated).toFixed(1));
        } else {
          scaledDur = Number(Math.max(0.5, s.durationSec * ratio).toFixed(1));
          accumulated += scaledDur;
        }
        return {
          ...s,
          durationSec: scaledDur,
        };
      });
    });

    // 2. Proportionally rescale subtitle timeline cues so they match the new total duration
    setSubtitleCues((prev) => {
      if (prev.length === 0) return prev;
      const oldMax = prev[prev.length - 1].endSec || 10;
      const ratio = newDur / oldMax;
      return prev.map((c) => ({
        ...c,
        startSec: Number((c.startSec * ratio).toFixed(1)),
        endSec: Number((c.endSec * ratio).toFixed(1)),
        label: `${c.label.split("(")[0].trim()} (${(c.startSec * ratio).toFixed(1)}–${(c.endSec * ratio).toFixed(1)}s)`,
      }));
    });
  };

  // Jeśli użytkownik przełączy silnik z 2.5 (do 30s) na 2.0 (do 15s), dopasuj długość do limitu modelu
  useEffect(() => {
    if (workspaceMode === "generate" && duration > maxAllowedDuration) {
      handleDurationChange(maxAllowedDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiEngine, maxAllowedDuration]);

  // Pomocnik normalizujący sumę scen do całkowitych sekund w zakresie [4, maxAllowedDuration]
  const normalizeScenesToModelRange = (list: StoryboardScene[]): { scenes: StoryboardScene[]; total: number } => {
    const rawSum = list.reduce((sum, s) => sum + s.durationSec, 0) || 4;
    const clampedTotal = Math.min(maxAllowedDuration, Math.max(4, Math.round(rawSum)));
    const scale = clampedTotal / rawSum;
    let acc = 0;
    const adjusted = list.map((s, idx) => {
      const dur =
        idx === list.length - 1
          ? Number(Math.max(0.5, clampedTotal - acc).toFixed(1))
          : Number(Math.max(0.5, s.durationSec * scale).toFixed(1));
      if (idx < list.length - 1) acc += dur;
      return { ...s, durationSec: dur };
    });
    return { scenes: adjusted, total: clampedTotal };
  };

  // Adjust duration of an individual scene (with +/- buttons or input)
  const handleSceneDurationChange = (sceneId: string, newSec: number) => {
    const safeSec = Number(Math.max(0.5, Math.min(maxAllowedDuration, newSec)).toFixed(1));
    setScenes((prev) => {
      const updated = prev.map((s) => (s.id === sceneId ? { ...s, durationSec: safeSec } : s));
      const { scenes: normalized, total } = normalizeScenesToModelRange(updated);
      setDuration(total);
      return normalized;
    });
  };

  // Add a new storyboard scene dynamically
  const handleAddScene = () => {
    const newId = `sc-${Date.now()}`;
    setScenes((prev) => {
      const num = String(prev.length + 1).padStart(2, "0");
      const updated: StoryboardScene[] = [
        ...prev,
        {
          id: newId,
          name: `${num} Nowa scena`,
          timeRange: "0.0–2.0 s",
          prompt: "Płynne ujęcie prezentujące detal produktu i ruch tkaniny w miękkim świetle.",
          pcmImage: "auto_all",
          durationSec: 2.0,
        },
      ];
      const { scenes: normalized, total } = normalizeScenesToModelRange(updated);
      setDuration(total);
      return normalized;
    });
    setActiveEditingScene(newId);
  };

  // Delete a storyboard scene (keep at least 1)
  const handleDeleteScene = (sceneId: string) => {
    setScenes((prev) => {
      if (prev.length <= 1) {
        showToast("Storyboard musi zawierać przynajmniej 1 scenę.");
        return prev;
      }
      const updated = prev.filter((s) => s.id !== sceneId);
      const { scenes: normalized, total } = normalizeScenesToModelRange(updated);
      setDuration(total);
      return normalized;
    });
    if (activeEditingScene === sceneId) setActiveEditingScene(null);
  };

  // Exact prompt builder shared between UI preview and Seedance API call
  const buildFinalSeedancePrompt = () => {
    const base = prompt.trim();
    if (genMode !== "storyboard" || computedScenes.length === 0) {
      return base;
    }
    const shotList = computedScenes
      .map((s, idx) => `Shot ${idx + 1} (${s.timeRange}): ${s.prompt.trim()}`)
      .join(" | ");
    return `${base}\n\nStoryboard (${computedScenes.length} shots, total ${duration}s):\n${shotList}`;
  };

  // Video time tracking
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        } else {
          setCurrentTime((prev) => {
            const next = prev + 0.1;
            return next >= duration ? 0 : next;
          });
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          if (selectedBgm !== "none" && bgmAudioRef.current) {
            bgmAudioRef.current.currentTime = videoRef.current ? videoRef.current.currentTime % 10 : 0;
            bgmAudioRef.current.play().catch(() => {});
          }
          if (isDubEnabled && voiceAudioRef.current) {
            voiceAudioRef.current.currentTime = videoRef.current ? videoRef.current.currentTime % 6 : 0;
            voiceAudioRef.current.play().catch(() => {});
          }
        }).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        bgmAudioRef.current?.pause();
        voiceAudioRef.current?.pause();
      }
    } else {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        if (selectedBgm !== "none" && bgmAudioRef.current) {
          bgmAudioRef.current.play().catch(() => {});
        }
        if (isDubEnabled && voiceAudioRef.current) {
          voiceAudioRef.current.play().catch(() => {});
        }
      } else {
        bgmAudioRef.current?.pause();
        voiceAudioRef.current?.pause();
      }
    }
  };

  const startVideoJobPolling = (
    jobId: string,
    pollIntervalMs: number,
    meta: { sku: string; engine: string; targetRatio: string; startedAt: number }
  ) => {
    let consecutiveErrors = 0;

    const clearSavedJob = () => {
      try {
        sessionStorage.removeItem(ACTIVE_VIDEO_JOB_KEY);
      } catch {}
    };

    const poll = async () => {
      if (!isMountedRef.current) return;

      if (Date.now() - meta.startedAt > MAX_VIDEO_POLL_MS) {
        clearSavedJob();
        setIsGeneratingAiVideo(false);
        showToast("Przekroczono limit czasu oczekiwania na render (12 min). Sprawdź status zadania i spróbuj ponownie.");
        return;
      }

      try {
        const pollRes = await fetch(`/api/video?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
        if (pollRes.ok) {
          consecutiveErrors = 0;
          const pollData = await pollRes.json();
          if (!isMountedRef.current) return;

          setGenerationProgress(pollData.progress || 50);
          if (pollData.stage) setGenerationStage(pollData.stage);

          if (pollData.status === "completed") {
            clearSavedJob();
            setIsGeneratingAiVideo(false);
            const targetUrl = pollData.videoUrl || "/preview/sample_atelier_9x16.mp4";
            if (videoObjectUrlRef.current) {
              URL.revokeObjectURL(videoObjectUrlRef.current);
              videoObjectUrlRef.current = null;
            }
            setVideoFile(targetUrl);
            const ratioTag = meta.targetRatio.replace(":", "x");
            setUploadedFileName(`${meta.sku}_${meta.engine}_${ratioTag}.mp4`);
            if (pollData.source === "seedance_live") {
              setUploadedFileSize(await probeVideoSize(targetUrl));
              const costInfo =
                typeof pollData.costUsd === "number"
                  ? ` Koszt: $${pollData.costUsd.toFixed(2)}`
                  : "";
              const tokenInfo =
                typeof pollData.totalTokens === "number"
                  ? ` (${pollData.totalTokens.toLocaleString("pl-PL")} tokenów)`
                  : "";
              showToast(`✓ Wygenerowano wideo AI w silniku ${meta.engine.toUpperCase()}!${costInfo}${tokenInfo}`);
            } else {
              setUploadedFileSize("14.2 MB");
              showToast(`✓ Wygenerowano wideo AI w silniku ${meta.engine.toUpperCase()}!`);
            }

            setTimeout(() => {
              if (videoRef.current && isMountedRef.current) {
                videoRef.current.play().then(() => {
                  setIsPlaying(true);
                  if (isDubEnabled && selectedBgm !== "none" && bgmAudioRef.current) {
                    bgmAudioRef.current.play().catch(() => {});
                  }
                }).catch(() => {});
              }
            }, 300);
            return;
          }
          if (pollData.status === "failed") {
            clearSavedJob();
            setIsGeneratingAiVideo(false);
            showToast("Błąd klastra renderującego: " + (pollData.error || "Niepowodzenie"));
            return;
          }
        } else {
          consecutiveErrors++;
        }
      } catch (pollErr) {
        consecutiveErrors++;
        console.warn("Poll check error:", pollErr);
      }

      if (consecutiveErrors >= 15) {
        clearSavedJob();
        setIsGeneratingAiVideo(false);
        showToast("Utracono połączenie z serwerem podczas sprawdzania statusu wideo.");
        return;
      }

      if (isMountedRef.current) {
        setTimeout(poll, pollIntervalMs);
      }
    };

    setTimeout(poll, pollIntervalMs);
  };

  // Wznów aktywne zadanie po odświeżeniu karty (F5) w trybie Generator AI
  useEffect(() => {
    if (lockedMode === "edit") return;
    try {
      const raw = sessionStorage.getItem(ACTIVE_VIDEO_JOB_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        jobId: string;
        pollIntervalMs: number;
        sku: string;
        engine: string;
        targetRatio: string;
        startedAt: number;
      };
      if (saved?.jobId && Date.now() - saved.startedAt < MAX_VIDEO_POLL_MS) {
        setActiveStep(4);
        setIsGeneratingAiVideo(true);
        setGenerationProgress(45);
        setGenerationStage("Wznawianie monitorowania aktywnego renderu AI...");
        startVideoJobPolling(saved.jobId, saved.pollIntervalMs || 2500, saved);
      } else {
        sessionStorage.removeItem(ACTIVE_VIDEO_JOB_KEY);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real AI Video Generation Workflow
  const handleGenerateAiVideo = async () => {
    const effectivePrompt = buildFinalSeedancePrompt();
    if (effectivePrompt.trim().length < 3) {
      showToast("Wpisz najpierw prompt opisujący wideo w Kroku 1.");
      setActiveStep(1);
      return;
    }

    setIsGeneratingAiVideo(true);
    setGenerationProgress(10);
    setGenerationStage("Przygotowywanie zlecenia dla silnika " + aiEngine.toUpperCase());

    const integrations = readIntegrationsConfig();
    const mode = integrations.mode;
    setIntegrationMode(mode);
    const isLiveSeedance = mode === "live" && aiEngine.startsWith("seedance");

    // Dla 4:5 generujemy w natywnym 3:4 (baza modowa Seedance) i docinamy do 4:5 w aplikacji
    const apiAspectRatio = genAspectRatio === "4:5" ? "3:4" : genAspectRatio;
    if (genAspectRatio === "4:5" && !selectedRatios.includes("4x5")) {
      setSelectedRatios((prev) => [...prev, "4x5"]);
    }

    try {
      const primaryPackshot = selectedReferenceAssets[0]?.url || selectedReferenceAssets[0]?.rawPcmUrl;
      let referenceImages: string[] = [];
      if (isLiveSeedance && selectedReferenceAssets.length > 0) {
        if (selectedReferenceAssets.length > maxReferenceImages) {
          showToast(
            `Uwaga: ${aiEngine.toUpperCase()} przyjmuje maks. ${maxReferenceImages} zdjęć — wysyłam pierwsze ${maxReferenceImages} zaznaczonych.`
          );
        }
        const assetsToSend = selectedReferenceAssets.slice(0, maxReferenceImages);
        setGenerationStage(`Przygotowanie ${assetsToSend.length} wybranych packshotów jako referencji...`);
        try {
          referenceImages = await Promise.all(
            assetsToSend.map((a) => packshotToDataUri(a.url || a.rawPcmUrl || ""))
          );
        } catch (imgErr: any) {
          throw new Error(`Packshot: ${imgErr?.message || imgErr}`);
        }
      }

      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: effectivePrompt,
          model: aiEngine,
          duration: Math.min(maxAllowedDuration, Math.max(4, Math.round(duration))),
          resolution: videoResolution,
          aspectRatio: apiAspectRatio,
          mode,
          ...(isLiveSeedance ? { referenceImages } : { packshotUrl: primaryPackshot }),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.message || "Błąd zlecania generacji wideo");
      }

      const jobId = data.jobId;
      const pollIntervalMs: number = data.pollIntervalMs || 750;
      setGenerationProgress(25);
      setGenerationStage(
        data.source === "seedance_live"
          ? `Zlecenie przyjęte przez BytePlus (${data.duration} s, ${data.resolution}, kadr bazowy ${apiAspectRatio}). Generowanie trwa zwykle kilka minut...`
          : "Zlecenie przyjęte. Przetwarzanie w pipeline..."
      );
      if (data.durationAdjusted) {
        showToast(`Długość dopasowana do zakresu modelu: ${data.duration} s.`);
      }
      if (isLiveSeedance && !primaryPackshot) {
        showToast("Brak packshotu — wideo zostanie wygenerowane tylko z promptu.");
      }

      const jobMeta = {
        jobId,
        pollIntervalMs,
        sku: safeSku,
        engine: aiEngine,
        targetRatio: genAspectRatio,
        startedAt: Date.now(),
      };
      try {
        sessionStorage.setItem(ACTIVE_VIDEO_JOB_KEY, JSON.stringify(jobMeta));
      } catch {}

      startVideoJobPolling(jobId, pollIntervalMs, jobMeta);
    } catch (err: any) {
      setIsGeneratingAiVideo(false);
      showToast("Błąd: " + err.message);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      videoObjectUrlRef.current = url;
      setVideoFile(url);
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      showToast(`✓ Załadowano wideo: ${file.name}`);
    }
    e.target.value = "";
  };

  const handleClearVideo = () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
    setVideoFile(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Usunięto wczytane wideo. Wyświetlam podgląd referencyjny.");
  };

  const handleDownloadRawMp4 = async () => {
    if (!videoFile) return;
    const filename = `Sinsay_${safeSku}_raw.mp4`;
    try {
      const res = await fetch(videoFile);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      showToast(`✓ Pobrano surowe wideo: ${filename}`);
    } catch {
      window.open(videoFile, "_blank", "noopener,noreferrer");
      showToast("Otwarto wideo w nowej karcie — zapisz plik (Cmd+S / prawy przycisk).");
    }
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    if (workspaceMode === "edit" && vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
      const detectedDur = Math.round(vid.duration * 10) / 10;
      handleDurationChange(detectedDur);
    }
  };

  // Cost calculation for AI generate mode (depends on model, resolution & duration)
  const getRatePerSec = (engine: string, res: "480p" | "720p" | "1080p" = videoResolution): number => {
    if (engine === "seedance-2.0") {
      return res === "480p" ? 0.08 : res === "1080p" ? 0.40 : 0.18;
    }
    // Seedance 2.5 (BytePlus ModelArk estimated per-second token equivalent)
    return res === "480p" ? 0.10 : res === "1080p" ? 0.50 : 0.22;
  };
  const ratePerSec = getRatePerSec(aiEngine, videoResolution);
  const renderMultiplier = separateRender ? Math.max(1, selectedRatios.length) : 1;
  const videoCost = duration * ratePerSec * renderMultiplier;
  const totalCost = videoCost.toFixed(2);
  const generateCostLabel = `~$${totalCost}`;
  const engineResolutionLabel = videoResolution;

  const toggleRatio = (ratio: string) => {
    setSelectedRatios((prev) =>
      prev.includes(ratio) ? prev.filter((r) => r !== ratio) : [...prev, ratio]
    );
  };

  const toggleTextLang = (lang: string) => {
    setSelectedTextLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // Reusable Subtitles & Translations Component (used in both Generate mode and Edit mode)
  const renderSubtitlesSection = () => (
    <div className="space-y-4">
      {/* 1. Wybór rynków docelowych */}
      <div>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1 text-[11px] font-bold text-[var(--ink-secondary)]">
          <span>Rynki ({selectedTextLangs.length} z {SINSAY_MARKETS.length}):</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => setSelectedTextLangs(["PL", "RO", "CZ", "SK", "HU"])}
              className="text-[#7c5cff] dark:text-[#9d85ff] hover:underline font-bold cursor-pointer"
            >
              Top 5 CEE
            </button>
            <span className="text-[var(--ink-muted)]">·</span>
            <button
              type="button"
              onClick={() => setSelectedTextLangs(SINSAY_MARKETS.map((m) => m.code))}
              className="text-[#7c5cff] dark:text-[#9d85ff] hover:underline font-bold cursor-pointer"
            >
              Wszystkie 28
            </button>
            <span className="text-[var(--ink-muted)]">·</span>
            <button
              type="button"
              onClick={() => setSelectedTextLangs(["PL"])}
              className="text-[var(--ink-muted)] hover:underline cursor-pointer"
            >
              Tylko PL
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          {SINSAY_MARKETS.map((m) => {
            const isSelected = selectedTextLangs.includes(m.code);
            const isPreview = previewLang === m.code;
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => {
                  toggleTextLang(m.code);
                  setPreviewLang(m.code);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  isPreview
                    ? "ring-2 ring-[#7c5cff] bg-[#7c5cff] text-white border-[#7c5cff] shadow-xs"
                    : isSelected
                    ? "bg-[#7c5cff]/15 border-[#7c5cff]/40 text-[#7c5cff] dark:text-[#9d85ff] font-bold"
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] opacity-60 hover:opacity-100"
                }`}
                title={`${m.name} (${m.region})`}
              >
                <span>{m.flag}</span>
                <span>{m.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Szybkie Narzędzia Generowania & Asystent Sinsay */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={generateCuesFromPrompt}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#efecff] dark:bg-[#221b3d] text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all flex items-center gap-1 border border-[#7c5cff]/30 cursor-pointer"
          title="Automatycznie wygeneruj plan 4 segmentów z promptu wideo"
        >
          <span>✨ Plan z promptu wideo</span>
        </button>

        <button
          type="button"
          onClick={syncSubtitlesWithVoiceover}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-all flex items-center gap-1 cursor-pointer"
          title="Zamień słowa lektora w zsynchronizowane napisy"
        >
          <span>🎙️ Ze skryptu lektora</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPhraseAssistant((prev) => !prev)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[#7c5cff]/40 bg-[#efecff]/40 dark:bg-[#221b3d]/30 text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all flex items-center gap-1 ml-auto cursor-pointer"
        >
          <span>✦ Hasła Sinsay (4 524)</span>
          <span>{showPhraseAssistant ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* Asystent SharePoint Sinsay Drawer */}
      {showPhraseAssistant && (
        <div className="p-3.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)]">
          <SinsayPhraseAssistant
            onSelectPhrase={handleApplyPhrase}
            currentPrompt={selectedCue ? selectedCue.text : currentCaption.line1}
          />
        </div>
      )}

      {/* 3. Wizualna Oś Czasu */}
      <div className="space-y-1.5 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-[var(--ink-secondary)]">
            Oś czasu napisów ({selectedCue ? selectedCue.label : "Wybierz segment"}):
          </span>
          <span className="font-mono text-[#7c5cff]">
            {currentTime.toFixed(1)}s / {duration}s
          </span>
        </div>

        <div className="relative w-full h-9 bg-black/50 rounded-lg overflow-hidden flex border border-white/10 select-none">
          {subtitleCues.map((cue) => {
            const leftPct = (cue.startSec / duration) * 100;
            const widthPct = Math.max(8, ((cue.endSec - cue.startSec) / duration) * 100);
            const isSelected = selectedCueId === cue.id;
            const isCurrentlyPlaying = currentTime >= cue.startSec && currentTime < cue.endSec;

            const cueColor =
              cue.type === "hook"
                ? "bg-[#6e1d2f]"
                : cue.type === "speech"
                ? "bg-[#7c5cff]"
                : cue.type === "feature"
                ? "bg-[#10b981]"
                : "bg-[#8f4f0e]";

            const cueText = cue.translations?.[previewLang]?.line1 || cue.text;

            return (
              <div
                key={cue.id}
                onClick={() => {
                  setSelectedCueId(cue.id);
                  setCurrentTime(cue.startSec);
                  if (videoRef.current) videoRef.current.currentTime = cue.startSec;
                }}
                className={`absolute top-0 bottom-0 px-1.5 flex flex-col justify-center cursor-pointer transition-all border-r border-black/30 hover:brightness-110 ${cueColor} ${
                  isSelected ? "ring-2 ring-white z-10 brightness-125" : "opacity-85"
                } ${isCurrentlyPlaying ? "shadow-inner" : ""}`}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                }}
                title={`${cue.label}: "${cueText}"`}
              >
                <span className="text-[7px] font-mono font-bold text-white/90">
                  {cue.startSec.toFixed(1)}–{cue.endSec.toFixed(1)}s
                </span>
                <span className="text-[9px] font-extrabold text-white truncate">
                  {cueText}
                </span>
              </div>
            );
          })}

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none shadow-[0_0_6px_rgba(250,204,21,1)]"
            style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
          />
        </div>
      </div>

      {/* 4. Edycja Wybranego Segmentu */}
      {selectedCue && (
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedCue.type === "hook"
                    ? "bg-[#6e1d2f]"
                    : selectedCue.type === "speech"
                    ? "bg-[#7c5cff]"
                    : selectedCue.type === "feature"
                    ? "bg-[#10b981]"
                    : "bg-[#8f4f0e]"
                }`}
              />
              <span className="text-xs font-extrabold text-[var(--ink-primary)]">
                Edycja: {selectedCue.label}
              </span>
            </div>

            {subtitleCues.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setSubtitleCues((prev) => prev.filter((c) => c.id !== selectedCue.id));
                  setSelectedCueId(subtitleCues.find((c) => c.id !== selectedCue.id)?.id || "");
                }}
                className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
              >
                Usuń segment ✕
              </button>
            )}
          </div>

          {/* Start / Koniec timing */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[10px] text-[var(--ink-secondary)] font-bold">Start:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const newStart = Math.max(0, Number((selectedCue.startSec - 0.2).toFixed(1)));
                    setSubtitleCues((prev) =>
                      prev.map((c) => (c.id === selectedCue.id ? { ...c, startSec: newStart } : c))
                    );
                  }}
                  className="w-5 h-5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center cursor-pointer"
                >
                  −
                </button>
                <span className="font-mono font-bold px-1 text-[var(--accent)]">
                  {selectedCue.startSec.toFixed(1)}s
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newStart = Math.min(selectedCue.endSec - 0.3, Number((selectedCue.startSec + 0.2).toFixed(1)));
                    setSubtitleCues((prev) =>
                      prev.map((c) => (c.id === selectedCue.id ? { ...c, startSec: newStart } : c))
                    );
                  }}
                  className="w-5 h-5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[10px] text-[var(--ink-secondary)] font-bold">Koniec:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const newEnd = Math.max(selectedCue.startSec + 0.3, Number((selectedCue.endSec - 0.2).toFixed(1)));
                    setSubtitleCues((prev) =>
                      prev.map((c) => (c.id === selectedCue.id ? { ...c, endSec: newEnd } : c))
                    );
                  }}
                  className="w-5 h-5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center cursor-pointer"
                >
                  −
                </button>
                <span className="font-mono font-bold px-1 text-[var(--accent)]">
                  {selectedCue.endSec.toFixed(1)}s
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newEnd = Math.min(duration, Number((selectedCue.endSec + 0.2).toFixed(1)));
                    setSubtitleCues((prev) =>
                      prev.map((c) => (c.id === selectedCue.id ? { ...c, endSec: newEnd } : c))
                    );
                  }}
                  className="w-5 h-5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Tekst Linia 1 i Linia 2 */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-[var(--ink-secondary)] block mb-1">
                Linia 1 ({previewLang})
              </label>
              <input
                type="text"
                value={selectedCue.translations?.[previewLang]?.line1 ?? selectedCue.text}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubtitleCues((prev) =>
                    prev.map((c) =>
                      c.id === selectedCue.id
                        ? {
                            ...c,
                            text: previewLang === "PL" ? val : c.text,
                            translations: {
                              ...(c.translations || {}),
                              [previewLang]: {
                                ...(c.translations?.[previewLang] || { line1: val, line2: c.line2 || "" }),
                                line1: val,
                              },
                            },
                          }
                        : c
                    )
                  );
                }}
                className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold font-sinsay"
                placeholder="Główny tekst segmentu"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--ink-secondary)] block mb-1">
                Linia 2 ({previewLang}) <span className="font-normal text-[var(--ink-muted)]">— opcjonalnie</span>
              </label>
              <input
                type="text"
                value={selectedCue.translations?.[previewLang]?.line2 ?? selectedCue.line2 ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubtitleCues((prev) =>
                    prev.map((c) =>
                      c.id === selectedCue.id
                        ? {
                            ...c,
                            line2: previewLang === "PL" ? val : c.line2,
                            translations: {
                              ...(c.translations || {}),
                              [previewLang]: {
                                ...(c.translations?.[previewLang] || { line1: c.text, line2: val }),
                                line2: val,
                              },
                            },
                          }
                        : c
                    )
                  );
                }}
                className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-sinsay"
                placeholder="Druga linia (np. podtytuł lub CTA)"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                const lastEnd = subtitleCues.length > 0 ? subtitleCues[subtitleCues.length - 1].endSec : 0;
                const newStart = lastEnd < duration ? lastEnd : 0;
                const newEnd = Math.min(duration, Number((newStart + 2.0).toFixed(1)));
                const newId = `cue-${Date.now()}`;
                const newCue: SubtitleCue = {
                  id: newId,
                  startSec: newStart,
                  endSec: newEnd,
                  type: "speech",
                  label: `Segment (${newStart}–${newEnd}s)`,
                  text: "Nowe hasło Sinsay",
                  line2: "",
                  translations: {
                    PL: { line1: "Nowe hasło Sinsay" },
                    ENG: { line1: "New Sinsay caption" },
                  },
                };
                setSubtitleCues([...subtitleCues, newCue]);
                setSelectedCueId(newId);
                showToast("Dodano nowy segment napisów");
              }}
              className="text-xs font-bold text-[#7c5cff] dark:text-[#9d85ff] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Dodaj kolejny segment</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Pozycja w kadrze & Typografia */}
      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span>Wysokość w pionie (Oś Y):</span>
            <span className="font-mono text-[#7c5cff] font-extrabold">{captionYPercent}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={80}
            step={1}
            value={captionYPercent}
            onChange={(e) => setCaptionYPercent(Number(e.target.value))}
            className="w-full accent-[#7c5cff] cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] mt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCaptionYPercent(64)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  captionYPercent === 64
                    ? "bg-[#7c5cff] text-white border-[#7c5cff]"
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[#7c5cff]"
                }`}
              >
                ✓ Safe Zone (64%)
              </button>
              <button
                type="button"
                onClick={() => setCaptionYPercent(50)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  captionYPercent === 50
                    ? "bg-[#7c5cff] text-white border-[#7c5cff]"
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[#7c5cff]"
                }`}
              >
                Centrum (50%)
              </button>
              <button
                type="button"
                onClick={() => setCaptionYPercent(24)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  captionYPercent === 24
                    ? "bg-[#7c5cff] text-white border-[#7c5cff]"
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[#7c5cff]"
                }`}
              >
                Góra (24%)
              </button>
            </div>

            {captionYPercent > 72 && (
              <span className="text-[10px] font-bold text-rose-500 animate-pulse">
                ⚠ Zasłonięte przez UI TikToka!
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div>
            <label className="text-[9px] font-bold text-[var(--ink-muted)] block mb-0.5">
              Krój pisma
            </label>
            <select
              value={captionFont}
              onChange={(e) => setCaptionFont(e.target.value as any)}
              className="w-full px-2 py-1 rounded-lg text-[11px] font-semibold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
            >
              <option value="euclid">Euclid Circular B (LPP)</option>
              <option value="sans">System Sans</option>
              <option value="serif">Editorial Serif</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-[var(--ink-muted)] block mb-0.5">
              Waga fontu
            </label>
            <select
              value={captionWeight}
              onChange={(e) => setCaptionWeight(e.target.value as any)}
              className="w-full px-2 py-1 rounded-lg text-[11px] font-semibold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
            >
              <option value="bold">Bold (Mocny)</option>
              <option value="semibold">Semibold</option>
              <option value="medium">Medium</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-[var(--ink-muted)] block mb-0.5">
              Styl maski
            </label>
            <select
              value={captionStyle}
              onChange={(e) => setCaptionStyle(e.target.value as any)}
              className="w-full px-2 py-1 rounded-lg text-[11px] font-semibold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
            >
              <option value="pill">Pill (Półprzezroczysty)</option>
              <option value="shadow">Czysty z cieniem</option>
              <option value="tiktok_neon">TikTok Neon Żółty</option>
              <option value="clean">Ciemna belka</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold text-[var(--ink-muted)] block mb-0.5">
              Wielkość
            </label>
            <select
              value={captionSize}
              onChange={(e) => setCaptionSize(e.target.value as any)}
              className="w-full px-2 py-1 rounded-lg text-[11px] font-semibold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
            >
              <option value="sm">Kompaktowy</option>
              <option value="base">Standardowy</option>
              <option value="lg">Duży / Hook</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormatsCard = () => (
    <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
      <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
        Formaty docelowe paczki (ZIP)
      </h2>
      <div className="flex flex-wrap gap-2">
        {[
          ["3x4", "3:4 · Baza modowa"],
          ["9x16", "9:16 · TikTok / Reels"],
          ["4x5", "4:5 · Feed IG"],
          ["1x1", "1:1 · Kwadrat"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleRatio(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              selectedRatios.includes(key)
                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAudioVoiceoverCard = () => (
    <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
            Lektor &amp; Audio (ElevenLabs)
          </h2>
          <span className="text-[10px] text-[var(--ink-muted)] block">
            Dubbing głosem lektora i muzyka w tle
          </span>
        </div>
        <input
          type="checkbox"
          checked={isDubEnabled}
          onChange={(e) => setIsDubEnabled(e.target.checked)}
          className="w-4 h-4 accent-[#7c5cff] cursor-pointer"
        />
      </div>

      {isDubEnabled && (
        <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <textarea
            rows={2}
            value={spokenVoiceoverScript}
            onChange={(e) => setSpokenVoiceoverScript(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
            placeholder="Skrypt audio dla lektora..."
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
            >
              <option value="maja">Maja · Sinsay Editorial (Ciepły)</option>
              <option value="karolina">Karolina · Sinsay Youth (Dynamiczny TikTok)</option>
              <option value="adam">Adam · Fashion Runway (Głęboki)</option>
              <option value="claire">Claire · International English (Clean)</option>
            </select>
            <select
              value={selectedBgm}
              onChange={(e) => setSelectedBgm(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
            >
              <option value="runway">Warm Runway House (122 BPM)</option>
              <option value="lofi">Atelier Lo-Fi Beats (98 BPM)</option>
              {customBgmTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  🎵 {track.name} (Własny)
                </option>
              ))}
              <option value="none">Bez muzyki (Tylko lektor)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const renderIntroOutroCards = () => (
    <div className="space-y-4">
      {/* Animowane Logo Intro */}
      <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Animowane Logo Intro
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#193328] text-[#75d9ae]">
              Brand Kit LPP
            </span>
          </div>
          <input
            type="checkbox"
            checked={isLogoIntroEnabled}
            onChange={(e) => setIsLogoIntroEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#7c5cff] cursor-pointer"
          />
        </div>

        {isLogoIntroEnabled && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#dcd9ec] dark:border-[#262338] bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-10 rounded-lg bg-black/80 p-1 flex items-center justify-center shrink-0 border border-black/20 overflow-hidden">
                {isVideoLogoSrc(selectedIntroLogo.gifPath) ? (
                  <video
                    src={selectedIntroLogo.gifPath}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedIntroLogo.gifPath}
                    alt={selectedIntroLogo.name}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[var(--ink-primary)] block truncate">
                  🎬 {selectedIntroLogo.name}
                </span>
                <span className="text-[10px] text-[var(--ink-muted)] block">
                  Start klipu · Czas: {selectedIntroLogo.durationSec}s
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsIntroModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-strong)] hover:border-[#7c5cff] text-[var(--ink-primary)] cursor-pointer shrink-0"
            >
              Zmień intro ⚙
            </button>
          </div>
        )}
      </div>

      {/* Animowane Logo Outro */}
      <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Animowane Logo Outro
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#193328] text-[#75d9ae]">
              Brand Kit LPP
            </span>
          </div>
          <input
            type="checkbox"
            checked={isLogoOutroEnabled}
            onChange={(e) => setIsLogoOutroEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#7c5cff] cursor-pointer"
          />
        </div>

        {isLogoOutroEnabled && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#dcd9ec] dark:border-[#262338] bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-10 rounded-lg bg-black/80 p-1 flex items-center justify-center shrink-0 border border-black/20 overflow-hidden">
                {isVideoLogoSrc(selectedLogo.gifPath) ? (
                  <video
                    src={selectedLogo.gifPath}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedLogo.gifPath}
                    alt={selectedLogo.name}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[var(--ink-primary)] block truncate">
                  🎬 {selectedLogo.name}
                </span>
                <span className="text-[10px] text-[var(--ink-muted)] block">
                  Koniec klipu · Czas: {selectedLogo.durationSec}s
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-strong)] hover:border-[#7c5cff] text-[var(--ink-primary)] cursor-pointer shrink-0"
            >
              Zmień outro ⚙
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStoryboardCard = () => (
    <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
            Storyboard modularny ({computedScenes.length} {computedScenes.length === 1 ? "scena" : computedScenes.length < 5 ? "sceny" : "scen"})
          </h3>
          <small className="text-xs text-[var(--ink-muted)]">
            Dodawaj, usuwaj i edytuj sceny — wszystkie zaznaczone packshoty ({selectedReferenceAssets.length}) idą automatycznie jako referencja do Seedance
          </small>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddScene}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--accent)]/50 bg-[var(--accent)]/15 text-[var(--ink-primary)] hover:bg-[var(--accent)] hover:text-white transition-all cursor-pointer"
          >
            + Dodaj scenę
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[#7c5cff] font-mono">
            {duration} s łącznie
          </span>
        </div>
      </div>

      {genMode !== "storyboard" && (
        <div className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
          Wybrano tryb „Pojedyncze ujęcie” — przełącz Tryb na „Storyboard” powyżej, aby wysłać poniższe sceny do Seedance.
        </div>
      )}

      {/* Visual Storyboard Timeline Track */}
      <div className="space-y-1">
        <div className="relative w-full h-3 bg-black/30 rounded-full overflow-hidden flex border border-white/10 select-none">
          {computedScenes.map((sc, i) => {
            const pct = Math.max(5, (sc.durationSec / duration) * 100);
            const colors = [
              "bg-[#6e1d2f]",
              "bg-[#7c5cff]",
              "bg-[#8f4f0e]",
              "bg-[#10b981]",
              "bg-[#1b4353]",
              "bg-[#4a1c40]",
            ];
            return (
              <div
                key={sc.id}
                style={{ width: `${pct}%` }}
                className={`h-full ${colors[i % colors.length]} border-r border-black/40 hover:brightness-125 transition-all`}
                title={`${sc.name}: ${sc.timeRange} (${sc.durationSec}s)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-[var(--ink-muted)] px-0.5">
          <span>0.0s (Start)</span>
          <span>Oś czasu scen wideo</span>
          <span>{duration}s (Koniec)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {computedScenes.map((scene) => (
          <div
            key={scene.id}
            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
              activeEditingScene === scene.id
                ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-md"
                : "bg-[var(--bg-subtle)] border-[var(--border-subtle)]"
            }`}
          >
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-[var(--accent)] mb-1.5 gap-2">
                {activeEditingScene === scene.id ? (
                  <input
                    type="text"
                    value={scene.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenes((prev) =>
                        prev.map((s) => (s.id === scene.id ? { ...s, name: val } : s))
                      );
                    }}
                    className="flex-1 min-w-0 px-1.5 py-0.5 rounded border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] text-[11px]"
                  />
                ) : (
                  <span className="truncate pr-1">{scene.name}</span>
                )}
                <span className="font-mono text-[11px] text-[#7c5cff] font-extrabold whitespace-nowrap">
                  {scene.timeRange}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] py-1 px-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-2">
                <span className="font-bold text-[var(--ink-secondary)] text-[9px]">Czas sceny:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSceneDurationChange(scene.id, scene.durationSec - 0.5)}
                    className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center hover:bg-[#7c5cff] hover:text-white transition-all cursor-pointer"
                    title="Skróć ujęcie o 0.5s"
                  >
                    −
                  </button>
                  <span className="font-mono font-extrabold text-[11px] text-[#7c5cff] px-0.5">
                    {scene.durationSec.toFixed(1)}s
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSceneDurationChange(scene.id, scene.durationSec + 0.5)}
                    className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center hover:bg-[#7c5cff] hover:text-white transition-all cursor-pointer"
                    title="Wydłuż ujęcie o 0.5s"
                  >
                    +
                  </button>
                </div>
              </div>

              {activeEditingScene === scene.id ? (
                <textarea
                  rows={3}
                  value={scene.prompt}
                  onChange={(e) => {
                    const val = e.target.value;
                    setScenes((prev) =>
                      prev.map((s) => (s.id === scene.id ? { ...s, prompt: val } : s))
                    );
                  }}
                  className="w-full text-xs p-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)]"
                />
              ) : (
                <p className="text-xs text-[var(--ink-secondary)] line-clamp-3">
                  {scene.prompt}
                </p>
              )}
            </div>

            <div className="pt-2.5 border-t border-[var(--border-subtle)] mt-2.5 flex items-center justify-end gap-1.5">
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setActiveEditingScene(
                      activeEditingScene === scene.id ? null : scene.id
                    )
                  }
                  className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer"
                >
                  {activeEditingScene === scene.id ? "Gotowe" : "Edytuj"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteScene(scene.id)}
                  disabled={computedScenes.length <= 1}
                  className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-red-500 hover:text-red-400 text-[var(--ink-muted)] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                  title="Usuń scenę"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <details className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs">
        <summary className="cursor-pointer font-bold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] select-none">
          🔍 Podgląd dokładnego promptu wysyłanego do Seedance ({selectedReferenceAssets.length} referencji PSH)
        </summary>
        <pre className="mt-2.5 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--ink-primary)] bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-subtle)]">
          {buildFinalSeedancePrompt()}
        </pre>
      </details>
    </div>
  );

  const renderLogoStageOverlays = () => {
    const bothLogosActive = isLogoIntroEnabled && isLogoOutroEnabled;
    const maxShare = duration > 0 ? (bothLogosActive ? duration * 0.4 : duration * 0.45) : 2.5;
    const effIntroDur = Math.min(selectedIntroLogo.durationSec, maxShare);
    const effOutroDur = Math.min(selectedLogo.durationSec, maxShare);
    const outroStart = Math.max(isLogoIntroEnabled ? effIntroDur : 0, duration - effOutroDur);

    const showIntro = isLogoIntroEnabled && (previewIntroForce || currentTime < effIntroDur);
    const showOutro = isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= outroStart));
    return (
      <>
        {showIntro && (
          <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
            {isVideoLogoSrc(selectedIntroLogo.gifPath) ? (
              <video
                src={selectedIntroLogo.gifPath}
                autoPlay
                loop
                muted
                playsInline
                className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
              />
            ) : (
              <img
                src={selectedIntroLogo.gifPath}
                alt={selectedIntroLogo.name}
                className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
              />
            )}
            <span className="text-[7px] font-mono tracking-widest text-[#9d85ff] uppercase block mt-1">
              INTRO · {selectedIntroLogo.name}
            </span>
          </div>
        )}
        {!showIntro && showOutro && (
          <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
            {isVideoLogoSrc(selectedLogo.gifPath) ? (
              <video
                src={selectedLogo.gifPath}
                autoPlay
                loop
                muted
                playsInline
                className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
              />
            ) : (
              <img
                src={selectedLogo.gifPath}
                alt={selectedLogo.name}
                className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
              />
            )}
            <span className="text-[7px] font-mono tracking-widest text-[#9d85ff] uppercase block mt-1">
              OUTRO · {selectedLogo.name}
            </span>
          </div>
        )}
      </>
    );
  };

  const renderPreviewColumn = (showBottomQuickExport: boolean, showPerFrameBurnButtons = true) => (
    <div className="lg:col-span-7 space-y-5 lg:sticky lg:top-20 self-start">
      <div className="p-5 sm:p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Podgląd kadrów (3:4 Master → 9:16 TikTok, 4:5, 1:1)
            </h3>
            {workspaceMode === "generate" && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[#9d85ff]">
                Proporcje AI: {genAspectRatio}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSafeAreas(!showSafeAreas)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showSafeAreas
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <span>{showSafeAreas ? "✓ Siatki Safe Area" : "○ Bez siatek"}</span>
            </button>
          </div>
        </div>

        {isSubtitlesEnabled && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--ink-secondary)] flex items-center gap-1.5">
              <span>Podgląd napisów:</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-extrabold text-[11px]">
                {previewLang}
              </span>
            </span>

            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
              {selectedTextLangs.map((code) => {
                const m = SINSAY_MARKETS.find((item) => item.code === code);
                const isActive = previewLang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setPreviewLang(code)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                        : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    }`}
                  >
                    <span>{m?.flag || "🌐"}</span>
                    <span>{code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4-Frame Live Stage Container */}
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] grid grid-cols-2 lg:grid-cols-4 gap-3.5 items-center justify-items-center min-h-[380px] overflow-hidden">
          {/* 1. 3:4 MASTER BAZA */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-center justify-between w-full max-w-[155px] px-1 text-[10px] font-bold text-[var(--ink-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#7c5cff]" />
                <span className="text-[#7c5cff]">3:4 Master</span>
              </span>
              <span className="text-[9px] font-mono text-[var(--ink-muted)]">1440×1920</span>
            </div>

            <div className="w-full max-w-[155px] aspect-[3/4] rounded-2xl border-2 border-[#7c5cff] bg-black relative overflow-hidden shadow-xl ring-1 ring-[#7c5cff]/30">
              {videoFile ? (
                <video
                  ref={videoRef}
                  src={videoFile}
                  loop
                  muted
                  playsInline
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  onClick={() => {
                    setVideoFile("/preview/sample_atelier_9x16.mp4");
                    setUploadedFileName("sample_atelier_9x16.mp4");
                    showToast("Załadowano wideo próbne atelier 9:16");
                  }}
                  className="absolute inset-0 bg-gradient-to-tr from-[#1a1535] via-[#4f35c2] to-[#7c5cff] transition-transform duration-100 cursor-pointer group"
                  style={{ transform: `scale(${1 + Math.sin(currentTime) * 0.05})` }}
                  title="Kliknij, aby wczytać wideo próbne atelier"
                >
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white/90">
                    <span className="text-xl mb-1 group-hover:scale-125 transition-transform">⚡</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide">Podgląd AI</span>
                    <span className="text-[8px] opacity-75 mt-0.5 underline">Kliknij wideo</span>
                  </div>
                </div>
              )}

              <audio
                ref={bgmAudioRef}
                src={
                  customBgmTracks.find((t) => t.id === selectedBgm)?.url ||
                  customBgmTracks.find((t) => t.id === selectedBgm)?.dataUrl ||
                  (selectedBgm === "lofi" ? "/audio/atelier_lofi.m4a" : "/audio/runway_house.m4a")
                }
                loop
                preload="auto"
              />
              <audio
                ref={voiceAudioRef}
                src="/audio/voiceover_sample.m4a"
                preload="auto"
              />

              {showSafeAreas && <SocialSafeAreaOverlay format="master-3x4" />}
              {renderLogoStageOverlays()}

              {isSubtitlesEnabled && activeSubtitleText && (
                <div
                  className="absolute inset-x-2 z-10 text-center pointer-events-none transition-all duration-150"
                  style={{ top: `${captionYPercent}%`, transform: "translateY(-50%)" }}
                >
                  <p className={`inline-block leading-tight tracking-wide ${getSubtitleStyleClasses()}`}>
                    {activeSubtitleText}
                    {activeSubtitleLine2 && <><br /><span className="opacity-90">{activeSubtitleLine2}</span></>}
                  </p>
                </div>
              )}
            </div>

            {showPerFrameBurnButtons && isSubtitlesEnabled && (
              <button
                type="button"
                onClick={() => handleBurnAndDownloadSingleVideo("3:4")}
                disabled={isBurningVideo}
                className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#efecff] dark:bg-[#221b3d] border border-[#7c5cff]/40 text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                title="Wypala napisy w formacie 3:4 bez DaVinci Resolve"
              >
                <span>🔥 Wypal 3:4 ({previewLang})</span>
              </button>
            )}
          </div>

          {/* 2. 9:16 TIKTOK VERTICAL */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-center justify-between w-full max-w-[155px] px-1 text-[10px] font-bold text-[var(--ink-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">9:16 TikTok</span>
              </span>
              <span className="text-[9px] font-mono text-[var(--ink-muted)]">1080×1920</span>
            </div>

            <div className="w-full max-w-[155px] aspect-[9/16] rounded-2xl border-2 border-emerald-500 bg-black relative overflow-hidden shadow-xl ring-1 ring-emerald-500/30">
              {videoFile ? (
                <video
                  src={videoFile}
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                  style={{
                    transform: `scale(1.25) translateX(${cropOffset * 0.4}%)`,
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-[#1a1535] via-[#4f35c2] to-[#7c5cff] transition-transform duration-150"
                  style={{
                    transform: `scale(${1.25 + Math.sin(currentTime) * 0.05}) translateX(${cropOffset * 0.4}%)`,
                  }}
                >
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                </div>
              )}

              {showSafeAreas && <SocialSafeAreaOverlay format="tiktok-9x16" />}
              {renderLogoStageOverlays()}

              {isSubtitlesEnabled && activeSubtitleText && (
                <div
                  className="absolute inset-x-2 z-10 text-center pointer-events-none transition-all duration-150"
                  style={{ top: `${captionYPercent}%`, transform: "translateY(-50%)" }}
                >
                  <p className={`inline-block leading-tight tracking-wide ${getSubtitleStyleClasses()}`}>
                    {activeSubtitleText}
                    {activeSubtitleLine2 && <><br /><span className="opacity-90">{activeSubtitleLine2}</span></>}
                  </p>
                </div>
              )}
            </div>

            {showPerFrameBurnButtons && isSubtitlesEnabled && (
              <button
                type="button"
                onClick={() => handleBurnAndDownloadSingleVideo("9:16")}
                disabled={isBurningVideo}
                className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#efecff] dark:bg-[#221b3d] border border-[#7c5cff]/40 text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                title="Wypala napisy w pikselach wideo bez DaVinci Resolve"
              >
                <span>🔥 Wypal 9:16 ({previewLang})</span>
              </button>
            )}
          </div>

          {/* 3. 4:5 IG FEED SMART CROP */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-center justify-between w-full max-w-[155px] px-1 text-[10px] font-bold text-[var(--ink-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-indigo-600 dark:text-indigo-400">4:5 Feed</span>
              </span>
              <span className="text-[9px] font-mono text-[var(--ink-muted)]">1080×1350</span>
            </div>

            <div className="w-full max-w-[155px] aspect-[4/5] rounded-2xl border-2 border-indigo-500 bg-black relative overflow-hidden shadow-xl ring-1 ring-indigo-500/30">
              {videoFile ? (
                <video
                  src={videoFile}
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                  style={{ transform: `scale(1.1)` }}
                />
              ) : (
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-[#1a1535] via-[#4f35c2] to-[#7c5cff] transition-transform duration-150"
                  style={{
                    transform: `scale(${1.1 + Math.sin(currentTime) * 0.05})`,
                  }}
                >
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                </div>
              )}

              {showSafeAreas && <SocialSafeAreaOverlay format="feed-4x5" />}
              {renderLogoStageOverlays()}

              {isSubtitlesEnabled && activeSubtitleText && (
                <div
                  className="absolute inset-x-2 z-10 text-center pointer-events-none transition-all duration-150"
                  style={{ top: `${Math.min(78, captionYPercent + 3)}%`, transform: "translateY(-50%)" }}
                >
                  <p className={`inline-block leading-tight tracking-wide ${getSubtitleStyleClasses()}`}>
                    {activeSubtitleText}
                    {activeSubtitleLine2 && <><br /><span className="opacity-90">{activeSubtitleLine2}</span></>}
                  </p>
                </div>
              )}
            </div>

            {showPerFrameBurnButtons && isSubtitlesEnabled && (
              <button
                type="button"
                onClick={() => handleBurnAndDownloadSingleVideo("4:5")}
                disabled={isBurningVideo}
                className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#efecff] dark:bg-[#221b3d] border border-[#7c5cff]/40 text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                title="Wypala napisy w formacie 4:5 bez DaVinci Resolve"
              >
                <span>🔥 Wypal 4:5 ({previewLang})</span>
              </button>
            )}
          </div>

          {/* 4. 1:1 SQUARE PRODUCT */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="flex items-center justify-between w-full max-w-[155px] px-1 text-[10px] font-bold text-[var(--ink-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">1:1 Kwadrat</span>
              </span>
              <span className="text-[9px] font-mono text-[var(--ink-muted)]">1080×1080</span>
            </div>

            <div className="w-full max-w-[155px] aspect-square rounded-2xl border-2 border-amber-500 bg-black relative overflow-hidden shadow-xl ring-1 ring-amber-500/30">
              {videoFile ? (
                <video
                  src={videoFile}
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                  style={{ transform: `scale(1.05)` }}
                />
              ) : (
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-[#1a1535] via-[#4f35c2] to-[#7c5cff] transition-transform duration-150"
                  style={{
                    transform: `scale(${1 + Math.sin(currentTime) * 0.05})`,
                  }}
                >
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                </div>
              )}

              {showSafeAreas && <SocialSafeAreaOverlay format="square-1x1" />}
              {renderLogoStageOverlays()}

              {isSubtitlesEnabled && activeSubtitleText && (
                <div
                  className="absolute inset-x-2 z-10 text-center pointer-events-none transition-all duration-150"
                  style={{ top: `${Math.min(80, captionYPercent + 6)}%`, transform: "translateY(-50%)" }}
                >
                  <p className={`inline-block leading-tight tracking-wide ${getSubtitleStyleClasses()}`}>
                    {activeSubtitleText}
                    {activeSubtitleLine2 && <><br /><span className="opacity-90">{activeSubtitleLine2}</span></>}
                  </p>
                </div>
              )}
            </div>

            {showPerFrameBurnButtons && isSubtitlesEnabled && (
              <button
                type="button"
                onClick={() => handleBurnAndDownloadSingleVideo("1:1")}
                disabled={isBurningVideo}
                className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#efecff] dark:bg-[#221b3d] border border-[#7c5cff]/40 text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                title="Wypala napisy w formacie 1:1 bez DaVinci Resolve"
              >
                <span>🔥 Wypal 1:1 ({previewLang})</span>
              </button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full ${isSubtitlesEnabled && activeCue ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
            <span className="font-bold text-[var(--ink-secondary)] text-[11px] truncate">
              {isSubtitlesEnabled
                ? (activeCue ? activeCue.label : "Czysty kadr (brak napisu w tej sekundzie)")
                : "Napisy wyłączone"}
            </span>
          </div>
          {isSubtitlesEnabled && activeSubtitleText ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] font-sinsay truncate">
              <span className="text-[10px] text-[var(--ink-muted)] font-mono font-normal">[{previewLang}]:</span>
              <span className="truncate">„{activeSubtitleText}”</span>
            </div>
          ) : (
            <span className="text-[10px] text-[var(--ink-muted)] italic">
              Oś czasu: {currentTime.toFixed(1)}s
            </span>
          )}
        </div>

        {/* Playback Transport Controls */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full bg-[#7c5cff] text-white font-extrabold text-sm grid place-items-center shadow-md hover:opacity-95 cursor-pointer"
              title={isPlaying ? "Zatrzymaj" : "Odtwórz"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="text-xs font-mono font-bold text-[var(--ink-primary)]">
              {currentTime.toFixed(1)}s / {duration}s
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const time = Number(e.target.value);
                setCurrentTime(time);
                if (videoRef.current) videoRef.current.currentTime = time;
              }}
              className="w-full accent-[#7c5cff] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="text-[11px] font-bold text-[var(--ink-secondary)] whitespace-nowrap">
              Fokus kadru:
            </label>
            <input
              type="range"
              min={-50}
              max={50}
              step={1}
              value={cropOffset}
              onChange={(e) => setCropOffset(Number(e.target.value))}
              className="w-24 accent-[#7c5cff] cursor-pointer"
              title="Przesuń kadr 9:16 w lewo lub w prawo"
            />
            <button
              type="button"
              onClick={() => setCropOffset(0)}
              className="text-xs font-mono font-bold text-[#7c5cff] hover:underline cursor-pointer min-w-[36px] text-right"
              title="Kliknij, aby wyśrodkować (0%)"
            >
              {cropOffset}%
            </button>
          </div>
        </div>
      </div>

      {showBottomQuickExport && (
        <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                Gotowe do publikacji? Pobierz paczkę produkcyjną
              </h4>
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                Paczka ZIP zawiera 4 formaty wideo (3:4, 9:16, 4:5, 1:1), manifest i specyfikacje renderu{isSubtitlesEnabled ? " oraz napisy .SRT/.VTT" : ""}.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isSubtitlesEnabled && (
                <>
                  <button
                    type="button"
                    onClick={() => handleBurnAndDownloadSingleVideo("9:16")}
                    disabled={isBurningVideo}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7c5cff] to-[#9d85ff] hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isBurningVideo ? "Wypalanie..." : `🔥 Wypal wideo 9:16 (${previewLang})`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSrtOnly(previewLang)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[#7c5cff] hover:text-[#7c5cff] transition-all cursor-pointer"
                  >
                    📄 Tylko .SRT ({previewLang})
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleQuickExportZip}
                disabled={isExportingZip || isBurningVideo}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7c5cff] shadow-[var(--shadow-pop)] hover:opacity-95 transition-all cursor-pointer"
              >
                {isExportingZip || isBurningVideo
                  ? "Wypalanie & Pakowanie..."
                  : isSubtitlesEnabled
                  ? `💾 Pobierz ZIP z wypalonymi wersjami (${selectedTextLangs.length} rynków)`
                  : "💾 Pobierz ZIP z 4 formatami"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="space-y-2">
          {!lockedMode && (
            <div className="inline-flex p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-strong)] gap-1">
              <button
                type="button"
                onClick={() => setWorkspaceMode("generate")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  workspaceMode === "generate"
                    ? "bg-[#7c5cff] text-white shadow-sm"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                <span>✨ Generator AI</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("edit")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  workspaceMode === "edit"
                    ? "bg-[#7c5cff] text-white shadow-sm"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                <span>🎬 Montaż wideo</span>
                {uploadedFileName && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
              {workspaceMode === "generate"
                ? "Generator AI · Studio Wideo"
                : "Montaż wideo & Napisy"}
            </h1>
            <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
              {workspaceMode === "generate"
                ? "Krok po kroku: prompt i referencje PCM → storyboard, parametry i intro/outro → napisy i lektor → generowanie i eksport."
                : "Wgraj własne wideo MP4/MOV, dodaj animowane intro/outro, napisy z tłumaczeniami oraz lektora i pobierz gotowe formaty."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {workspaceMode === "edit" ? (
            <>
              {isSubtitlesEnabled && (
                <button
                  type="button"
                  onClick={() => handleDownloadSrtOnly(previewLang)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[#7c5cff] hover:text-[#7c5cff] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>📄 Pobierz .SRT ({previewLang})</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleQuickExportZip}
                disabled={isExportingZip || isBurningVideo}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[#7c5cff] bg-[#efecff] dark:bg-[#221b3d] text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>
                  {isExportingZip || isBurningVideo
                    ? "Wypalanie & Pakowanie..."
                    : isSubtitlesEnabled
                    ? `💾 ZIP (${selectedTextLangs.length} rynków)`
                    : "💾 Pobierz formaty (ZIP)"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleExportDaVinciFCPXML}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer flex items-center gap-1.5"
              >
                <span>🎬 DaVinci (.fcpxml)</span>
              </button>
              {onProceedToPost && (
                <button
                  onClick={onProceedToPost}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer"
                >
                  Eksport paczek →
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono">
                <span className="text-[var(--ink-muted)] mr-1.5">Szacunek:</span>
                <span className="font-extrabold text-[#9d85ff]">~${totalCost} USD</span>
              </div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((activeStep - 1) as 1 | 2 | 3 | 4)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] hover:border-[var(--accent)] transition-all cursor-pointer"
                >
                  ← Wstecz
                </button>
              )}
              {activeStep < 4 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((activeStep + 1) as 1 | 2 | 3 | 4)}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 transition-all cursor-pointer"
                >
                  Dalej →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE: GENERATE AI VIDEO — 4-STEP WIZARD                  */}
      {/* ======================================================== */}
      {workspaceMode === "generate" ? (
        <div className="space-y-6">
          {/* 4-Step Stepper */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(
              [
                {
                  step: 1 as const,
                  title: "Prompt & Referencje",
                  meta: `${selectedReferenceAssets.length} wybranych zdjęć`,
                },
                {
                  step: 2 as const,
                  title: "Storyboard & Parametry",
                  meta: `${genMode === "storyboard" ? `${computedScenes.length} scen` : "1 ujęcie"} · ${videoResolution} · ${genAspectRatio}`,
                },
                {
                  step: 3 as const,
                  title: "Napisy & Lektor",
                  meta: isSubtitlesEnabled ? `${selectedTextLangs.length} rynków` : "Bez napisów",
                },
                {
                  step: 4 as const,
                  title: "Generowanie & Eksport",
                  meta: isGeneratingAiVideo ? `${generationProgress}%` : `~${totalCost} USD`,
                },
              ] as const
            ).map((item) => {
              const isActive = activeStep === item.step;
              const isDone = activeStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(item.step)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? "bg-[var(--accent)]/15 border-[var(--accent)] shadow-sm"
                      : "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-extrabold grid place-items-center shrink-0 ${
                      isActive
                        ? "bg-[var(--accent)] text-white"
                        : isDone
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-[var(--bg-subtle)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {isDone ? "✓" : item.step}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-xs font-extrabold truncate ${isActive ? "text-[var(--ink-primary)]" : "text-[var(--ink-secondary)]"}`}>
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] truncate mt-0.5">
                      {item.meta}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* STEP 1: PROMPT & REFERENCJE */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: General Prompt & Presets */}
                <div className="lg:col-span-6 p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                      1. Ogólny prompt wideo
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--ink-muted)]">
                      Baza dla całego klipu
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[var(--ink-secondary)] block mb-1.5">
                      Presety asortymentu:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {GARMENT_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setPrompt(p.prompt);
                            setSpokenVoiceoverScript(p.voiceover);
                            if (p.cues && p.cues.length > 0) {
                              setSubtitleCues((prev) =>
                                prev.map((cue, idx) => {
                                  const target = p.cues[idx % p.cues.length];
                                  return {
                                    ...cue,
                                    text: target.text,
                                    line2: target.line2,
                                    translations: {
                                      ...cue.translations,
                                      PL: { line1: target.text, line2: target.line2 },
                                    },
                                  };
                                })
                              );
                            }
                            showToast(`Załadowano preset: ${p.label}`);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--ink-secondary)] transition-all cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={7}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Opisz ogólną estetykę, oświetlenie, lokalizację i klimat filmu..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs leading-relaxed border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <p className="text-[11px] text-[var(--ink-muted)] mt-2">
                      W kolejnym kroku możesz rozbić ten prompt na konkretne sceny na storyboardzie. Wszystkie zaznaczone po prawej stronie referencje trafią do Seedance.
                    </p>
                  </div>
                </div>

                {/* Right: Multi-MDK PCM & Selectable References */}
                <div className="lg:col-span-6 p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                      2. Referencje produktowe (MDK / PCM &amp; Dysk)
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          selectedReferenceAssets.length > 0
                            ? "bg-[#7c5cff]/15 border-[#7c5cff]/40 text-[#9d85ff]"
                            : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-muted)]"
                        }`}
                      >
                        {selectedReferenceAssets.length > 0
                          ? `Tryb: Produkt z referencjami (${selectedReferenceAssets.length})`
                          : "Tryb: Tekst-do-wideo (0 ref.)"}
                      </span>
                      {pcmFetchSource && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                          Źródło: {pcmFetchSource.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={productId}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[‐-―−]/g, "-").toUpperCase();
                        setProductId(clean);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleFetchPcm();
                        }
                      }}
                      placeholder="Wpisz kod MDK np. 001KR-83X (Enter pobiera)"
                      className="flex-1 min-w-[160px] px-3 py-2 rounded-xl text-xs border font-mono bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={handleFetchPcm}
                      disabled={isFetchingPcm}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#7c5cff] bg-[#efecff] dark:bg-[#221b3d] text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <span>{isFetchingPcm ? "Pobieranie..." : "+ Pobierz z PCM ↻"}</span>
                    </button>
                    <label className="px-3 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-secondary)] hover:border-[var(--accent)] hover:text-[var(--ink-primary)] transition-all flex items-center gap-1 shadow-sm cursor-pointer">
                      <span>📁 Z dysku</span>
                      <input
                        ref={localPackshotInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUploadLocalPackshots}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Active MDK Chips */}
                  {mdkCodes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[var(--ink-muted)] mr-1">Załadowane MDK:</span>
                      {mdkCodes.map((code) => (
                        <span
                          key={code}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-[var(--ink-primary)]"
                        >
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => removeMdkGroup(code)}
                            className="text-[var(--ink-muted)] hover:text-rose-400 cursor-pointer"
                            title={`Usuń zdjęcia MDK ${code}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Selectable Thumbnail Grid */}
                  {pcmAssets.length > 0 ? (
                    <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-[var(--ink-primary)]">
                          Zaznaczone do Seedance:{" "}
                          <span className={selectedReferenceAssets.length > maxReferenceImages ? "text-amber-400" : "text-[#9d85ff]"}>
                            {selectedReferenceAssets.length}
                          </span>{" "}
                          / {pcmAssets.length}{" "}
                          <span className="text-[10px] font-normal text-[var(--ink-muted)]">
                            (limit {aiEngine.toUpperCase()}: {maxReferenceImages})
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => selectAllAssets(true)}
                            className="text-[11px] font-bold text-[#9d85ff] hover:underline cursor-pointer"
                          >
                            Zaznacz wszystkie
                          </button>
                          <span className="text-[var(--border-strong)]">·</span>
                          <button
                            type="button"
                            onClick={() => selectAllAssets(false)}
                            className="text-[11px] font-bold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                          >
                            Odznacz
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {pcmAssets.map((asset) => {
                          const isSelected = asset.selected !== false;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => toggleAssetSelection(asset.id)}
                              className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
                                isSelected
                                  ? "border-[#7c5cff] ring-2 ring-[#7c5cff]/30 opacity-100"
                                  : "border-[var(--border-subtle)] opacity-45 hover:opacity-80"
                              } bg-white dark:bg-[#0d0c14]`}
                              title={`${asset.label} (${asset.filename})`}
                            >
                              <img
                                src={asset.url}
                                alt={asset.label}
                                className="w-full h-full object-contain p-1"
                                loading="lazy"
                              />
                              <span
                                className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md text-[10px] font-extrabold grid place-items-center shadow-sm ${
                                  isSelected
                                    ? "bg-[#7c5cff] text-white"
                                    : "bg-black/60 text-white/70 border border-white/20"
                                }`}
                              >
                                {isSelected ? "✓" : ""}
                              </span>
                              <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 rounded bg-black/70 text-white">
                                {asset.mdk || asset.source.toUpperCase()}
                              </span>
                              <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-[8px] font-mono px-1 py-0.5 truncate text-center">
                                {asset.filename.replace(/^.*[\/]/, "")}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] text-center text-xs text-[var(--ink-muted)]">
                      Wpisz kod MDK powyżej i kliknij <b>+ Pobierz z PCM</b> lub wgraj zdjęcia z dysku. Możesz dodać wiele kodów MDK (np. sukienkę + torebkę) i zaznaczyć dokładne ujęcia.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 cursor-pointer"
                >
                  Dalej: Storyboard, Parametry &amp; Intro/Outro →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: STORYBOARD, PARAMETRY & INTRO/OUTRO */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Engine, Resolution, Aspect Ratio, Duration, ZIP Formats */}
                <div className="lg:col-span-7 p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-5 shadow-sm">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    Parametry generowania wideo
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                        Silnik wideo
                      </label>
                      <select
                        value={aiEngine}
                        onChange={(e) => setAiEngine(normalizeVideoEngine(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-medium cursor-pointer"
                      >
                        {VIDEO_ENGINE_OPTIONS.map((opt) => {
                          const rate = getRatePerSec(opt.value, videoResolution);
                          const icon = opt.value === "seedance-2.5" ? "⚡" : "🚀";
                          return (
                            <option key={opt.value} value={opt.value}>
                              {icon} {opt.label} (~${rate.toFixed(2)}/s)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                        Tryb generowania
                      </label>
                      <select
                        value={genMode}
                        onChange={(e) => setGenMode(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
                      >
                        <option value="storyboard">Storyboard</option>
                        <option value="single">Pojedyncze ujęcie</option>
                      </select>
                    </div>
                  </div>

                  {/* Rozdzielczość & Aspect Ratio generacji */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                    <div>
                      <label className="text-[11px] font-bold text-[var(--ink-primary)] block mb-1.5">
                        Rozdzielczość (Seedance)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: "480p", label: "480p", hint: "Test" },
                            { id: "720p", label: "720p", hint: "Social" },
                            { id: "1080p", label: "1080p", hint: "Master" },
                          ] as const
                        ).map((resOpt) => (
                          <button
                            key={resOpt.id}
                            type="button"
                            onClick={() => setVideoResolution(resOpt.id)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center leading-tight ${
                              videoResolution === resOpt.id
                                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                                : "bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                            }`}
                          >
                            <span>{resOpt.label}</span>
                            <span className="text-[9px] font-normal opacity-80">{resOpt.hint}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[var(--ink-primary)] block mb-1.5">
                        Proporcje generowanego klipu (Aspect Ratio)
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {(["9:16", "3:4", "4:5", "1:1", "16:9"] as const).map((ratioOpt) => (
                          <button
                            key={ratioOpt}
                            type="button"
                            onClick={() => {
                              setGenAspectRatio(ratioOpt);
                              if (ratioOpt === "4:5" && !selectedRatios.includes("4x5")) {
                                setSelectedRatios((prev) => [...prev, "4x5"]);
                              }
                            }}
                            className={`py-2 px-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                              genAspectRatio === ratioOpt
                                ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs"
                                : "bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                            }`}
                          >
                            {ratioOpt}
                          </button>
                        ))}
                      </div>
                      {genAspectRatio === "4:5" && (
                        <p className="text-[10px] text-[#9d85ff] mt-1.5 leading-snug">
                          Seedance generuje bazę modową <b>3:4</b>, a aplikacja docina kadr do <b>4:5 (1080×1350)</b> z uwzględnieniem Fokusu kadru.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Długość klipu (sam suwak w granicach modelu) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Długość klipu wideo</span>
                      <span className="text-[var(--accent)] font-mono font-extrabold">{duration} s</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={maxAllowedDuration}
                      step={1}
                      value={Math.min(maxAllowedDuration, Math.max(4, Math.round(duration)))}
                      onChange={(e) => handleDurationChange(Number(e.target.value))}
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)]">
                      <span>4s (krótki hook)</span>
                      <span>Szacowany koszt: <b className="text-[#9d85ff]">~${totalCost} USD</b></span>
                      <span>{maxAllowedDuration}s (maks. {aiEngine.toUpperCase()})</span>
                    </div>
                  </div>
                </div>

                {/* Right: Independent Intro & Outro */}
                <div className="lg:col-span-5">
                  {renderIntroOutroCards()}
                </div>
              </div>

              {/* Full-width Modular Storyboard (ukryty w trybie Pojedyncze ujęcie) */}
              {genMode === "storyboard" ? (
                renderStoryboardCard()
              ) : (
                <div className="px-4 py-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--ink-secondary)] flex items-center justify-between gap-3">
                  <span>
                    Tryb <b className="text-[var(--ink-primary)]">Pojedyncze ujęcie</b> — storyboard scen jest pominięty, do Seedance idzie główny prompt z Kroku 1.
                  </span>
                  <button
                    type="button"
                    onClick={() => setGenMode("storyboard")}
                    className="text-xs font-bold text-[#9d85ff] hover:underline shrink-0 cursor-pointer"
                  >
                    Przełącz na Storyboard →
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] hover:border-[var(--accent)] cursor-pointer"
                >
                  ← Wstecz: Prompt &amp; Referencje
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 cursor-pointer"
                >
                  Dalej: Napisy, Lektor &amp; Tłumaczenia →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NAPISY, LEKTOR & TŁUMACZENIA */}
          {activeStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                        Napisy &amp; Tłumaczenia (Matryca LPP)
                      </h2>
                      <span className="text-[10px] text-[var(--ink-muted)] block">
                        Generuj wideo z wypalonymi napisami, tłumaczeniami i bezpieczną strefą
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSubtitlesEnabled}
                      onChange={(e) => setIsSubtitlesEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#7c5cff] cursor-pointer"
                    />
                  </div>

                  {isSubtitlesEnabled && (
                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      {renderSubtitlesSection()}
                    </div>
                  )}
                </div>

                {renderAudioVoiceoverCard()}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] hover:border-[var(--accent)] cursor-pointer"
                  >
                    ← Wstecz
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 cursor-pointer"
                  >
                    Dalej: Generowanie &amp; Eksport →
                  </button>
                </div>
              </div>

              {renderPreviewColumn(false, false)}
            </div>
          )}

          {/* STEP 4: GENEROWANIE & EKSPORT */}
          {activeStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-5">
                {/* Summary + Generate CTA */}
                <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    Podsumowanie i generowanie AI
                  </h2>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--ink-muted)] block">Silnik &amp; Tryb</span>
                      <span className="font-bold text-[var(--ink-primary)]">
                        {aiEngine.toUpperCase()} · {genMode === "storyboard" ? `${computedScenes.length} scen` : "1 ujęcie"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--ink-muted)] block">Parametry obrazu</span>
                      <span className="font-bold text-[var(--ink-primary)]">
                        {videoResolution} · {genAspectRatio} · {duration}s
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--ink-muted)] block">Referencje PSH</span>
                      <span className="font-bold text-[var(--ink-primary)]">
                        {selectedReferenceAssets.length} zdjęć {mdkCodes.length > 0 ? `(${mdkCodes.join(", ")})` : ""}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] text-[var(--ink-muted)] block">Intro / Outro</span>
                      <span className="font-bold text-[var(--ink-primary)] truncate block">
                        {isLogoIntroEnabled ? "Intro ✓" : "Brak intro"} · {isLogoOutroEnabled ? "Outro ✓" : "Brak outro"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] col-span-2">
                      <span className="text-[10px] text-[var(--ink-muted)] block">Napisy &amp; Audio</span>
                      <span className="font-bold text-[var(--ink-primary)]">
                        {isSubtitlesEnabled ? `${selectedTextLangs.length} rynków (${selectedTextLangs.join(", ")})` : "Bez napisów"} · {isDubEnabled ? `Lektor: ${selectedVoice}` : "Bez lektora"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiVideo}
                    disabled={isGeneratingAiVideo}
                    className="w-full py-3.5 px-5 rounded-xl text-sm font-extrabold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isGeneratingAiVideo ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{generationProgress}% · Renderowanie wideo...</span>
                      </>
                    ) : (
                      <span>⚡ Generuj wideo AI ({generateCostLabel})</span>
                    )}
                  </button>

                  {isGeneratingAiVideo && (
                    <div className="p-3.5 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[var(--ink-primary)] truncate pr-2">
                          {generationStage || "Przetwarzanie wideo w silniku AI..."}
                        </span>
                        <span className="font-mono text-[var(--accent)]">{generationProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Card */}
                <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                      Eksport &amp; Paczka Produkcyjna
                    </h3>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                      Wybierz formaty docelowe do paczki ZIP, pobierz czyste MP4 lub wyeksportuj projekt do DaVinci Resolve.
                    </p>
                  </div>

                  {/* Formaty docelowe paczki ZIP */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-[var(--ink-secondary)] block">
                      Formaty w paczce ZIP:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        ["3x4", "3:4 · Baza"],
                        ["9x16", "9:16 · TikTok"],
                        ["4x5", "4:5 · Feed"],
                        ["1x1", "1:1 · Kwadrat"],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleRatio(key)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            selectedRatios.includes(key)
                              ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                              : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    {videoFile && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadRawMp4}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-center cursor-pointer"
                        >
                          ⬇ Surowe MP4 ({genAspectRatio === "4:5" ? "baza 3:4" : genAspectRatio})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBurnAndDownloadSingleVideo("4:5", !isSubtitlesEnabled)}
                          disabled={isBurningVideo}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                            genAspectRatio === "4:5"
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-xs hover:opacity-95"
                              : "border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent)]"
                          }`}
                        >
                          ✂ Pobierz docięte 4:5 (1080×1350)
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleQuickExportZip}
                      disabled={isExportingZip || isBurningVideo}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-bold border border-[#7c5cff] bg-[#efecff] dark:bg-[#221b3d] text-[#7c5cff] dark:text-[#9d85ff] hover:bg-[#7c5cff] hover:text-white transition-all cursor-pointer"
                    >
                      {isExportingZip || isBurningVideo
                        ? "Wypalanie & Pakowanie..."
                        : isSubtitlesEnabled
                        ? `💾 Pobierz ZIP z wersjami rynkowymi (${selectedTextLangs.length} rynków)`
                        : "💾 Pobierz paczkę formatów (ZIP)"}
                    </button>

                    {isSubtitlesEnabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleBurnAndDownloadSingleVideo("9:16")}
                          disabled={isBurningVideo}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7c5cff] to-[#9d85ff] hover:opacity-95 cursor-pointer"
                        >
                          🔥 Wypal 9:16 ({previewLang})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSrtOnly(previewLang)}
                          className="px-3 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[#7c5cff] cursor-pointer"
                        >
                          📄 Pobierz .SRT ({previewLang})
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleExportDaVinciFCPXML}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-subtle)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer"
                    >
                      🎬 Eksportuj oś czasu DaVinci (.fcpxml)
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] hover:border-[var(--accent)] cursor-pointer"
                >
                  ← Wstecz: Napisy &amp; Lektor
                </button>
              </div>

              {renderPreviewColumn(false, true)}
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* MODE: EDIT / MONTAGE (Mam plik wideo)                     */
        /* ======================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Upload Wideo */}
            <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  1. Plik wideo do montażu
                </h2>
                {uploadedFileName ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    ✓ Wczytany plik
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--ink-muted)]">MP4 / MOV</span>
                )}
              </div>

              {uploadedFileName ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-[var(--ink-primary)] truncate block">
                        🎬 {uploadedFileName}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--ink-muted)] mt-0.5">
                        <span>Rozmiar: {uploadedFileSize || "—"}</span>
                        <span>·</span>
                        <span>Czas: <b className="text-[var(--accent)]">{duration}s</b></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <label className="px-2.5 py-1 rounded-lg text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer">
                        Zmień ↻
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleClearVideo}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="Usuń wideo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-[#7c5cff]/40 hover:border-[#7c5cff] bg-[var(--bg-subtle)] hover:bg-[#7c5cff]/5 p-6 rounded-2xl text-center cursor-pointer transition-all">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#efecff] dark:bg-[#221b3d] text-[#7c5cff] grid place-items-center text-xl shadow-xs">
                    ↑
                  </div>
                  <span className="text-xs font-extrabold text-[var(--ink-primary)] block">
                    Kliknij lub przeciągnij plik wideo tutaj
                  </span>
                  <span className="text-[11px] text-[var(--ink-muted)] block mt-1">
                    Obsługa MP4, MOV. Długość klipu zostanie dopasowana automatycznie.
                  </span>
                  <span className="inline-block mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#7c5cff] shadow-xs">
                    Wybierz wideo z komputera
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              )}

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-[var(--ink-secondary)]">
                  Kod MDK (dla nazwy plików i paczki):
                </label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="np. 001KR-83X"
                  className="w-36 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] text-right"
                />
              </div>
            </div>

            {renderFormatsCard()}
            {renderIntroOutroCards()}

            {/* 4. Napisy */}
            <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Napisy &amp; Tłumaczenia na osi czasu
                </h2>
                <input
                  type="checkbox"
                  checked={isSubtitlesEnabled}
                  onChange={(e) => setIsSubtitlesEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#7c5cff] cursor-pointer"
                />
              </div>

              {isSubtitlesEnabled && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  {renderSubtitlesSection()}
                </div>
              )}
            </div>

            {renderAudioVoiceoverCard()}
          </div>

          {renderPreviewColumn(true)}
        </div>
      )}

      {/* Wypalanie Napisów Progress Modal */}
      {isBurningVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-strong)] p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#efecff] dark:bg-[#221b3d] text-[#7c5cff] grid place-items-center text-2xl animate-pulse shadow-md">
              🔥
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--ink-primary)]">
                Wypalanie napisów bezpośrednio na wideo
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1">
                Klatka po klatce w kroju Euclid Circular B w strefie Safe Zone TikToka ({previewLang}). Zero potrzeby otwierania DaVinci Resolve.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="w-full h-3 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div
                  className="h-full bg-gradient-to-r from-[#7c5cff] to-[#9d85ff] transition-all duration-150"
                  style={{ width: `${burnProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                <span>{burnStatus}</span>
                <span className="font-bold text-[#7c5cff]">{burnProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Sinsay Logo Modal */}
      <AnimatedLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        selectedConfig={selectedLogo}
        onSelectConfig={(cfg) => {
          userPickedOutroRef.current = true;
          setSelectedLogo(cfg);
          showToast(`Ustawiono logo: ${cfg.name}`);
        }}
      />

      {/* Animated Sinsay Intro Logo Modal */}
      <AnimatedLogoModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
        selectedConfig={selectedIntroLogo}
        onSelectConfig={(cfg) => {
          userPickedIntroRef.current = true;
          setSelectedIntroLogo(cfg);
          showToast(`Ustawiono intro: ${cfg.name}`);
        }}
      />
    </div>
  );
};
