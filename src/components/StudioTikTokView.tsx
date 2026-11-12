"use client";

import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import SinsayPhraseAssistant, { SINSAY_MARKETS, SinsayMatchItem } from "./SinsayPhraseAssistant";
import AnimatedLogoModal, { SelectedLogoConfig, LOGO_VARIANTS } from "./AnimatedLogoModal";
import { SocialSafeAreaOverlay } from "./SocialSafeAreaOverlay";

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
  // Model & Generation Settings
  const [aiEngine, setAiEngine] = useState<"comfyui" | "kling" | "seedance" | "higgsfield">("comfyui");
  const [genMode, setGenMode] = useState<"storyboard" | "single">("storyboard");
  const [template, setTemplate] = useState("TikTok try-on · 6 scen");
  const [prompt, setPrompt] = useState(
    "Dynamiczny try-on nowej kolekcji jedwabnej. Zbliżenia na fakturę materiału, naturalny ruch modelki w ciepłym świetle atelier i wyraziste zakończenie z produktem."
  );
  const [duration, setDuration] = useState(10);

  // Subtitle Typography & Positioning System
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
  const [isDubEnabled, setIsDubEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("maja");
  const [selectedBgm, setSelectedBgm] = useState("runway");
  const [selectedDubLangs, setSelectedDubLangs] = useState<string[]>(["PL", "ENG"]);
  const [crossDubs, setCrossDubs] = useState(false);

  // Video Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [activePresetVideo, setActivePresetVideo] = useState<"sample" | "upload">("sample");
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

  // Subtitles & Spoken TikTok Timeline System
  const [subtitleMode, setSubtitleMode] = useState<"timeline" | "static">("timeline");
  const [spokenVoiceoverScript, setSpokenVoiceoverScript] = useState<string>(
    "Hej dziewczyny! Zobaczcie tę nowość z kolekcji Sinsay. Krój układa się obłędnie, a materiał jest lekki jak chmurka. Sprawdźcie w aplikacji i salonach!"
  );

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

  // Active cue based on current video playback timestamp
  const activeCue = subtitleCues.find(
    (c) => currentTime >= c.startSec && currentTime < c.endSec
  );

  const selectedCue = subtitleCues.find((c) => c.id === selectedCueId) || subtitleCues[0];

  const currentCaption = videoCaptions[previewLang] || videoCaptions["PL"] || {
    line1: "Nowa kolekcja",
    line2: "na Twój sposób",
  };

  const activeSubtitleText = activeCue
    ? (activeCue.translations?.[previewLang]?.line1 || activeCue.text)
    : (subtitleMode === "static" ? currentCaption.line1 : "");

  const activeSubtitleLine2 = activeCue
    ? (activeCue.translations?.[previewLang]?.line2 || activeCue.line2 || "")
    : (subtitleMode === "static" ? currentCaption.line2 : "");

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

  const [isExportingZip, setIsExportingZip] = useState(false);

  const handleQuickExportZip = async () => {
    setIsExportingZip(true);
    showToast("Kompresowanie bazy 3:4 oraz formatów (9:16, 4:5, 1:1) do archiwum ZIP...");

    try {
      const zip = new JSZip();
      const folderName = `Sinsay_${productId || "001KR-83X"}_Campaign`;
      const root = zip.folder(folderName) || zip;

      // 1. Manifest
      const manifest = {
        project: "SiMotion Fashion Studio",
        sku: productId || "001KR-83X",
        brand: "Sinsay / LPP SA",
        aiEngine,
        durationSeconds: duration,
        smartCropOffset: `${cropOffset}%`,
        brandTypography: "Euclid Circular B (LPP SA Official)",
        animatedLogoOutro: {
          enabled: isLogoOutroEnabled,
          variant: selectedLogo.name,
          duration: selectedLogo.durationSec,
          file: selectedLogo.filePath,
        },
        formats: [
          { ratio: "3:4", resolution: "1440x1920", useCase: "Master Baza (Moda / E-commerce)" },
          { ratio: "9:16", resolution: "1080x1920", useCase: "TikTok / Reels / Shorts (Side Crop)" },
          { ratio: "4:5", resolution: "1080x1350", useCase: "Meta Feed Smart Crop" },
          { ratio: "1:1", resolution: "1080x1080", useCase: "Kwadrat / Karuzele" },
        ],
        textLanguages: selectedTextLangs,
        dubLanguages: selectedDubLangs,
        voiceover: selectedVoice,
        timestamp: new Date().toISOString(),
      };
      root.file("manifest.json", JSON.stringify(manifest, null, 2));

      // 2. Fetch and add selected animated logo
      if (selectedLogo.gifPath) {
        try {
          const logoRes = await fetch(selectedLogo.gifPath);
          if (logoRes.ok) {
            const logoBlob = await logoRes.blob();
            const logoFileName = selectedLogo.gifPath.split("/").pop() || "logo_outro.gif";
            root.file(`brand/${logoFileName}`, logoBlob);
          }
        } catch (e) {
          console.warn("Logo fetch failed", e);
        }
      }

      // 3. Subtitles SRT & VTT files generated from timed subtitleCues
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

        root.file(`subtitles/subtitles_${lang.toLowerCase()}_timed.srt`, srtContent);
        root.file(`subtitles/subtitles_${lang.toLowerCase()}_timed.vtt`, vttContent);
      });

      // 4. Video files
      if (videoFile) {
        try {
          const vRes = await fetch(videoFile);
          const vBlob = await vRes.blob();
          root.file("video/00_master_3x4_Base.mp4", vBlob);
          root.file("video/01_vertical_9x16_TikTok.mp4", vBlob);
          root.file("video/02_feed_4x5_SmartCrop.mp4", vBlob);
          root.file("video/03_square_1x1_Catalog.mp4", vBlob);
        } catch (e) {
          root.file("video/README.txt", "Wideo wygenerowane przez silnik: " + aiEngine);
        }
      } else {
        const videoSpecs = `SiMotion Video Production Render Specifications\n` +
          `===================================================\n` +
          `SKU: ${productId || "001KR-83X"}\n` +
          `AI Engine: ${aiEngine}\n` +
          `Audio: ElevenLabs Voice (${selectedVoice})\n` +
          `Formats included:\n` +
          `  - 3:4 (1440x1920) Master Fashion Base\n` +
          `  - 9:16 (1080x1920) TikTok / Reels / Shorts (Side Crop Offset: ${cropOffset}%)\n` +
          `  - 4:5 (1080x1350) IG Feed Smart Crop\n` +
          `  - 1:1 (1080x1080) Square Product Creative\n` +
          `Burned-in Subtitles Font: Euclid Circular B (Bold 700)\n` +
          `Logo Outro Animation: ${selectedLogo.name} (${selectedLogo.durationSec}s)\n` +
          `Date: ${new Date().toISOString()}\n`;
        root.file("video/render_specifications.txt", videoSpecs);
      }

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Sinsay_${productId || "001KR-83X"}_Campaign_3Formats.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      showToast("✓ Pobrano paczkę 3 formatów (ZIP)!");
    } catch (err) {
      console.error("ZIP export failed:", err);
      showToast("Błąd podczas generowania paczki ZIP.");
    } finally {
      setIsExportingZip(false);
    }
  };

  // Modular Storyboard Scenes
  const [showSinsayAssistant, setShowSinsayAssistant] = useState(false);
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
      setActivePresetVideo("upload");
      showToast(`Załadowano wideo testowe: ${file.name}`);
    }
  };

  // Cost calculation
  const ratePerSec = aiEngine === "comfyui" ? 0 : aiEngine === "kling" ? 0.20 : aiEngine === "seedance" ? 0.22 : 0.26;
  const renderMultiplier = separateRender ? Math.max(1, selectedRatios.length) : 1;
  const videoCost = duration * ratePerSec * renderMultiplier;
  const ttsCost = (isDubEnabled ? selectedDubLangs.length : 0) * 0.3;
  const totalCost = (videoCost + ttsCost).toFixed(2);

  // Subtitle styling helper
  const getSubtitleStyleClasses = () => {
    const fontCls = captionFont === "serif" ? "font-serif" : captionFont === "sans" ? "font-sans" : "font-sinsay";
    const weightCls = captionWeight === "medium" ? "font-medium" : captionWeight === "semibold" ? "font-semibold" : "font-bold";
    const sizeCls = captionSize === "sm" ? "text-[8px]" : captionSize === "lg" ? "text-[11px]" : "text-[9.5px]";
    let boxCls = "";
    if (captionStyle === "pill") {
      boxCls = "bg-black/60 text-white border border-white/20 px-2 py-0.5 rounded-lg shadow-md";
    } else if (captionStyle === "shadow") {
      boxCls = "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] drop-shadow-[0_0_10px_rgba(0,0,0,0.9)]";
    } else if (captionStyle === "tiktok_neon") {
      boxCls = "bg-[#f8e71c] text-black font-extrabold px-2 py-0.5 rounded shadow-lg";
    } else {
      // clean solid
      boxCls = "bg-black/85 text-white px-2.5 py-1 rounded-md border border-white/10";
    }
    return `${fontCls} ${weightCls} ${sizeCls} ${boxCls}`;
  };

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

  const toggleDubLang = (lang: string) => {
    setSelectedDubLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
            Studio wideo
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
            Generowanie bazy 3:4 i automatyczne kadry pod TikTok, IG Feed oraz kwadrat.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleQuickExportZip}
            disabled={isExportingZip}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#c84b31] bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>{isExportingZip ? "Pakowanie..." : "Pobierz formaty (ZIP)"}</span>
          </button>
          {onProceedToPost && (
            <button
              onClick={onProceedToPost}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
            >
              Eksport paczek →
            </button>
          )}
          <button
            onClick={() =>
              showToast(
                `Zlecono generację wideo: ${aiEngine.toUpperCase()} ($${totalCost})`
              )
            }
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--accent)] shadow-[var(--shadow-pop)] hover:opacity-95"
          >
            Generuj wideo (${totalCost})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Produkt i Model */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                Produkt i model
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
                  className="px-3 py-2 rounded-xl text-xs font-bold border bg-[var(--bg-card)] border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                >
                  Pobierz ↻
                </button>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap text-[10px] text-[var(--ink-muted)]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  ✓ packshot
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  ✓ model
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  ✓ detal
                </span>
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
                  <option value="comfyui">🖥️ Lokalny ComfyUI (GPU / Biuro) — 0 zł</option>
                  <option value="kling">🎬 Kling AI 1.5 Video</option>
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
                  className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
                >
                  <option value="storyboard">Storyboard (6 scen)</option>
                  <option value="single">Pojedyncze ujęcie</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--ink-primary)] block">
                  Prompt wideo
                </label>
                <button
                  type="button"
                  onClick={() => setShowSinsayAssistant((prev) => !prev)}
                  className="text-[11px] font-bold text-[#c84b31] dark:text-[#e56b4e] hover:underline flex items-center gap-1"
                >
                  <span>Hasła Sinsay</span>
                  <span>{showSinsayAssistant ? "▲" : "▼"}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)]"
              />
            </div>

            {showSinsayAssistant && (
              <div className="pt-2">
                <SinsayPhraseAssistant
                  currentPrompt={prompt}
                  onSelectPhrase={(item) => {
                    setPrompt(`${item.pl}. Dynamiczny try-on modowy Sinsay.`);
                    showToast(`Zastosowano hasło Sinsay: "${item.pl}" (${item.score}% Match)`);
                  }}
                />
              </div>
            )}

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
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--ink-muted)]">
                <span>5 s (Krótki Hook)</span>
                <span>10 s (Optimum)</span>
                <span>30 s (Story)</span>
              </div>
            </div>
          </div>

          {/* 2. Formaty i kadrowanie */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                Formaty i kadrowanie
              </h2>
            </div>

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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedRatios.includes(key)
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span>Przesunięcie kadru (Smart Crop)</span>
                <span className="text-[var(--accent)] font-extrabold">
                  {cropOffset > 0 ? `+${cropOffset}%` : `${cropOffset}%`}
                </span>
              </div>
              <input
                type="range"
                min={-40}
                max={40}
                value={cropOffset}
                onChange={(e) => setCropOffset(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--ink-muted)]">
                <span>Lewo (−40%)</span>
                <span>Środek (0%)</span>
                <span>Prawo (+40%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
              <div>
                <b className="text-xs block text-[var(--ink-primary)]">
                  Strefy ochronne (TikTok / Reels)
                </b>
                <small className="text-[10px] text-[var(--ink-muted)]">
                  Podgląd bezpiecznego pola pod interfejs aplikacji
                </small>
              </div>
              <input
                type="checkbox"
                checked={showSafeAreas}
                onChange={(e) => setShowSafeAreas(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
              <div>
                <b className="text-xs block text-[var(--ink-primary)]">
                  Osobny render dla każdego formatu
                </b>
                <small className="text-[10px] text-[var(--ink-muted)]">
                  Wyłącza kadrowanie z bazy (3x wyższy koszt)
                </small>
              </div>
              <input
                type="checkbox"
                checked={separateRender}
                onChange={(e) => setSeparateRender(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
            </div>
          </div>

          {/* 3. Języki i dźwięk */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
              Języki i dźwięk
            </h2>

            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <span className="text-xs font-bold text-[var(--ink-primary)]">
                  Napisy ({selectedTextLangs.length} z {SINSAY_MARKETS.length} rynków):
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedTextLangs(["PL", "RO", "CZ", "SK", "HU"])}
                    className="text-[var(--accent)] hover:underline font-bold"
                  >
                    Top 5 CEE
                  </button>
                  <span className="text-[var(--ink-muted)]">·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTextLangs(SINSAY_MARKETS.map((m) => m.code))}
                    className="text-[var(--accent)] hover:underline font-bold"
                  >
                    Wszystkie 28
                  </button>
                  <span className="text-[var(--ink-muted)]">·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTextLangs(["PL"])}
                    className="text-[var(--ink-muted)] hover:underline"
                  >
                    Tylko PL
                  </button>
                </div>
              </div>

              {/* All 28 Sinsay Markets Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
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
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                        isPreview
                          ? "ring-2 ring-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-extrabold shadow-sm"
                          : isSelected
                          ? "bg-[var(--accent-soft)]/50 border-[var(--accent)]/50 text-[var(--accent)] font-bold"
                          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] opacity-60 hover:opacity-100"
                      }`}
                      title={`${m.name} (${m.region}) - kliknij aby edytować i podejrzeć`}
                    >
                      <span>{m.flag}</span>
                      <span>{m.code}</span>
                    </button>
                  );
                })}
              </div>

              {/* Subtitle Timeline & Spoken TikTok Suite */}
              <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] space-y-3">
                {/* Header with Mode Toggle & Language Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--ink-primary)]">
                      Napisy dla rynku: <b className="text-[var(--accent)]">{previewLang}</b>
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)]">
                      (Euclid Circular B)
                    </span>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSubtitleMode("timeline")}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        subtitleMode === "timeline"
                          ? "bg-[var(--accent)] text-white shadow-xs"
                          : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      ⏱ Oś Czasu ({subtitleCues.length} sceny)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubtitleMode("static")}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        subtitleMode === "static"
                          ? "bg-[var(--accent)] text-white shadow-xs"
                          : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      }`}
                    >
                      Statyczne hasło
                    </button>
                  </div>
                </div>

                {/* AI & Automation Quick Bar */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={generateCuesFromPrompt}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#fceee9] dark:bg-[#38211c] text-[#c84b31] dark:text-[#e56b4e] hover:bg-[#c84b31] hover:text-white transition-all flex items-center gap-1 border border-[#c84b31]/30 cursor-pointer"
                    title="Automatycznie wygeneruj 4 zgrane w czasie segmenty napisów z promptu wideo"
                  >
                    <span>✨ Plan z promptu wideo</span>
                  </button>

                  <button
                    type="button"
                    onClick={syncSubtitlesWithVoiceover}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#e6f4ed] dark:bg-[#193328] text-[#1d6346] dark:text-[#75d9ae] hover:bg-[#1d6346] hover:text-white transition-all flex items-center gap-1 border border-[#1d6346]/30 cursor-pointer"
                    title="Zamień mowę lektora na idealnie zsynchronizowane napisy"
                  >
                    <span>🎙️ Mówiony TikTok: Ze skryptu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPhraseAssistant((prev) => !prev)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[var(--border-strong)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--accent)] transition-all flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    <span>✦ Hasła Sinsay (4 524)</span>
                    <span>{showPhraseAssistant ? "▲" : "▼"}</span>
                  </button>
                </div>

                {/* Sinsay Assistant Drawer */}
                {showPhraseAssistant && (
                  <div className="p-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)]">
                    <SinsayPhraseAssistant
                      onSelectPhrase={handleApplyPhrase}
                      currentPrompt={selectedCue ? selectedCue.text : currentCaption.line1}
                    />
                  </div>
                )}

                {/* TIMELINE MODE: Multi-segment Timeline Editor */}
                {subtitleMode === "timeline" ? (
                  <div className="space-y-3">
                    {/* Visual Interactive Timeline Strip */}
                    <div className="space-y-1 p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-[var(--ink-secondary)]">
                          <span>Oś czasu wideo:</span>
                          <span className="font-mono text-[var(--accent)]">
                            {currentTime.toFixed(1)}s / {duration}s
                          </span>
                        </span>
                        <span className="text-[9px] text-[var(--ink-muted)]">
                          Kliknij segment aby podejrzeć w kadrze
                        </span>
                      </div>

                      {/* Visual Cue Track */}
                      <div className="relative w-full h-8 bg-black/40 rounded-lg overflow-hidden flex border border-white/10 select-none">
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
                              <span className="text-[8px] font-extrabold text-white truncate">
                                {cueText}
                              </span>
                            </div>
                          );
                        })}

                        {/* Playhead Marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none shadow-[0_0_6px_rgba(250,204,21,1)]"
                          style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Selected Cue Editor Card */}
                    {selectedCue && (
                      <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                selectedCue.type === "hook"
                                  ? "bg-[#6e1d2f]"
                                  : selectedCue.type === "speech"
                                  ? "bg-[#c84b31]"
                                  : selectedCue.type === "feature"
                                  ? "bg-[#1d6346]"
                                  : "bg-[#8f4f0e]"
                              }`}
                            />
                            <span className="text-xs font-bold text-[var(--ink-primary)]">
                              Edycja segmentu: {selectedCue.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (subtitleCues.length <= 1) return;
                                setSubtitleCues((prev) => prev.filter((c) => c.id !== selectedCue.id));
                                setSelectedCueId(subtitleCues.find((c) => c.id !== selectedCue.id)?.id || "");
                              }}
                              className="text-[10px] text-rose-500 hover:underline px-1.5 py-0.5 font-bold cursor-pointer"
                              title="Usuń ten segment"
                            >
                              Usuń segment ✕
                            </button>
                          </div>
                        </div>

                        {/* Timing Adjuster */}
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

                        {/* Text Inputs for Active Market */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                              Linia 2 ({previewLang})
                            </label>
                            <input
                              type="text"
                              value={selectedCue.translations?.[previewLang]?.line2 ?? (selectedCue.line2 || "")}
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
                              className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold font-sinsay"
                              placeholder="Opcjonalny podtytuł / CTA"
                            />
                          </div>
                        </div>

                        {/* Cue switcher / adder pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                          <span className="text-[10px] text-[var(--ink-muted)]">Przełącz:</span>
                          {subtitleCues.map((c, i) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCueId(c.id);
                                setCurrentTime(c.startSec);
                                if (videoRef.current) videoRef.current.currentTime = c.startSec;
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                                selectedCueId === c.id
                                  ? "bg-[var(--accent)] text-white"
                                  : "bg-[var(--bg-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                              }`}
                            >
                              0{i + 1} ({c.startSec.toFixed(1)}s)
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const lastCue = subtitleCues[subtitleCues.length - 1];
                              const start = lastCue ? Math.min(duration - 1, lastCue.endSec) : 0;
                              const end = Math.min(duration, start + 2);
                              const newCue: SubtitleCue = {
                                id: `cue-${Date.now()}`,
                                startSec: Number(start.toFixed(1)),
                                endSec: Number(end.toFixed(1)),
                                type: "feature",
                                label: `0${subtitleCues.length + 1} Segment (${start}–${end}s)`,
                                text: "Nowy segment napisów",
                                line2: "",
                              };
                              setSubtitleCues([...subtitleCues, newCue]);
                              setSelectedCueId(newCue.id);
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] hover:opacity-80 ml-auto cursor-pointer"
                          >
                            + Dodaj segment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* STATIC MODE: Classic single subtitle */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--ink-secondary)] block mb-1">
                        Linia 1 (Główne hasło)
                      </label>
                      <input
                        type="text"
                        value={currentCaption.line1}
                        onChange={(e) =>
                          setVideoCaptions({
                            ...videoCaptions,
                            [previewLang]: { ...currentCaption, line1: e.target.value },
                          })
                        }
                        placeholder="np. Nowa kolekcja"
                        className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold font-sinsay"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[var(--ink-secondary)] block mb-1">
                        Linia 2 (Podtytuł / CTA)
                      </label>
                      <input
                        type="text"
                        value={currentCaption.line2}
                        onChange={(e) =>
                          setVideoCaptions({
                            ...videoCaptions,
                            [previewLang]: { ...currentCaption, line2: e.target.value },
                          })
                        }
                        placeholder="np. na Twój sposób"
                        className="w-full px-3 py-1.5 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] font-bold font-sinsay"
                      />
                    </div>
                  </div>
                )}

                {/* Subtitle Positioning & Typography Settings */}
                <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--ink-primary)] flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>Pozycja w kadrze &amp; Typografia Napisów</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                      Wysokość: {captionYPercent}%
                    </span>
                  </div>

                  {/* Vertical Position Slider & Quick Presets */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="20"
                        max="76"
                        step="1"
                        value={captionYPercent}
                        onChange={(e) => setCaptionYPercent(Number(e.target.value))}
                        className="flex-1 accent-[var(--accent)] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCaptionYPercent(64)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            captionYPercent === 64
                              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                              : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                          }`}
                        >
                          ✓ Dół Safe Zone (64%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCaptionYPercent(50)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            captionYPercent === 50
                              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                              : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                          }`}
                        >
                          Centrum (50%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCaptionYPercent(24)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            captionYPercent === 24
                              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                              : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent)]"
                          }`}
                        >
                          Góra (24%)
                        </button>
                      </div>

                      {captionYPercent > 72 && (
                        <span className="text-[10px] font-bold text-rose-500 animate-pulse">
                          ⚠ Wchodzi w pole UI TikToka!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Font, Weight, Style & Size selectors */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[var(--border-subtle)]">
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
                        Styl maski / tła
                      </label>
                      <select
                        value={captionStyle}
                        onChange={(e) => setCaptionStyle(e.target.value as any)}
                        className="w-full px-2 py-1 rounded-lg text-[11px] font-semibold border bg-[var(--bg-card)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
                      >
                        <option value="pill">Pill (Półprzezroczysty)</option>
                        <option value="shadow">Czysty z cieniem</option>
                        <option value="tiktok_neon">TikTok Żółty Neon</option>
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
            </div>

            {/* Mówiony TikTok & Lektor (ElevenLabs) */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <b className="text-xs block text-[var(--ink-primary)]">
                  Mówiony TikTok &amp; Lektor (ElevenLabs)
                </b>
                <span className="text-[10px] text-[var(--ink-muted)] block">
                  Dubbing audio + synchronizacja mowy z napisami wideo
                </span>
              </div>
              <input
                type="checkbox"
                checked={isDubEnabled}
                onChange={(e) => setIsDubEnabled(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
              />
            </div>

            {isDubEnabled && (
              <div className="space-y-3 pt-1">
                {/* Spoken Voiceover Script Editor */}
                <div className="space-y-1.5 p-3 rounded-xl border border-[#c84b31]/30 bg-[#fceee9]/30 dark:bg-[#38211c]/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--ink-primary)] block">
                      🎙️ Kwestia mówiona przez lektora (Skrypt audio):
                    </label>
                    <button
                      type="button"
                      onClick={syncSubtitlesWithVoiceover}
                      className="text-[10px] font-bold text-[#c84b31] dark:text-[#e56b4e] hover:underline cursor-pointer"
                    >
                      ✦ Synchronizuj z napisami
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={spokenVoiceoverScript}
                    onChange={(e) => setSpokenVoiceoverScript(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border bg-white dark:bg-[#1a1714] border-[var(--border-strong)] text-[var(--ink-primary)] font-medium leading-relaxed"
                    placeholder="Wpisz słowa, które lektor ma wypowiedzieć w filmie..."
                  />
                  <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)]">
                    <span>To co jest mówione przez lektora, trafia dokładnie w napisy wideo</span>
                    <span className="font-mono">{spokenVoiceoverScript.length} zn.</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Głos lektora
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
                    >
                      <option value="maja">Maja · Ciepły Editorial</option>
                      <option value="adam">Adam · Dynamiczny Runway</option>
                      <option value="claire">Claire · Luxury Fashion</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-primary)] block mb-1">
                      Muzyka BGM (Brand Kit)
                    </label>
                    <select
                      value={selectedBgm}
                      onChange={(e) => setSelectedBgm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-primary)] cursor-pointer"
                    >
                      <option value="runway">Warm Runway House (122 BPM)</option>
                      <option value="minimal">Atelier Lo-Fi (98 BPM)</option>
                      <option value="none">Bez muzyki</option>
                    </select>
                  </div>
                </div>

                {/* Dubbed voiceover languages selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[var(--ink-primary)]">
                      Lektor dla rynków ({selectedDubLangs.length} z {selectedTextLangs.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDubLangs([...selectedTextLangs])}
                      className="text-[10px] text-[var(--accent)] hover:underline font-bold"
                    >
                      Wszystkie wybrane z napisów
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTextLangs.map((code) => {
                      const isDubSelected = selectedDubLangs.includes(code);
                      const market = SINSAY_MARKETS.find((m) => m.code === code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => toggleDubLang(code)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                            isDubSelected
                              ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-extrabold"
                              : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                          }`}
                        >
                          <span>{market?.flag || "🌐"}</span>
                          <span>{code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Cost Summary Box */}
            <div className="p-4 rounded-xl border bg-[var(--accent-soft)] border-[var(--accent)] flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-[var(--accent)]">
                  {aiEngine === "comfyui" ? `Lokalne GPU: 0.00 zł ${isDubEnabled ? `(+$${totalCost} TTS)` : ""}` : `Estymowany koszt API: $${totalCost}`}
                </div>
                <small className="text-[10px] text-[var(--ink-secondary)] block">
                  {aiEngine === "comfyui"
                    ? "Lokalny serwer ComfyUI (GPU / Biuro)"
                    : aiEngine === "kling"
                    ? "Kling AI 1.5 Video"
                    : aiEngine === "seedance"
                    ? "Seedance 2.0 Fashion"
                    : "Higgsfield AI"}{" "}
                  ({duration} s · {renderMultiplier}× render) + {isDubEnabled ? selectedDubLangs.length : 0}× TTS
                </small>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[var(--bg-card)] text-[var(--accent)] shadow-sm">
                {aiEngine === "comfyui" ? "Serwer Biurowy" : separateRender ? "Multi-render" : "Smart Crop (−66%)"}
              </span>
            </div>
          </div>

          {/* 4. Animowane Logo Sinsay na końcu wideo (Outro) */}
          <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  4. Animowane Logo Sinsay (Outro)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#193328] text-[#75d9ae]">
                  Brand Kit LPP
                </span>
              </div>
              <input
                type="checkbox"
                checked={isLogoOutroEnabled}
                onChange={(e) => setIsLogoOutroEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#c84b31]"
              />
            </div>

            <p className="text-xs text-[var(--ink-secondary)]">
              Automatyczne doklejenie oficjalnego animowanego logo Sinsay na zakończenie każdego klipu.
            </p>

            {isLogoOutroEnabled && (
              <div className="space-y-3 pt-1 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#dfd5c6] dark:border-[#38302b] bg-[var(--bg-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-11 rounded-lg bg-black/80 p-1 flex items-center justify-center shrink-0 border border-black/20">
                      <img
                        src={selectedLogo.gifPath}
                        alt={selectedLogo.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#c84b31] dark:text-[#e56b4e] block">
                        Wybrany wariant animacji:
                      </span>
                      <p className="text-xs font-semibold text-[var(--ink-primary)] mt-0.5">
                        🎬 {selectedLogo.name}
                      </p>
                      <span className="text-[10px] text-[var(--ink-muted)] block">
                        Czas: {selectedLogo.durationSec} s · After Effects (Alfa)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#211d1a] border border-[#dfd5c6] dark:border-[#38302b] hover:border-[#c84b31] text-[var(--ink-primary)] shadow-sm transition-colors whitespace-nowrap"
                  >
                    Zmień wariant ⚙
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--ink-primary)]">
                    <input
                      type="checkbox"
                      checked={previewOutroForce}
                      onChange={(e) => setPreviewOutroForce(e.target.checked)}
                      className="accent-[#c84b31]"
                    />
                    <span>Wymuś podgląd Outro w playerze teraz</span>
                  </label>
                  <span>12 wariantów (.mov)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Column: 4-Frame Live Display (3:4 Master + 3 Smart Crops) & Playback Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Podgląd kadrów (Baza 3:4 → 9:16, 4:5, 1:1)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Direct Safe Area Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSafeAreas(!showSafeAreas)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    showSafeAreas
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                  title="Włącz/wyłącz siatki ochronne pod interfejsy aplikacji"
                >
                  <span>{showSafeAreas ? "✓ Siatki Safe Area" : "○ Bez siatek"}</span>
                </button>

                {/* Upload custom test video */}
                <label className="px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] hover:border-[var(--accent)] cursor-pointer text-[var(--ink-primary)] transition-colors">
                  <span>↑ Wgraj wideo</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Live Language Selector for Preview */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-xs font-bold text-[var(--ink-secondary)] flex items-center gap-1.5">
                <span>Podgląd na wideo:</span>
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
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 shrink-0 ${
                        isActive
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                          : "bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      }`}
                      title={m?.name || code}
                    >
                      <span>{m?.flag || "🌐"}</span>
                      <span>{code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage Container - Perfectly Centered in Vertical & Horizontal */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[var(--champagne)] to-[var(--bg-elevated)] border border-[var(--border-subtle)] grid grid-cols-2 lg:grid-cols-4 gap-4 items-center justify-items-center min-h-[400px] overflow-hidden">
              {/* 1. 3:4 MASTER BAZA */}
              <div className="flex flex-col items-center gap-2 w-full">
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
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-100"
                      style={{ transform: `scale(${1 + Math.sin(currentTime) * 0.05})` }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                    </div>
                  )}

                  {/* Safe Area Guides showing crop lines for 9:16 and 1:1 */}
                  {showSafeAreas && <SocialSafeAreaOverlay format="master-3x4" />}

                  {/* Sinsay Animated Logo Outro Overlay */}
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

                  {/* Dynamic Subtitle anchored by controllable Y position and typography */}
                  {activeSubtitleText && (
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
              </div>

              {/* 2. 9:16 TikTok / Reels Frame (Side Crop with offset) */}
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center justify-between w-full max-w-[130px] px-1 text-[10px] font-bold text-[var(--ink-secondary)]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span>9:16 TikTok</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-muted)]">1080×1920</span>
                </div>

                <div className="w-full max-w-[130px] aspect-[9/16] rounded-2xl border-2 border-black/80 dark:border-white/20 bg-black relative overflow-hidden shadow-xl">
                  {videoFile ? (
                    <video
                      src={videoFile}
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                      style={{ transform: `translateX(${cropOffset * 0.9}%)` }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-150"
                      style={{
                        transform: `translateX(${cropOffset * 0.9}%) scale(${
                          1 + Math.sin(currentTime) * 0.05
                        })`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                    </div>
                  )}

                  {/* TikTok 9:16 In-Feed Safe Area Overlay (2025/2026) */}
                  {showSafeAreas && <SocialSafeAreaOverlay format="tiktok-9x16" />}

                  {/* Sinsay Animated Logo Outro Overlay */}
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

                  {/* Dynamic Subtitle strictly following position inside Safe Zone */}
                  {activeSubtitleText && (
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
              </div>

              {/* 3. 4:5 Frame (Meta Feed Smart Crop) */}
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center justify-between w-full max-w-[145px] px-1 text-[10px] font-bold text-[var(--ink-secondary)]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span>4:5 Feed IG</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-muted)]">1080×1350</span>
                </div>

                <div className="w-full max-w-[145px] aspect-[4/5] rounded-2xl border-2 border-black/80 dark:border-white/20 bg-black relative overflow-hidden shadow-xl">
                  {videoFile ? (
                    <video
                      src={videoFile}
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                      style={{ transform: `translateX(${cropOffset * 0.4}%)` }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-[#3a151e] via-[#6e1d2f] to-[#c84b31] transition-transform duration-150"
                      style={{
                        transform: `translateX(${cropOffset * 0.4}%) scale(${
                          1 + Math.sin(currentTime) * 0.05
                        })`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,#ffeedd_0%,transparent_60%)]" />
                    </div>
                  )}

                  {/* Meta Feed 4:5 Safe Area Overlay */}
                  {showSafeAreas && <SocialSafeAreaOverlay format="feed-4x5" />}

                  {/* Sinsay Animated Logo Outro Overlay */}
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

                  {/* Dynamic Subtitle anchored in Feed Safe Zone */}
                  {activeSubtitleText && (
                    <div
                      className="absolute inset-x-2 z-10 text-center pointer-events-none transition-all duration-150"
                      style={{ top: `${Math.min(78, captionYPercent + 4)}%`, transform: "translateY(-50%)" }}
                    >
                      <p className={`inline-block leading-tight tracking-wide ${getSubtitleStyleClasses()}`}>
                        {activeSubtitleText}
                        {activeSubtitleLine2 && <><br /><span className="opacity-90">{activeSubtitleLine2}</span></>}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. 1:1 Frame (Catalog / Square Carousel) */}
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center justify-between w-full max-w-[150px] px-1 text-[10px] font-bold text-[var(--ink-secondary)]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span>1:1 Kwadrat</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--ink-muted)]">1080×1080</span>
                </div>

                <div className="w-full max-w-[150px] aspect-square rounded-2xl border-2 border-black/80 dark:border-white/20 bg-black relative overflow-hidden shadow-xl">
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

                  {/* Square 1:1 Safe Area Overlay */}
                  {showSafeAreas && <SocialSafeAreaOverlay format="square-1x1" />}

                  {/* Sinsay Animated Logo Outro Overlay */}
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

                  {/* Dynamic Subtitle anchored in Square Safe Zone */}
                  {activeSubtitleText && (
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
              </div>
            </div>

            {/* Live Subtitle Timecode & Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full ${activeCue ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                <span className="font-bold text-[var(--ink-secondary)] text-[11px] truncate">
                  {activeCue ? activeCue.label : "Czysty kadr (brak napisu w tej sekundzie)"}
                </span>
              </div>
              {activeSubtitleText ? (
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
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayback}
                  className="w-9 h-9 rounded-full bg-[var(--accent)] text-white font-extrabold text-sm grid place-items-center shadow-md hover:opacity-95"
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
                  className="w-full accent-[var(--accent)]"
                />
              </div>

              <div className="text-xs font-bold text-[var(--ink-secondary)]">
                Fokus kadru: <span className="text-[var(--accent)]">{cropOffset}%</span>
              </div>
            </div>
          </div>

          {/* Modular Storyboard Grid with Editing */}
          <div className="p-6 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink-primary)]">
                  Storyboard modularny (6 scen)
                </h3>
                <small className="text-xs text-[var(--ink-muted)]">
                  Kliknij „Edytuj”, aby zmienić prompt ujęcia lub „↻” aby przelosować tylko jedną scenę
                </small>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--ink-primary)]">
                {duration} s łącznie
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {scenes.map((scene) => (
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
                      <span>{scene.name}</span>
                      <span className="font-mono">{scene.timeRange}</span>
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

                  <div className="pt-3 border-t border-[var(--border-subtle)] mt-2 flex items-center justify-between gap-1.5">
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
                        className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--ink-primary)]"
                      >
                        {activeEditingScene === scene.id ? "Zapisz" : "Edytuj"}
                      </button>
                      <button
                        onClick={() =>
                          showToast(
                            `Przelosowano Scenę ${scene.name.split(" ")[0]} w silniku ${aiEngine.toUpperCase()} (pozostałe 5 scen zachowano).`
                          )
                        }
                        className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[var(--bg-card)] hover:border-[var(--accent)] text-[var(--accent)]"
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
        </div>
      </div>

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
