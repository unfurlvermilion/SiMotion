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
  playbackSpeed?: number; // Acceleration factor (e.g. 2.0x for fast rendering)
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

export async function burnSubtitlesToVideo(options: BurnSubtitlesOptions): Promise<Blob> {
  const {
    videoSrc,
    targetRatio,
    targetResolution = DEFAULT_RESOLUTIONS[targetRatio] || { width: 1080, height: 1920 },
    cropOffsetPercent = 0,
    cues = [],
    captionConfig,
    logoOutro,
    onProgress = () => {},
  } = options;

  return new Promise((resolve, reject) => {
    onProgress(5, "Inicjalizacja silnika renderującego klatki...");

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = videoSrc;
    video.muted = false;
    video.playsInline = true;
    video.autoplay = false;

    // Optional outro image element
    let outroImg: HTMLImageElement | null = null;
    if (logoOutro?.imageSrc) {
      outroImg = new Image();
      outroImg.crossOrigin = "anonymous";
      outroImg.src = logoOutro.imageSrc;
    }

    video.onloadedmetadata = () => {
      const totalDur = options.durationSec || video.duration || 10;
      const canvas = document.createElement("canvas");
      canvas.width = targetResolution.width;
      canvas.height = targetResolution.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
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

      // Attempt to attach audio track if present in source video
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
        onProgress(100, "Zakończono wypalanie napisów!");
        const finalBlob = new Blob(chunks, { type: mimeType.split(";")[0] || "video/mp4" });
        resolve(finalBlob);
      };

      mediaRecorder.start(200);

      // Render loop with playback acceleration
      let animId: number;
      const speed = options.playbackSpeed || 2.0;
      video.playbackRate = speed;
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

          const scale = canvas.height / 1920;
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
              ? "800"
              : captionConfig.weight === "semibold"
              ? "600"
              : "500";

          ctx.font = `${fontWeight} ${baseFontSize}px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const paddingX = 42 * scale;
          const paddingY = 24 * scale;
          const lineSpacing = baseFontSize * 1.25;

          const m1 = ctx.measureText(l1);
          const m2 = l2 ? ctx.measureText(l2) : { width: 0 };
          const textWidth = Math.max(m1.width, m2.width);
          const boxWidth = textWidth + paddingX * 2;
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

        // 3. Draw Logo Outro if enabled and within last seconds
        if (outroImg && outroImg.complete && logoOutro && t >= Math.max(0, totalDur - logoOutro.durationSec)) {
          ctx.save();
          ctx.fillStyle = "rgba(0, 0, 0, 0.90)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const maxW = canvas.width * 0.65;
          const maxH = canvas.height * 0.35;
          const imgAspect = (outroImg.naturalWidth || 1) / (outroImg.naturalHeight || 1);

          let dw = maxW;
          let dh = dw / imgAspect;
          if (dh > maxH) {
            dh = maxH;
            dw = dh * imgAspect;
          }

          const dx = (canvas.width - dw) / 2;
          const dy = (canvas.height - dh) / 2;
          ctx.drawImage(outroImg, dx, dy, dw, dh);
          ctx.restore();
        }

        // Check if finished
        if (t >= totalDur || video.ended) {
          cancelAnimationFrame(animId);
          video.pause();
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

    video.onerror = (err) => {
      reject(new Error("Błąd wczytywania wideo źródłowego do renderowania: " + String(err)));
    };
  });
}
