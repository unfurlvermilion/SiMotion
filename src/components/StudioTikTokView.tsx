"use client";

import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import SinsayPhraseAssistant, { SINSAY_MARKETS, SinsayMatchItem } from "./SinsayPhraseAssistant";
import AnimatedLogoModal, { SelectedLogoConfig, LOGO_VARIANTS } from "./AnimatedLogoModal";
import { SocialSafeAreaOverlay } from "./SocialSafeAreaOverlay";
import { burnSubtitlesToVideo } from "@/lib/videoSubtitleBurner";

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

interface StudioTikTokViewProps {
  productId: string;
  setProductId: (val: string) => void;
  showToast: (msg: string) => void;
  onProceedToPost: () => void;
}

export const StudioTikTokView: React.FC<StudioTikTokViewProps> = ({
  productId,
  setProductId,
  showToast,
  onProceedToPost,
}) => {
  // Primary Workspace Mode: Generator is DEFAULT, Montage is second
  const [workspaceMode, setWorkspaceMode] = useState<"generate" | "edit">("generate");

  // Video File & Upload State (for edit mode)
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Model & AI Generation Settings
  const [aiEngine, setAiEngine] = useState<"seedance" | "higgsfield">("seedance");
  const [genMode, setGenMode] = useState<"storyboard" | "single">("storyboard");
  const [template, setTemplate] = useState("TikTok try-on · 6 scen");
  const [prompt, setPrompt] = useState(
    "Dynamiczny try-on nowej kolekcji jedwabnej. Zbliżenia na fakturę materiału, naturalny ruch modelki w ciepłym świetle atelier i wyraziste zakończenie z produktem."
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

  // Animated Sinsay Logo Outro
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
  const [previewLang, setPreviewLang] = useState<string>("PL");
  const [showPhraseAssistant, setShowPhraseAssistant] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  // Hardcoded Subtitles In-Browser Burning Engine State
  const [isBurningVideo, setIsBurningVideo] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [burnStatus, setBurnStatus] = useState<string>("");

  const handleBurnAndDownloadSingleVideo = async (ratio: "9:16" | "3:4" | "4:5" | "1:1" = "9:16") => {
    if (!videoFile) {
      showToast("Wgraj plik wideo lub wybierz wideo z sesji, aby wypalić napisy.");
      return;
    }

    setIsBurningVideo(true);
    setBurnProgress(0);
    setBurnStatus("Inicjalizacja silnika renderującego klatki...");

    try {
      const mappedCues = subtitleCues.map((c) => ({
        startSec: c.startSec,
        endSec: c.endSec,
        text: c.translations?.[previewLang]?.line1 || c.text,
        line2: c.translations?.[previewLang]?.line2 || c.line2 || "",
      }));

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
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      a.download = `Sinsay_${productId || "001KR"}_${ratio.replace(":", "x")}_${previewLang}_Wypalone_Napisy.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`✓ Gotowe! Pobrano wideo z wypalonymi napisami (${ratio} · ${previewLang})!`);
    } catch (err: any) {
      console.error("Burn video error:", err);
      showToast("Błąd podczas wypalania napisów: " + err.message);
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
      classes += " bg-black/90 text-white px-3 py-1 rounded-sm shadow-md border-l-2 border-[#c84b31] ";
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
      srtContent = `1\n00:00:00,000 --> 00:00:02,500\n${cap.line1}\n${cap.line2}\n\n2\n00:00:02,550 --> 00:00:0${Math.floor(duration)},000\nSinsay — modne stylizacje w najlepszych cenach.\n`;
    }

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sinsay_${productId || "001KR"}_subtitles_${lang.toLowerCase()}.srt`;
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
      const folderName = `Sinsay_${productId || "001KR-83X"}_Video_Package`;
      const root = zip.folder(folderName) || zip;

      // 1. Manifest
      const manifest = {
        sku: productId || "001KR-83X",
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
            srtContent = `1\n00:00:00,000 --> 00:00:02,500\n${l1}\n${l2}\n\n2\n00:00:02,550 --> 00:00:0${Math.floor(duration)},000\nSinsay — modne stylizacje w najlepszych cenach.\n`;
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

          // 00: Czyste formaty bez napisów (do montażu i archiwum)
          root.file("00_Czyste_Bez_Napisow/00_Master_3x4_Clean.mp4", vBlob);
          root.file("00_Czyste_Bez_Napisow/01_Vertical_9x16_TikTok_Clean.mp4", vBlob);
          root.file("00_Czyste_Bez_Napisow/02_Feed_4x5_IG_Clean.mp4", vBlob);
          root.file("00_Czyste_Bez_Napisow/03_Square_1x1_Catalog_Clean.mp4", vBlob);

          // 01: Wersje rynkowe z automatycznie wypalonymi napisami per rynek
          if (isSubtitlesEnabled && selectedTextLangs.length > 0) {
            setIsBurningVideo(true);
            setBurnProgress(0);

            for (let i = 0; i < selectedTextLangs.length; i++) {
              const lang = selectedTextLangs[i];
              const langFolder = `01_Wersje_Rynkowe_Z_Napisami/${lang}`;
              const basePct = Math.round((i / selectedTextLangs.length) * 100);
              setBurnProgress(basePct);
              setBurnStatus(`[${i + 1}/${selectedTextLangs.length}] Wypalanie napisów dla rynku: ${lang} (9:16 TikTok)...`);

              // Pobierz przetłumaczone kwestie dla danego rynku z matrycy
              const marketCues = subtitleCues.map((c) => ({
                startSec: c.startSec,
                endSec: c.endSec,
                text: c.translations?.[lang]?.line1 || c.translations?.["ENG"]?.line1 || c.text,
                line2: c.translations?.[lang]?.line2 || c.translations?.["ENG"]?.line2 || c.line2 || "",
              }));

              try {
                // Wypal wideo 9:16 z napisami dla danego rynku przy 2.5x przyspieszeniu renderu
                const burned916Blob = await burnSubtitlesToVideo({
                  videoSrc: videoFile,
                  targetRatio: "9:16",
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
                  playbackSpeed: 2.5,
                  logoOutro: isLogoOutroEnabled
                    ? {
                        imageSrc: selectedLogo.gifPath,
                        durationSec: selectedLogo.durationSec,
                      }
                    : undefined,
                  onProgress: (subPct) => {
                    const overall = Math.round(((i + subPct / 100) / selectedTextLangs.length) * 100);
                    setBurnProgress(overall);
                  },
                });

                // Zapisz faktycznie wypalony plik wideo w folderze rynku
                root.file(`${langFolder}/01_Vertical_9x16_TikTok_${lang}_Napisy_Wypalone.mp4`, burned916Blob);
                root.file(`${langFolder}/00_Master_3x4_${lang}.mp4`, vBlob);
                root.file(`${langFolder}/02_Feed_4x5_${lang}.mp4`, vBlob);
                root.file(`${langFolder}/03_Square_1x1_${lang}.mp4`, vBlob);

                if (srtMap[lang]) {
                  root.file(`${langFolder}/napisy_${lang.toLowerCase()}.srt`, srtMap[lang].srt);
                  root.file(`${langFolder}/napisy_${lang.toLowerCase()}.vtt`, srtMap[lang].vtt);
                }
              } catch (burnErr) {
                console.warn(`Błąd wypalania dla ${lang}:`, burnErr);
                root.file(`${langFolder}/01_Vertical_9x16_TikTok_${lang}.mp4`, vBlob);
              }
            }

            setBurnProgress(100);
            setBurnStatus("Wszystkie wersje rynkowe wypalone! Generowanie pliku ZIP...");
          }
        } catch (e) {
          root.file("00_Czyste_Bez_Napisow/README.txt", "Wideo zmontowane z pliku: " + (uploadedFileName || "upload"));
        }
      } else {
        const videoSpecs = `SiMotion Video Production Render Specifications\n` +
          `===================================================\n` +
          `SKU: ${productId || "001KR-83X"}\n` +
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
      link.download = `Sinsay_${productId || "001KR-83X"}_Campaign_Package.zip`;
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
  const handleDurationChange = (newDur: number) => {
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

  // Adjust duration of an individual scene (with +/- buttons or input)
  const handleSceneDurationChange = (sceneId: string, newSec: number) => {
    const safeSec = Number(Math.max(0.5, Math.min(25, newSec)).toFixed(1));
    setScenes((prev) => {
      const next = prev.map((s) => (s.id === sceneId ? { ...s, durationSec: safeSec } : s));
      const newTotal = Number(next.reduce((sum, s) => sum + s.durationSec, 0).toFixed(1));
      setDuration(newTotal);
      return next;
    });
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
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      showToast(`✓ Załadowano wideo: ${file.name}`);
    }
  };

  const handleClearVideo = () => {
    setVideoFile(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Usunięto wczytane wideo. Wyświetlam podgląd referencyjny.");
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    if (vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
      const detectedDur = Math.round(vid.duration * 10) / 10;
      setDuration(detectedDur);
    }
  };

  // Cost calculation for AI generate mode
  const ratePerSec = aiEngine === "seedance" ? 0.22 : 0.26;
  const renderMultiplier = separateRender ? Math.max(1, selectedRatios.length) : 1;
  const videoCost = duration * ratePerSec * renderMultiplier;
  const ttsCost = (isDubEnabled ? selectedDubLangs.length : 0) * 0.3;
  const totalCost = (videoCost + ttsCost).toFixed(2);

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
              className="text-[#c84b31] dark:text-[#e56b4e] hover:underline font-bold cursor-pointer"
            >
              Top 5 CEE
            </button>
            <span className="text-[var(--ink-muted)]">·</span>
            <button
              type="button"
              onClick={() => setSelectedTextLangs(SINSAY_MARKETS.map((m) => m.code))}
              className="text-[#c84b31] dark:text-[#e56b4e] hover:underline font-bold cursor-pointer"
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
                    ? "ring-2 ring-[#c84b31] bg-[#c84b31] text-white border-[#c84b31] shadow-xs"
                    : isSelected
                    ? "bg-[#c84b31]/15 border-[#c84b31]/40 text-[#c84b31] dark:text-[#e56b4e] font-bold"
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
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center gap-1 border border-[#c84b31]/30 cursor-pointer"
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
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[#c84b31]/40 bg-[#fceee9]/40 dark:bg-[#38211c]/30 text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center gap-1 ml-auto cursor-pointer"
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
          <span className="font-mono text-[#c84b31]">
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
                ? "bg-[#c84b31]"
                : cue.type === "feature"
                ? "bg-[#1d6346]"
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
                    ? "bg-[#c84b31]"
                    : selectedCue.type === "feature"
                    ? "bg-[#1d6346]"
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
              className="text-xs font-bold text-[#c84b31] dark:text-[#e56b4e] hover:underline flex items-center gap-1 cursor-pointer"
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
            <span className="font-mono text-[#c84b31] font-extrabold">{captionYPercent}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={80}
            step={1}
            value={captionYPercent}
            onChange={(e) => setCaptionYPercent(Number(e.target.value))}
            className="w-full accent-[#c84b31] cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] mt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCaptionYPercent(64)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  captionYPercent === 64
                    ? "bg-[#c84b31] text-white border-[#c84b31]"
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[#c84b31]"
                }`}
              >
                ✓ Safe Zone (64%)
              </button>
              <button
                type="button"
                onClick={() => setCaptionYPercent(50)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  captionYPercent === 50
                    ? "bg-[#c84b31] text-white border-[#c84b31]"
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[#c84b31]"
                }`}
              >
                Centrum (50%)
              </button>
              <button
                type="button"
                onClick={() => setCaptionYPercent(24)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  captionYPercent === 24
                    ? "bg-[#c84b31] text-white border-[#c84b31]"
                    : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[#c84b31]"
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

  return (
    <div className="space-y-6">
      {/* Top Header & Workspace Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
        <div className="space-y-2">
          {/* Dual-Mode Selector: Generator is FIRST & DEFAULT, Montage is SECOND */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-strong)] gap-1">
            <button
              type="button"
              onClick={() => setWorkspaceMode("generate")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                workspaceMode === "generate"
                  ? "bg-[#c84b31] text-white shadow-sm"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <span>✨ Generator Wideo AI (Seedance / Higgsfield)</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode("edit")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                workspaceMode === "edit"
                  ? "bg-[#c84b31] text-white shadow-sm"
                  : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              <span>🎬 Montaż &amp; Napisy (Mam plik wideo)</span>
              {uploadedFileName && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
              {workspaceMode === "generate"
                ? "Generator Wideo AI · Baza 3:4"
                : "Montaż wideo & Napisy TikTok"}
            </h1>
            <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
              {workspaceMode === "generate"
                ? "Generowanie modowego klipu 3:4 z opcjonalnymi napisami, tłumaczeniami i lektorem oraz kadrowanie pod TikTok, IG i Feed."
                : "Wgraj własne wideo, dodaj napisy z matrycy haseł Sinsay, dopasuj bezpieczne strefy 9:16 i pobierz gotowe formaty."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {workspaceMode === "edit" && isSubtitlesEnabled && (
            <button
              type="button"
              onClick={() => handleDownloadSrtOnly(previewLang)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[#c84b31] hover:text-[#c84b31] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Pobierz plik napisów .SRT dla aktualnego języka"
            >
              <span>📄 Pobierz napisy .SRT ({previewLang})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleQuickExportZip}
            disabled={isExportingZip || isBurningVideo}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#c84b31] bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>
              {isExportingZip || isBurningVideo
                ? "Wypalanie & Pakowanie..."
                : isSubtitlesEnabled
                ? `💾 Pobierz ZIP z wersjami rynkowymi (${selectedTextLangs.length} rynków)`
                : "💾 Zapisz & Pobierz formaty (ZIP)"}
            </span>
          </button>

          {onProceedToPost && (
            <button
              onClick={onProceedToPost}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer"
            >
              Eksport paczek →
            </button>
          )}

          {workspaceMode === "generate" && (
            <button
              onClick={() =>
                showToast(
                  `Zlecono generację wideo: ${aiEngine.toUpperCase()} ($${totalCost})`
                )
              }
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95 cursor-pointer"
            >
              ⚡ Generuj wideo AI (${totalCost})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* ======================================================== */}
          {/* MODE: GENERATE AI VIDEO (DEFAULT)                        */}
          {/* ======================================================== */}
          {workspaceMode === "generate" ? (
            <>
              {/* 1. Produkt i Model AI */}
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    Produkt i model AI
                  </h2>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--status-ok-bg)] text-[var(--status-ok-ink)]">
                    PCM połączone
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                    Kod MDK (artykuł)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-xs border font-mono bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      onClick={() => showToast(`Pobrano zdjęcia dla ${productId} z PCM.`)}
                      className="px-3 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer"
                    >
                      Pobierz ↻
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Silnik wideo
                    </label>
                    <select
                      value={aiEngine}
                      onChange={(e) => setAiEngine(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-medium cursor-pointer"
                    >
                      <option value="seedance">⚡ Seedance 2.0 Fashion</option>
                      <option value="higgsfield">🌪️ Higgsfield AI</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Tryb
                    </label>
                    <select
                      value={genMode}
                      onChange={(e) => setGenMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
                    >
                      <option value="storyboard">Storyboard (6 scen)</option>
                      <option value="single">Pojedyncze ujęcie</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                    Prompt wideo
                  </label>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Czas trwania klipu</span>
                    <span className="text-[var(--accent)] font-extrabold">{duration} s</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={duration}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    className="w-full accent-[var(--accent)] cursor-pointer"
                  />
                </div>
              </div>

              {/* 2. Formaty i Kadrowanie */}
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Formaty i kadrowanie
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

              {/* 3. Panel: Napisy & Tłumaczenia (Włączany jak lektor) */}
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
                    className="w-4 h-4 accent-[#c84b31] cursor-pointer"
                  />
                </div>

                {isSubtitlesEnabled && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    {renderSubtitlesSection()}
                  </div>
                )}
              </div>

              {/* 4. Lektor & Audio (ElevenLabs) */}
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
                    className="w-4 h-4 accent-[#c84b31] cursor-pointer"
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
                        className="px-2 py-1.5 rounded-lg text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)]"
                      >
                        <option value="maja">Maja · Ciepły Editorial</option>
                        <option value="adam">Adam · Dynamiczny Runway</option>
                      </select>
                      <select
                        value={selectedBgm}
                        onChange={(e) => setSelectedBgm(e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)]"
                      >
                        <option value="runway">Warm Runway House</option>
                        <option value="none">Bez muzyki</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Animowane Logo Sinsay (Outro) */}
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                      Animowane Logo Sinsay (Outro)
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#193328] text-[#75d9ae]">
                      Brand Kit LPP
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isLogoOutroEnabled}
                    onChange={(e) => setIsLogoOutroEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#c84b31] cursor-pointer"
                  />
                </div>

                {isLogoOutroEnabled && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-[var(--bg-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-black/80 p-1 flex items-center justify-center shrink-0 border border-black/20">
                        <img
                          src={selectedLogo.gifPath}
                          alt={selectedLogo.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--ink-primary)] block">
                          🎬 {selectedLogo.name}
                        </span>
                        <span className="text-[10px] text-[var(--ink-muted)] block">
                          Czas: {selectedLogo.durationSec}s
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsLogoModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-strong)] hover:border-[#c84b31] text-[var(--ink-primary)] cursor-pointer"
                    >
                      Zmień logo ⚙
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ======================================================== */
            /* MODE: EDIT / MONTAGE (Mam plik wideo)                     */
            /* ======================================================== */
            <>
              {/* 1. DUŻY, CZYTELNY OBSZAR WGRYWANIA WIDEO */}
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)] flex items-center gap-1.5">
                    <span>1. Plik wideo do montażu</span>
                  </h2>
                  {uploadedFileName ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      ✓ Wczytany plik
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--ink-muted)]">
                      MP4 / MOV
                    </span>
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
                  <label className="block border-2 border-dashed border-[#c84b31]/40 hover:border-[#c84b31] bg-[var(--bg-subtle)] hover:bg-[#c84b31]/5 p-6 rounded-2xl text-center cursor-pointer transition-all">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] grid place-items-center text-xl shadow-xs">
                      ↑
                    </div>
                    <span className="text-xs font-extrabold text-[var(--ink-primary)] block">
                      Kliknij lub przeciągnij plik wideo tutaj
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)] block mt-1">
                      Obsługa MP4, MOV. Długość klipu zostanie dopasowana automatycznie.
                    </span>
                    <span className="inline-block mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#c84b31] shadow-xs">
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

                {/* Artykuł MDK powiązany z wideo */}
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

              {/* 2. NAPISY NA OSI CZASU & MATRYCA SINSAY */}
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    2. Napisy &amp; Tłumaczenia na osi czasu
                  </h2>
                  <input
                    type="checkbox"
                    checked={isSubtitlesEnabled}
                    onChange={(e) => setIsSubtitlesEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#c84b31] cursor-pointer"
                  />
                </div>

                {isSubtitlesEnabled && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    {renderSubtitlesSection()}
                  </div>
                )}
              </div>

              {/* 3. ANIMOWANE LOGO SINSAY (OUTRO) */}
              <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                      3. Animowane Logo Sinsay (Outro)
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#193328] text-[#75d9ae]">
                      Brand Kit LPP
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isLogoOutroEnabled}
                    onChange={(e) => setIsLogoOutroEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#c84b31] cursor-pointer"
                  />
                </div>

                {isLogoOutroEnabled && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-[var(--bg-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-black/80 p-1 flex items-center justify-center shrink-0 border border-black/20">
                        <img
                          src={selectedLogo.gifPath}
                          alt={selectedLogo.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--ink-primary)] block">
                          🎬 {selectedLogo.name}
                        </span>
                        <span className="text-[10px] text-[var(--ink-muted)] block">
                          Czas trwania: {selectedLogo.durationSec} s
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsLogoModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-strong)] hover:border-[#c84b31] text-[var(--ink-primary)] cursor-pointer"
                    >
                      Zmień logo ⚙
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Live 4-Format Previews & Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 sm:p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-sm space-y-4">
            {/* Header of Preview */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Podgląd kadrów (3:4 Master → 9:16 TikTok, 4:5, 1:1)
                </h3>
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

            {/* Quick Language Switcher for Preview (if subtitles enabled) */}
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
                    <span className="w-2 h-2 rounded-full bg-[#c84b31]" />
                    <span className="text-[#c84b31]">3:4 Master</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-muted)]">1440×1920</span>
                </div>

                <div className="w-full max-w-[155px] aspect-[3/4] rounded-2xl border-2 border-[#c84b31] bg-black relative overflow-hidden shadow-xl ring-1 ring-[#c84b31]/30">
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
                      className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-100"
                      style={{ transform: `scale(${1 + Math.sin(currentTime) * 0.05})` }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-white/80">
                        <span className="text-xl mb-1">🎬</span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wide">3:4 Baza</span>
                      </div>
                    </div>
                  )}

                  {showSafeAreas && <SocialSafeAreaOverlay format="master-3x4" />}

                  {/* Logo Outro */}
                  {isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= Math.max(0, duration - selectedLogo.durationSec))) && (
                    <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
                      <img
                        src={selectedLogo.gifPath}
                        alt={selectedLogo.name}
                        className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
                      />
                      <span className="text-[7px] font-mono tracking-widest text-[#e56b4e] uppercase block mt-1">
                        {selectedLogo.name}
                      </span>
                    </div>
                  )}

                  {/* Subtitle */}
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

                {isSubtitlesEnabled && (
                  <button
                    type="button"
                    onClick={() => handleBurnAndDownloadSingleVideo("3:4")}
                    disabled={isBurningVideo}
                    className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#fceee9] dark:bg-[#38211c] border border-[#c84b31]/40 text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
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
                      className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-150"
                      style={{
                        transform: `scale(${1.25 + Math.sin(currentTime) * 0.05}) translateX(${cropOffset * 0.4}%)`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                    </div>
                  )}

                  {showSafeAreas && <SocialSafeAreaOverlay format="tiktok-9x16" />}

                  {/* Logo Outro */}
                  {isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= Math.max(0, duration - selectedLogo.durationSec))) && (
                    <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
                      <img
                        src={selectedLogo.gifPath}
                        alt={selectedLogo.name}
                        className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
                      />
                      <span className="text-[7px] font-mono tracking-widest text-[#e56b4e] uppercase block mt-1">
                        {selectedLogo.name}
                      </span>
                    </div>
                  )}

                  {/* Subtitle */}
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

                {isSubtitlesEnabled && (
                  <button
                    type="button"
                    onClick={() => handleBurnAndDownloadSingleVideo("9:16")}
                    disabled={isBurningVideo}
                    className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#fceee9] dark:bg-[#38211c] border border-[#c84b31]/40 text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
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
                      className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-150"
                      style={{
                        transform: `scale(${1.1 + Math.sin(currentTime) * 0.05})`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                    </div>
                  )}

                  {showSafeAreas && <SocialSafeAreaOverlay format="feed-4x5" />}

                  {/* Logo Outro */}
                  {isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= Math.max(0, duration - selectedLogo.durationSec))) && (
                    <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
                      <img
                        src={selectedLogo.gifPath}
                        alt={selectedLogo.name}
                        className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
                      />
                      <span className="text-[7px] font-mono tracking-widest text-[#e56b4e] uppercase block mt-1">
                        {selectedLogo.name}
                      </span>
                    </div>
                  )}

                  {/* Subtitle */}
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

                {isSubtitlesEnabled && (
                  <button
                    type="button"
                    onClick={() => handleBurnAndDownloadSingleVideo("4:5")}
                    disabled={isBurningVideo}
                    className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#fceee9] dark:bg-[#38211c] border border-[#c84b31]/40 text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
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
                      className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-150"
                      style={{
                        transform: `scale(${1 + Math.sin(currentTime) * 0.05})`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                    </div>
                  )}

                  {showSafeAreas && <SocialSafeAreaOverlay format="square-1x1" />}

                  {/* Logo Outro */}
                  {isLogoOutroEnabled && (previewOutroForce || (duration > 0 && currentTime >= Math.max(0, duration - selectedLogo.durationSec))) && (
                    <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-3 transition-all">
                      <img
                        src={selectedLogo.gifPath}
                        alt={selectedLogo.name}
                        className="max-h-[50%] max-w-[80%] object-contain drop-shadow-xl"
                      />
                      <span className="text-[7px] font-mono tracking-widest text-[#e56b4e] uppercase block mt-1">
                        {selectedLogo.name}
                      </span>
                    </div>
                  )}

                  {/* Subtitle */}
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

                {isSubtitlesEnabled && (
                  <button
                    type="button"
                    onClick={() => handleBurnAndDownloadSingleVideo("1:1")}
                    disabled={isBurningVideo}
                    className="w-full max-w-[155px] px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#fceee9] dark:bg-[#38211c] border border-[#c84b31]/40 text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    title="Wypala napisy w formacie 1:1 bez DaVinci Resolve"
                  >
                    <span>🔥 Wypal 1:1 ({previewLang})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status bar: Active cue text & Timecode */}
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
                  className="w-10 h-10 rounded-full bg-[#c84b31] text-white font-extrabold text-sm grid place-items-center shadow-md hover:opacity-95 cursor-pointer"
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
                  className="w-full accent-[#c84b31] cursor-pointer"
                />
              </div>

              <div className="text-xs font-bold text-[var(--ink-secondary)]">
                Fokus kadru: <span className="text-[#c84b31]">{cropOffset}%</span>
              </div>
            </div>
          </div>

          {/* Szybki panel eksportu na dole podglądu */}
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

              <div className="flex items-center gap-2 shrink-0">
                {isSubtitlesEnabled && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleBurnAndDownloadSingleVideo("9:16")}
                      disabled={isBurningVideo}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#c84b31] to-[#e56b4e] hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Wypala napisy w pikselach wideo bezpośrednio w przeglądarce bez DaVinci Resolve"
                    >
                      <span>{isBurningVideo ? "Wypalanie..." : `🔥 Wypal wideo 9:16 (${previewLang})`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSrtOnly(previewLang)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border-strong)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] hover:border-[#c84b31] hover:text-[#c84b31] transition-all cursor-pointer"
                    >
                      📄 Tylko .SRT ({previewLang})
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleQuickExportZip}
                  disabled={isExportingZip || isBurningVideo}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#c84b31] shadow-[var(--shadow-pop)] hover:opacity-95 transition-all cursor-pointer"
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

          {/* Modular Storyboard Grid (Tylko w trybie generatora AI) */}
          {workspaceMode === "generate" && (
            <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                    Storyboard modularny (6 scen)
                  </h3>
                  <small className="text-xs text-[var(--ink-muted)]">
                    Zmieniaj czasówki poszczególnych ujęć przyciskami „−” i „+”, a całkowity czas klipu dostosuje się automatycznie
                  </small>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[#c84b31] font-mono">
                  {duration} s łącznie
                </span>
              </div>

              {/* Visual Storyboard Timeline Track */}
              <div className="space-y-1">
                <div className="relative w-full h-3 bg-black/30 rounded-full overflow-hidden flex border border-white/10 select-none">
                  {computedScenes.map((sc, i) => {
                    const pct = Math.max(5, (sc.durationSec / duration) * 100);
                    const colors = [
                      "bg-[#6e1d2f]",
                      "bg-[#c84b31]",
                      "bg-[#8f4f0e]",
                      "bg-[#1d6346]",
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

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                      <div className="flex justify-between items-center text-[10px] font-bold text-[var(--accent)] mb-1">
                        <span className="truncate pr-1">{scene.name}</span>
                        <span className="font-mono text-[11px] text-[#c84b31] font-extrabold whitespace-nowrap">
                          {scene.timeRange}
                        </span>
                      </div>

                      {/* Kontrola czasówki per scena */}
                      <div className="flex items-center justify-between text-[10px] py-1 px-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] mb-2">
                        <span className="font-bold text-[var(--ink-secondary)] text-[9px]">Czas sceny:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSceneDurationChange(scene.id, scene.durationSec - 0.5)}
                            className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center hover:bg-[#c84b31] hover:text-white transition-all cursor-pointer"
                            title="Skróć ujęcie o 0.5s"
                          >
                            −
                          </button>
                          <span className="font-mono font-extrabold text-[11px] text-[#c84b31] px-0.5">
                            {scene.durationSec.toFixed(1)}s
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSceneDurationChange(scene.id, scene.durationSec + 0.5)}
                            className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 text-[10px] font-bold grid place-items-center hover:bg-[#c84b31] hover:text-white transition-all cursor-pointer"
                            title="Wydłuż ujęcie o 0.5s"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {activeEditingScene === scene.id ? (
                        <textarea
                          rows={2}
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
                        <p className="text-xs text-[var(--ink-secondary)] line-clamp-2">
                          {scene.prompt}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[var(--border-subtle)] mt-2 flex items-center justify-between gap-1.5">
                      <span className="text-[9px] font-mono text-[var(--ink-muted)] truncate">
                        PCM: {scene.pcmImage}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setActiveEditingScene(
                              activeEditingScene === scene.id ? null : scene.id
                            )
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--ink-primary)] cursor-pointer"
                        >
                          {activeEditingScene === scene.id ? "Zapisz" : "Edytuj"}
                        </button>
                        <button
                          onClick={() =>
                            showToast(
                              `Przelosowano Scenę ${scene.name.split(" ")[0]} w silniku ${aiEngine.toUpperCase()}.`
                            )
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--accent)] cursor-pointer"
                          title="Przelosuj ujęcie"
                        >
                          ↻
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wypalanie Napisów Progress Modal */}
      {isBurningVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-strong)] p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] grid place-items-center text-2xl animate-pulse shadow-md">
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
                  className="h-full bg-gradient-to-r from-[#c84b31] to-[#e56b4e] transition-all duration-150"
                  style={{ width: `${burnProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-[var(--ink-muted)]">
                <span>{burnStatus}</span>
                <span className="font-bold text-[#c84b31]">{burnProgress}%</span>
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
          setSelectedLogo(cfg);
          showToast(`Ustawiono logo: ${cfg.name}`);
        }}
      />
    </div>
  );
};
