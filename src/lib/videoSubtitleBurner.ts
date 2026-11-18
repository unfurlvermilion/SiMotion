"use client";

export interface BurnSubtitlesOptions {
  videoSrc: string;
  targetRatio: "9:16" | "3:4" | "4:5" | "1:1";
  targetResolution?: { width: number; height: number };
  cropOffsetPercent?: number; // -50 to +50
  cues: Array<{
    startSec: number;
    endSec: number;
    text: string;
    line2?: string;
  }>;
  captionConfig: {
    yPercent: number; // 20 - 80%
    font: "euclid" | "sans" | "serif";
    weight: "bold" | "semibold" | "medium";
    style: "pill" | "shadow" | "tiktok_neon" | "clean";
    size: "sm" | "base" | "lg";
  };
  durationSec?: number;
  playbackSpeed?: number; // 1.0 = normal 1:1 output duration
  bgmAudioSrc?: string;
  bgmVolume?: number;
  logoOutro?: {
    imageSrc?: string;
    durationSec: number;
  };
  onProgress?: (percent: number, status: string) => void;
}

const DEFAULT_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 }, // Standard TikTok / Reels vertical
  "3:4": { width: 1440, height: 1920 },  // Sinsay Fashion Master Base
  "4:5": { width: 1080, height: 1350 },  // IG Feed Smart Crop
  "1:1": { width: 1080, height: 1080 },  // Square Catalog
};

export function getVideoExtension(blob: Blob): "mp4" | "webm" {
  return blob.type && blob.type.toLowerCase().includes("webm") ? "webm" : "mp4";
}

export async function burnSubtitlesToVideo(options: BurnSubtitlesOptions): Promise<Blob> {
  const {
    videoSrc,
    targetRatio,
    targetResolution = DEFAULT_RESOLUTIONS[targetRatio] || { width: 1080, height: 1920 },
    cropOffsetPercent = 0,
    cues = [],
    captionConfig,
    bgmAudioSrc,
    bgmVolume = 0.35,
    logoOutro,
    onProgress = () => {},
  } = options;

  return new Promise(async (resolve, reject) => {
    onProgress(5, "Pobieranie wideo źródłowego do pamięci...");

    let localObjectUrl: string | null = null;
    let effectiveSrc = videoSrc;
    if (!videoSrc.startsWith("blob:") && !videoSrc.startsWith("data:")) {
      try {
        const res = await fetch(videoSrc, { cache: "no-store" });
        if (res.ok) {
          const blob = await res.blob();
          localObjectUrl = URL.createObjectURL(blob);
          effectiveSrc = localObjectUrl;
        }
      } catch (e) {
        console.warn("Pre-fetch wideo nieudany, używam bezpośredniego URL:", e);
      }
    }

    // Decode animated GIF frames via ImageDecoder (Chrome/Edge) for true animated outro
    const outroFrames: Array<{ bitmap: ImageBitmap; durationSec: number }> = [];
    if (logoOutro?.imageSrc && logoOutro.imageSrc.toLowerCase().endsWith(".gif") && typeof (window as any).ImageDecoder !== "undefined") {
      try {
        const gifRes = await fetch(logoOutro.imageSrc);
        if (gifRes.ok) {
          const gifBuf = await gifRes.arrayBuffer();
          const DecoderCtor = (window as any).ImageDecoder;
          const decoder = new DecoderCtor({ data: gifBuf, type: "image/gif" });
          await decoder.tracks.ready;
          const frameCount = decoder.tracks.selectedTrack?.frameCount || 0;
          for (let fIdx = 0; fIdx < frameCount; fIdx++) {
            const { image } = await decoder.decode({ frameIndex: fIdx });
            const bitmap = await createImageBitmap(image);
            const durSec = (image.duration || 40000) / 1_000_000;
            image.close();
            outroFrames.push({ bitmap, durationSec: durSec > 0 ? durSec : 0.04 });
          }
          decoder.close();
        }
      } catch (gifErr) {
        console.warn("GIF ImageDecoder fallback to static image:", gifErr);
      }
    }

    // Pre-fetch & decode optional BGM audio track
    let audioCtx: AudioContext | null = null;
    let bgmAudioBuffer: AudioBuffer | null = null;
    if (bgmAudioSrc && typeof AudioContext !== "undefined") {
      try {
        const audioRes = await fetch(bgmAudioSrc);
        if (audioRes.ok) {
          const audioBytes = await audioRes.arrayBuffer();
          audioCtx = new AudioContext();
          bgmAudioBuffer = await audioCtx.decodeAudioData(audioBytes);
        }
      } catch (audioErr) {
        console.warn("BGM decode fallback (pomijam ścieżkę audio):", audioErr);
        if (audioCtx) {
          audioCtx.close().catch(() => {});
          audioCtx = null;
        }
      }
    }

    const cleanupLocalUrl = () => {
      if (localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl);
        localObjectUrl = null;
      }
      outroFrames.forEach((f) => f.bitmap.close());
      outroFrames.length = 0;
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.src = effectiveSrc;
    video.muted = true; // Gwarantuje brak blokady autoplay w pętlach wielojęzycznych
    video.playsInline = true;
    video.autoplay = false;

    // Optional outro image element
    let outroImg: HTMLImageElement | null = null;
    if (logoOutro?.imageSrc) {
      outroImg = new Image();
      outroImg.crossOrigin = "anonymous";
      outroImg.src = logoOutro.imageSrc;
    }

    let started = false;
    const startRendering = () => {
      if (started) return;
      started = true;

      const actualVideoDur = isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
      const totalDur = options.durationSec ? Math.min(options.durationSec, actualVideoDur) : actualVideoDur;
      const canvas = document.createElement("canvas");
      canvas.width = targetResolution.width;
      canvas.height = targetResolution.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        cleanupLocalUrl();
        reject(new Error("Nie można utworzyć kontekstu Canvas 2D."));
        return;
      }

      // Check supported mime types
      let mimeType = "video/webm;codecs=vp9";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
          mimeType = "video/mp4;codecs=avc1";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
          mimeType = "video/webm;codecs=h264";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        }
      }

      const stream = canvas.captureStream(30);

      // Mix optional BGM audio track or source video audio track
      let bgmSourceNode: AudioBufferSourceNode | null = null;
      if (audioCtx && bgmAudioBuffer) {
        try {
          if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
          }
          const dest = audioCtx.createMediaStreamDestination();
          bgmSourceNode = audioCtx.createBufferSource();
          bgmSourceNode.buffer = bgmAudioBuffer;
          bgmSourceNode.loop = true;

          const gainNode = audioCtx.createGain();
          gainNode.gain.value = bgmVolume;

          bgmSourceNode.connect(gainNode);
          gainNode.connect(dest);
          bgmSourceNode.start(0);

          const bgmTracks = dest.stream.getAudioTracks();
          if (bgmTracks.length > 0) {
            stream.addTrack(bgmTracks[0]);
          }
        } catch (audioMixErr) {
          console.warn("BGM mix fallback:", audioMixErr);
        }
      } else {
        try {
          // @ts-ignore
          const captureFn = video.captureStream || video.mozCaptureStream;
          if (captureFn) {
            const vStream = captureFn.call(video);
            const audioTracks = vStream.getAudioTracks();
            if (audioTracks && audioTracks.length > 0) {
              stream.addTrack(audioTracks[0]);
            }
          }
        } catch (e) {
          console.warn("Audio track capture fallback:", e);
        }
      }

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 8_000_000, // 8 Mbps high quality
        });
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      mediaRecorder.onstop = () => {
        cleanupLocalUrl();
        onProgress(100, "Zakończono wypalanie napisów!");
        const finalBlob = new Blob(chunks, { type: mimeType.split(";")[0] || "video/mp4" });
        resolve(finalBlob);
      };

      mediaRecorder.start(200);

      // Render loop at 1.0x speed so output duration & motion match source 1:1
      let animId: number;
      const speed = options.playbackSpeed ?? 1.0;
      video.playbackRate = speed;
      video.currentTime = 0;
      video.play().catch((err) => {
        console.warn("Auto-play error, proceeding:", err);
      });

      const drawFrame = () => {
        const t = video.currentTime;
        const progress = Math.min(99, Math.round((t / totalDur) * 100));
        onProgress(progress, `Wypalanie klatek: ${t.toFixed(1)}s / ${totalDur.toFixed(1)}s (${targetRatio})`);

        // 1. Draw Video Frame with Smart Crop
        const vw = video.videoWidth || canvas.width;
        const vh = video.videoHeight || canvas.height;
        const videoRatio = vw / vh;
        const targetRatioNum = canvas.width / canvas.height;

        let sx = 0, sy = 0, sw = vw, sh = vh;
        if (videoRatio > targetRatioNum) {
          sw = vh * targetRatioNum;
          const maxShift = (vw - sw) / 2;
          const shiftX = (cropOffsetPercent / 50) * maxShift;
          sx = Math.max(0, Math.min(vw - sw, (vw - sw) / 2 + shiftX));
        } else {
          sh = vw / targetRatioNum;
          sy = (vh - sh) / 2;
        }

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        // 2. Draw Subtitle Cue if active at timestamp `t`
        const activeCue = cues.find((c) => t >= c.startSec && t < c.endSec);
        if (activeCue && (activeCue.text || activeCue.line2)) {
          const l1 = activeCue.text || "";
          const l2 = activeCue.line2 || "";

          const scale = Math.min(1.15, canvas.width / 1080);
          let baseFontSize = 46 * scale;
          if (captionConfig.size === "sm") baseFontSize = 36 * scale;
          if (captionConfig.size === "lg") baseFontSize = 58 * scale;

          const fontFamily =
            captionConfig.font === "euclid"
              ? '"Euclid Circular B", "Montserrat", system-ui, sans-serif'
              : captionConfig.font === "serif"
              ? 'Georgia, "Times New Roman", serif'
              : 'system-ui, -apple-system, sans-serif';

          const fontWeight =
            captionConfig.weight === "bold"
              ? "700"
              : captionConfig.weight === "semibold"
              ? "600"
              : "500";

          ctx.font = `${fontWeight} ${baseFontSize}px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const maxTextWidth = canvas.width * 0.84;
          const m1Raw = ctx.measureText(l1);
          const m2Raw = l2 ? ctx.measureText(l2) : { width: 0 };
          const rawMaxWidth = Math.max(m1Raw.width, m2Raw.width);
          if (rawMaxWidth > maxTextWidth && rawMaxWidth > 0) {
            baseFontSize = baseFontSize * (maxTextWidth / rawMaxWidth);
            ctx.font = `${fontWeight} ${baseFontSize}px ${fontFamily}`;
          }

          const paddingX = 42 * (baseFontSize / 46);
          const paddingY = 24 * (baseFontSize / 46);
          const lineSpacing = baseFontSize * 1.25;

          const m1 = ctx.measureText(l1);
          const m2 = l2 ? ctx.measureText(l2) : { width: 0 };
          const textWidth = Math.max(m1.width, m2.width);
          const boxWidth = Math.min(canvas.width * 0.94, textWidth + paddingX * 2);
          const boxHeight = (l2 ? lineSpacing * 2 : lineSpacing) + paddingY * 1.1;

          const yCenter = (canvas.height * captionConfig.yPercent) / 100;
          const xCenter = canvas.width / 2;
          const boxX = xCenter - boxWidth / 2;
          const boxY = yCenter - boxHeight / 2;

          ctx.save();

          if (captionConfig.style === "pill") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
            ctx.lineWidth = 2 * scale;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 28 * scale);
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            }
            ctx.fillStyle = "#ffffff";
          } else if (captionConfig.style === "tiktok_neon") {
            ctx.fillStyle = "#ffee00";
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10 * scale);
              ctx.fill();
            } else {
              ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            }
            ctx.fillStyle = "#000000";
          } else if (captionConfig.style === "shadow") {
            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = 14 * scale;
            ctx.shadowOffsetX = 2 * scale;
            ctx.shadowOffsetY = 4 * scale;
            ctx.fillStyle = "#ffffff";
          } else {
            // Clean black bar with brand red accent
            ctx.fillStyle = "rgba(0, 0, 0, 0.92)";
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.fillStyle = "#c84b31";
            ctx.fillRect(boxX, boxY, 8 * scale, boxHeight);
            ctx.fillStyle = "#ffffff";
          }

          if (l2) {
            ctx.fillText(l1, xCenter, yCenter - lineSpacing * 0.45);
            ctx.fillText(l2, xCenter, yCenter + lineSpacing * 0.45);
          } else {
            ctx.fillText(l1, xCenter, yCenter);
          }
          ctx.restore();
        }

        // 3. Draw Logo Outro if enabled and within last seconds (animated GIF frames + smooth fade)
        const effectiveOutroDur = logoOutro ? Math.min(logoOutro.durationSec, totalDur * 0.45) : 0;
        const outroStart = Math.max(0, totalDur - effectiveOutroDur);
        if (logoOutro && t >= outroStart && (outroFrames.length > 0 || (outroImg && outroImg.complete))) {
          const outroElapsed = Math.max(0, t - outroStart);
          const fadeAlpha = Math.min(1, outroElapsed / 0.35);

          ctx.save();
          ctx.fillStyle = `rgba(0, 0, 0, ${0.9 * fadeAlpha})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          let frameSource: CanvasImageSource | null = null;
          let srcW = 1;
          let srcH = 1;

          if (outroFrames.length > 0) {
            const totalGifDur = outroFrames.reduce((acc, f) => acc + f.durationSec, 0) || 1;
            let gifCursor = outroElapsed % totalGifDur;
            let chosen = outroFrames[outroFrames.length - 1];
            for (const fr of outroFrames) {
              if (gifCursor <= fr.durationSec) {
                chosen = fr;
                break;
              }
              gifCursor -= fr.durationSec;
            }
            frameSource = chosen.bitmap;
            srcW = chosen.bitmap.width || 1;
            srcH = chosen.bitmap.height || 1;
          } else if (outroImg && outroImg.complete) {
            frameSource = outroImg;
            srcW = outroImg.naturalWidth || 1;
            srcH = outroImg.naturalHeight || 1;
          }

          if (frameSource) {
            const maxW = canvas.width * 0.65;
            const maxH = canvas.height * 0.35;
            const imgAspect = srcW / srcH;

            let dw = maxW;
            let dh = dw / imgAspect;
            if (dh > maxH) {
              dh = maxH;
              dw = dh * imgAspect;
            }

            const zoom = 0.94 + 0.06 * fadeAlpha;
            dw *= zoom;
            dh *= zoom;
            const dx = (canvas.width - dw) / 2;
            const dy = (canvas.height - dh) / 2;
            ctx.globalAlpha = fadeAlpha;
            ctx.drawImage(frameSource, dx, dy, dw, dh);
          }
          ctx.restore();
        }

        // Check if finished
        if (t >= totalDur || video.ended) {
          cancelAnimationFrame(animId);
          video.pause();
          if (bgmSourceNode) {
            try { bgmSourceNode.stop(); } catch {}
          }
          setTimeout(() => {
            if (mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
          }, 300);
        } else {
          animId = requestAnimationFrame(drawFrame);
        }
      };

      animId = requestAnimationFrame(drawFrame);
    };

    video.oncanplaythrough = startRendering;
    video.onloadeddata = () => {
      setTimeout(startRendering, 150);
    };

    video.onerror = (err) => {
      cleanupLocalUrl();
      reject(new Error("Błąd wczytywania wideo źródłowego do renderowania: " + String(err)));
    };
  });
}
