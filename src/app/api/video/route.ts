import { NextResponse } from "next/server";
import { Storage, type File as GcsFile } from "@google-cloud/storage";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

/* ============================================================================
 * /api/video — generowanie wideo AI
 *
 *  • Seedance (BytePlus ModelArk) — tryb produkcyjny: klucz wyłącznie z
 *    SEEDANCE_API_KEY (Secret Manager), stały adres API, zadanie identyfikowane
 *    przez jobId = "sd_<id zadania BytePlus>" (bezstanowo, działa przy wielu
 *    instancjach Cloud Run). Gotowe wideo jest kopiowane do bucketu GCS
 *    (SIMOTION_VIDEO_BUCKET), bo link BytePlus wygasa po 24 h, i podawane
 *    przeglądarce przez /api/video?jobId=…&file=1.
 *  • Higgsfield — wyłącznie z HIGGSFIELD_API_KEY.
 *  • Symulacja — gdy przeglądarka nie wybrała trybu "live".
 * ========================================================================== */

// ---------------------------------------------------------------------------
// Konfiguracja
// ---------------------------------------------------------------------------

const SEEDANCE_TASKS_URL = (
  process.env.SEEDANCE_API_ENDPOINT ||
  "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks"
).replace(/\/+$/, "");

const HIGGSFIELD_ENDPOINT =
  process.env.HIGGSFIELD_API_ENDPOINT || "https://api.higgsfield.ai/v1/video/generate";

const SEEDANCE_RESOLUTION = process.env.SEEDANCE_RESOLUTION || "720p";
const SEEDANCE_GENERATE_AUDIO = false;
const SEEDANCE_ALLOWED_RATIOS = ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"];

/** Domyślny czas ważności zadania w BytePlus (execution_expires_after), sekundy. */
const SEEDANCE_TASK_EXPIRY_SEC = 172800;

const VIDEO_BUCKET = process.env.SIMOTION_VIDEO_BUCKET || "";
const VIDEO_OBJECT_PREFIX = "seedance/";

const SIMULATION_VIDEO_URL = "/preview/sample_atelier_9x16.mp4";

type SeedanceModelKey = "seedance-2.5" | "seedance-2.0";

interface SeedanceModelSpec {
  key: SeedanceModelKey;
  label: string;
  arkModelId: string;
  minDuration: number;
  maxDuration: number;
  maxReferenceImages: number;
  usdPerMillionTokens: number | null;
}

function parseRate(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

const SEEDANCE_MODELS: Record<SeedanceModelKey, SeedanceModelSpec> = {
  "seedance-2.5": {
    key: "seedance-2.5",
    label: "Seedance 2.5",
    arkModelId: process.env.SEEDANCE_MODEL_ID_25 || "dreamina-seedance-2-5-260628",
    minDuration: 4,
    maxDuration: 30,
    maxReferenceImages: 30,
    usdPerMillionTokens: parseRate(process.env.SEEDANCE_USD_PER_MTOK_25),
  },
  "seedance-2.0": {
    key: "seedance-2.0",
    label: "Seedance 2.0",
    arkModelId: process.env.SEEDANCE_MODEL_ID_20 || "dreamina-seedance-2-0-260128",
    minDuration: 4,
    maxDuration: 15,
    maxReferenceImages: 9,
    usdPerMillionTokens: parseRate(process.env.SEEDANCE_USD_PER_MTOK_20),
  },
};

/** Zamienia nazwę modelu z interfejsu (również starsze nazwy pro/turbo/omni) na specyfikację. */
function resolveSeedanceModel(model: string): SeedanceModelSpec {
  const m = (model || "").toLowerCase();
  if (m === "seedance-2.0" || m === SEEDANCE_MODELS["seedance-2.0"].arkModelId) {
    return SEEDANCE_MODELS["seedance-2.0"];
  }
  return SEEDANCE_MODELS["seedance-2.5"];
}

function specByArkModel(arkModel: string | undefined): SeedanceModelSpec | null {
  if (!arkModel) return null;
  return (
    Object.values(SEEDANCE_MODELS).find(
      (s) => arkModel === s.arkModelId || arkModel.startsWith(s.arkModelId)
    ) || null
  );
}

function costFromTokens(spec: SeedanceModelSpec | null, tokens: number | null): number | null {
  if (!spec || spec.usdPerMillionTokens === null || tokens === null) return null;
  return Number(((tokens / 1_000_000) * spec.usdPerMillionTokens).toFixed(4));
}

function seedanceKey(): string {
  return (process.env.SEEDANCE_API_KEY || "").trim();
}

let storageClient: Storage | null = null;
function videoBucketFile(taskId: string): GcsFile | null {
  if (!VIDEO_BUCKET) return null;
  if (!storageClient) storageClient = new Storage();
  return storageClient.bucket(VIDEO_BUCKET).file(`${VIDEO_OBJECT_PREFIX}${taskId}.mp4`);
}

// ---------------------------------------------------------------------------
// Identyfikatory zadań
// ---------------------------------------------------------------------------

const SEEDANCE_PREFIX = "sd_";
const SIMULATION_PREFIX = "sim_";
const TASK_ID_PATTERN = /^[A-Za-z0-9_\-]{1,128}$/;

function parseSeedanceJobId(jobId: string): string | null {
  if (!jobId.startsWith(SEEDANCE_PREFIX)) return null;
  const taskId = jobId.slice(SEEDANCE_PREFIX.length);
  return TASK_ID_PATTERN.test(taskId) ? taskId : null;
}

function parseSimulationJobId(jobId: string): number | null {
  const match = /^sim_(\d{10,})_[a-z0-9]+$/.exec(jobId);
  return match ? Number(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Zadania Higgsfield (bez zmian architektury — pamięć instancji)
// ---------------------------------------------------------------------------

interface HiggsfieldJob {
  id: string;
  createdAt: number;
  status: "processing";
  progress: number;
  stage: string;
  model: string;
  externalTaskId: string;
}

const higgsfieldJobs = new Map<string, HiggsfieldJob>();

// ---------------------------------------------------------------------------
// Klient BytePlus ModelArk
// ---------------------------------------------------------------------------

interface ArkTask {
  id: string;
  model?: string;
  status: "queued" | "running" | "cancelled" | "succeeded" | "failed" | "expired";
  error?: { code?: string; message?: string } | null;
  content?: { video_url?: string; last_frame_url?: string };
  usage?: { completion_tokens?: number; total_tokens?: number };
  created_at?: number;
  updated_at?: number;
  duration?: number;
  resolution?: string;
  ratio?: string;
}

class ArkError extends Error {
  constructor(message: string, public httpStatus: number) {
    super(message);
  }
}

async function arkRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const key = seedanceKey();
  if (!key) throw new ArkError("Klucz Seedance nie jest skonfigurowany na serwerze.", 503);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err: any) {
    throw new ArkError(`Brak połączenia z BytePlus: ${err?.message || err}`, 502);
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      (text ? text.slice(0, 300) : `HTTP ${res.status}`);
    const code = data?.error?.code ? ` [${data.error.code}]` : "";
    throw new ArkError(`BytePlus: ${msg}${code}`, res.status === 404 ? 404 : 502);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Archiwizacja wideo w GCS
// ---------------------------------------------------------------------------

const archivesInFlight = new Map<string, Promise<void>>();

async function archiveVideo(file: GcsFile, sourceUrl: string, task: ArkTask): Promise<void> {
  const existing = archivesInFlight.get(file.name);
  if (existing) return existing;

  const job = (async () => {
    const [exists] = await file.exists();
    if (exists) return;

    const res = await fetch(sourceUrl, { cache: "no-store", signal: AbortSignal.timeout(150_000) });
    if (!res.ok || !res.body) {
      throw new Error(`Nie udało się pobrać wideo z BytePlus (HTTP ${res.status}).`);
    }

    const tokens = task.usage?.total_tokens ?? task.usage?.completion_tokens;
    try {
      await pipeline(
        Readable.fromWeb(res.body as any),
        file.createWriteStream({
          contentType: "video/mp4",
          metadata: {
            metadata: {
              taskId: task.id,
              model: task.model || "",
              totalTokens: tokens !== undefined ? String(tokens) : "",
              resolution: task.resolution || "",
              ratio: task.ratio || "",
              duration: task.duration !== undefined ? String(task.duration) : "",
            },
          },
          preconditionOpts: { ifGenerationMatch: 0 },
        })
      );
    } catch (err: any) {
      // 412 = obiekt zapisał już równoległy request — wynik jest poprawny
      if (err?.code !== 412) throw err;
    }
  })();

  archivesInFlight.set(file.name, job);
  try {
    await job;
  } finally {
    archivesInFlight.delete(file.name);
  }
}

async function readArchivedMetadata(
  file: GcsFile
): Promise<{ size: number; model: string; tokens: number | null } | null> {
  try {
    const [meta] = await file.getMetadata();
    const custom = (meta.metadata || {}) as Record<string, string>;
    const tokens = custom.totalTokens ? Number(custom.totalTokens) : null;
    return {
      size: Number(meta.size || 0),
      model: custom.model || "",
      tokens: Number.isFinite(tokens as number) ? tokens : null,
    };
  } catch (err: any) {
    if (err?.code === 404) return null;
    throw err;
  }
}

function videoFileUrl(jobId: string): string {
  return `/api/video?jobId=${encodeURIComponent(jobId)}&file=1`;
}

// ---------------------------------------------------------------------------
// Walidacja obrazów referencyjnych (packshoty)
// ---------------------------------------------------------------------------

const DATA_URI_PATTERN = /^data:image\/(jpeg|jpg|png|webp|bmp|tiff|gif|heic|heif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

function collectReferenceImages(body: any, spec: SeedanceModelSpec): string[] {
  const candidates: unknown[] = [];
  if (Array.isArray(body.referenceImages)) candidates.push(...body.referenceImages);
  if (typeof body.packshotUrl === "string") candidates.push(body.packshotUrl);

  const images: string[] = [];
  for (const c of candidates) {
    if (typeof c !== "string" || !c.startsWith("data:image/")) continue;
    if (!DATA_URI_PATTERN.test(c)) {
      throw new ArkError("Nieprawidłowy format obrazu referencyjnego.", 400);
    }
    const base64Len = c.length - c.indexOf(",") - 1;
    if (Math.floor((base64Len * 3) / 4) >= MAX_IMAGE_BYTES) {
      throw new ArkError("Obraz referencyjny przekracza 30 MB.", 400);
    }
    if (!images.includes(c)) images.push(c);
  }
  return images.slice(0, spec.maxReferenceImages);
}

// ---------------------------------------------------------------------------
// POST /api/video — zlecenie generacji
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt = "Dynamiczny try-on nowej kolekcji Sinsay. Zbliżenia na fakturę materiału, naturalny ruch modelki w świetle atelier.",
      model = "seedance-2.5",
      duration = 10,
      aspectRatio = "9:16",
      cameraMotion = "smooth push-in",
      lighting = "natural atelier daylight",
      mode = "sandbox",
    } = body;

    const isLive = mode === "live";
    const isHiggsfield = String(model).toLowerCase().includes("higgsfield");

    // 1. HIGGSFIELD (tylko klucz z serwera)
    if (isLive && isHiggsfield) {
      const hfKey = (process.env.HIGGSFIELD_API_KEY || "").trim();
      if (!hfKey) {
        return NextResponse.json(
          { status: "error", message: "Klucz Higgsfield nie jest skonfigurowany na serwerze." },
          { status: 503 }
        );
      }
      const hfRes = await fetch(HIGGSFIELD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hfKey}`,
          "X-Higgsfield-Key": hfKey,
        },
        body: JSON.stringify({
          model: "cinema-2.0",
          prompt,
          reference_image_url:
            typeof body.packshotUrl === "string" && body.packshotUrl.startsWith("https://")
              ? body.packshotUrl
              : undefined,
          aspect_ratio: aspectRatio,
          duration_seconds: duration,
          camera_motion: cameraMotion,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!hfRes.ok) {
        const errText = await hfRes.text().catch(() => "");
        return NextResponse.json(
          { status: "error", message: `Higgsfield: HTTP ${hfRes.status} ${errText.slice(0, 300)}` },
          { status: 502 }
        );
      }
      const hfData = await hfRes.json();
      const jobId = `hf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const externalId = hfData.id || hfData.task_id || jobId;
      higgsfieldJobs.set(jobId, {
        id: jobId,
        createdAt: Date.now(),
        status: "processing",
        progress: 10,
        stage: "Zlecono do klastra Higgsfield Cinema 2.0",
        model,
        externalTaskId: externalId,
      });
      return NextResponse.json({
        status: "processing",
        jobId,
        externalTaskId: externalId,
        source: "higgsfield_live",
        model,
        costUsd: null,
        pollIntervalMs: 5000,
        message: "Zadanie wysłane do API Higgsfield Cinema 2.0.",
      });
    }

    // 2. SEEDANCE — BytePlus ModelArk
    if (isLive) {
      const spec = resolveSeedanceModel(model);
      const requestedDuration = Math.round(Number(duration) || 10);
      const clampedDuration = Math.min(spec.maxDuration, Math.max(spec.minDuration, requestedDuration));
      const ratio = SEEDANCE_ALLOWED_RATIOS.includes(aspectRatio) ? aspectRatio : "adaptive";
      const images = collectReferenceImages(body, spec);

      const content: any[] = [
        {
          type: "text",
          text: `${prompt} | camera: ${cameraMotion} | lighting: ${lighting} | Sinsay style: natural, sharp fabric detail, no plastic skin`,
        },
        ...images.map((url) => ({
          type: "image_url",
          image_url: { url },
          role: "reference_image",
        })),
      ];

      const task = await arkRequest<{ id: string }>(SEEDANCE_TASKS_URL, {
        method: "POST",
        body: JSON.stringify({
          model: spec.arkModelId,
          content,
          ratio,
          duration: clampedDuration,
          resolution: SEEDANCE_RESOLUTION,
          generate_audio: SEEDANCE_GENERATE_AUDIO,
          watermark: false,
        }),
      });

      if (!task?.id || !TASK_ID_PATTERN.test(task.id)) {
        throw new ArkError("BytePlus nie zwrócił identyfikatora zadania.", 502);
      }

      return NextResponse.json({
        status: "processing",
        jobId: `${SEEDANCE_PREFIX}${task.id}`,
        externalTaskId: task.id,
        source: "seedance_live",
        model: spec.key,
        duration: clampedDuration,
        durationAdjusted: clampedDuration !== Number(duration),
        referenceImages: images.length,
        resolution: SEEDANCE_RESOLUTION,
        costUsd: null,
        pollIntervalMs: 5000,
        message: `Zadanie wysłane do ${spec.label} (BytePlus ModelArk).`,
      });
    }

    // 3. SYMULACJA (bez połączeń zewnętrznych)
    const jobId = `${SIMULATION_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      status: "processing",
      jobId,
      source: "sandbox_simulation",
      model,
      costUsd: null,
      etaSeconds: 4,
      pollIntervalMs: 750,
      message: "Rozpoczęto generację wideo w pipeline produkcyjnym SiMotion (symulacja).",
    });
  } catch (err: any) {
    const status = err instanceof ArkError ? err.httpStatus : 500;
    return NextResponse.json(
      { status: "error", message: err?.message || "Błąd zlecania generowania wideo" },
      { status }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/video
//   ?config=1            — konfiguracja (bez sekretów)
//   ?check=1             — test połączenia z BytePlus bez generowania
//   ?jobId=…             — status zadania
//   ?jobId=…&file=1      — plik wideo (z obsługą Range)
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("config") === "1") {
    return NextResponse.json({
      status: "success",
      seedance: {
        keyConfigured: Boolean(seedanceKey()),
        endpointHost: new URL(SEEDANCE_TASKS_URL).host,
        resolution: SEEDANCE_RESOLUTION,
        generateAudio: SEEDANCE_GENERATE_AUDIO,
        storageConfigured: Boolean(VIDEO_BUCKET),
        models: Object.values(SEEDANCE_MODELS).map((s) => ({
          key: s.key,
          label: s.label,
          arkModelId: s.arkModelId,
          minDuration: s.minDuration,
          maxDuration: s.maxDuration,
          usdPerMillionTokens: s.usdPerMillionTokens,
        })),
      },
      higgsfield: { keyConfigured: Boolean((process.env.HIGGSFIELD_API_KEY || "").trim()) },
    });
  }

  if (searchParams.get("check") === "1") {
    try {
      const list = await arkRequest<{ total?: number }>(`${SEEDANCE_TASKS_URL}?page_num=1&page_size=1`);
      return NextResponse.json({
        status: "success",
        message: `Połączono z BytePlus ModelArk (zadań na koncie: ${list?.total ?? 0}).`,
      });
    } catch (err: any) {
      return NextResponse.json(
        { status: "error", message: err?.message || "Błąd połączenia z BytePlus" },
        { status: err instanceof ArkError ? err.httpStatus : 500 }
      );
    }
  }

  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ status: "error", message: "Brak parametru jobId" }, { status: 400 });
  }

  const wantsFile = searchParams.get("file") === "1";
  const seedanceTaskId = parseSeedanceJobId(jobId);

  if (seedanceTaskId) {
    try {
      return wantsFile
        ? await serveSeedanceVideo(req, seedanceTaskId)
        : await seedanceStatus(jobId, seedanceTaskId);
    } catch (err: any) {
      return NextResponse.json(
        { status: "error", message: err?.message || "Błąd odczytu zadania" },
        { status: err instanceof ArkError ? err.httpStatus : 500 }
      );
    }
  }

  // Symulacja — bezstanowa krzywa postępu (~4 s)
  const simCreatedAt = parseSimulationJobId(jobId);
  if (simCreatedAt !== null) {
    const elapsedSec = (Date.now() - simCreatedAt) / 1000;
    let status: "processing" | "completed" = "processing";
    let progress = 25;
    let stage = "Analiza packshotu PCM i kondycjonowanie kadrów...";
    if (elapsedSec >= 4.0) {
      status = "completed";
      progress = 100;
      stage = "Generacja ukończona!";
    } else if (elapsedSec >= 2.5) {
      progress = 75;
      stage = "Renderowanie klatek 9:16 i kompozycja światła atelier...";
    } else if (elapsedSec >= 1.2) {
      progress = 45;
      stage = "Synteza naturalnego ruchu tkaniny z modelu Seedance 2.5...";
    }
    return NextResponse.json({
      status,
      jobId,
      progress,
      stage,
      costUsd: null,
      videoUrl: SIMULATION_VIDEO_URL,
      source: "sandbox_simulation",
    });
  }

  const hfJob = higgsfieldJobs.get(jobId);
  if (hfJob) {
    return NextResponse.json({
      status: hfJob.status,
      jobId: hfJob.id,
      progress: hfJob.progress,
      stage: hfJob.stage,
      model: hfJob.model,
      costUsd: null,
      source: "higgsfield_live",
    });
  }

  // Nieznany identyfikator — zachowanie jak dotychczas (podgląd referencyjny)
  return NextResponse.json({
    status: "completed",
    jobId,
    progress: 100,
    stage: "Wideo gotowe",
    videoUrl: SIMULATION_VIDEO_URL,
  });
}

// ---------------------------------------------------------------------------
// Status zadania Seedance
// ---------------------------------------------------------------------------

async function seedanceStatus(jobId: string, taskId: string) {
  const file = videoBucketFile(taskId);

  // Wideo już zarchiwizowane — nie odpytujemy BytePlus
  if (file) {
    const archived = await readArchivedMetadata(file);
    if (archived) {
      const spec = specByArkModel(archived.model);
      return NextResponse.json({
        status: "completed",
        jobId,
        progress: 100,
        stage: "Generacja ukończona!",
        model: spec?.key || archived.model,
        totalTokens: archived.tokens,
        costUsd: costFromTokens(spec, archived.tokens),
        videoUrl: videoFileUrl(jobId),
        source: "seedance_live",
      });
    }
  }

  const task = await arkRequest<ArkTask>(`${SEEDANCE_TASKS_URL}/${encodeURIComponent(taskId)}`);
  const spec = specByArkModel(task.model);
  const tokens = task.usage?.total_tokens ?? task.usage?.completion_tokens ?? null;
  const base = {
    jobId,
    model: spec?.key || task.model,
    source: "seedance_live" as const,
    pollIntervalMs: 5000,
    expiresAt: task.created_at ? (task.created_at + SEEDANCE_TASK_EXPIRY_SEC) * 1000 : null,
  };

  switch (task.status) {
    case "queued":
      return NextResponse.json({ ...base, status: "processing", progress: 20, stage: "W kolejce BytePlus ModelArk..." });
    case "running":
      return NextResponse.json({
        ...base,
        status: "processing",
        progress: 60,
        stage: `Generowanie wideo w ${spec?.label || "Seedance"}...`,
      });
    case "succeeded": {
      const sourceUrl = task.content?.video_url;
      if (!sourceUrl) throw new ArkError("BytePlus nie zwrócił adresu wideo.", 502);
      if (file) await archiveVideo(file, sourceUrl, task);
      return NextResponse.json({
        ...base,
        status: "completed",
        progress: 100,
        stage: "Generacja ukończona!",
        totalTokens: tokens,
        costUsd: costFromTokens(spec, tokens),
        videoUrl: videoFileUrl(jobId),
        archived: Boolean(file),
      });
    }
    case "failed":
    case "expired":
    case "cancelled":
    default: {
      const label =
        task.status === "expired" ? "Zadanie wygasło" : task.status === "cancelled" ? "Zadanie anulowane" : "Generacja nieudana";
      const detail = task.error?.message ? `: ${task.error.message}` : "";
      const code = task.error?.code ? ` [${task.error.code}]` : "";
      return NextResponse.json({
        ...base,
        status: "failed",
        progress: 100,
        stage: label,
        error: `${label}${detail}${code}`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Plik wideo (GCS lub — bez bucketu — pośredniczenie do BytePlus)
// ---------------------------------------------------------------------------

function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  if (!header || !size) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  let start: number;
  let end: number;
  if (match[1] === "") {
    const suffix = Number(match[2]);
    if (!suffix) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start > end || start >= size) return null;
  return { start, end };
}

async function serveSeedanceVideo(req: Request, taskId: string): Promise<Response> {
  const filename = `seedance_${taskId}.mp4`;
  const file = videoBucketFile(taskId);

  if (file) {
    let archived = await readArchivedMetadata(file);
    if (!archived) {
      const task = await arkRequest<ArkTask>(`${SEEDANCE_TASKS_URL}/${encodeURIComponent(taskId)}`);
      if (task.status !== "succeeded" || !task.content?.video_url) {
        return NextResponse.json({ status: "error", message: "Wideo nie jest jeszcze gotowe." }, { status: 404 });
      }
      await archiveVideo(file, task.content.video_url, task);
      archived = await readArchivedMetadata(file);
      if (!archived) throw new Error("Nie udało się zarchiwizować wideo.");
    }

    const size = archived.size;
    const range = parseRange(req.headers.get("range"), size);
    const headers: Record<string, string> = {
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    };

    if (range) {
      const stream = file.createReadStream({ start: range.start, end: range.end });
      headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
      headers["Content-Length"] = String(range.end - range.start + 1);
      return new Response(Readable.toWeb(stream) as ReadableStream, { status: 206, headers });
    }

    headers["Content-Length"] = String(size);
    return new Response(Readable.toWeb(file.createReadStream()) as ReadableStream, { status: 200, headers });
  }

  // Brak bucketu — pośredniczenie do linku BytePlus (ważnego 24 h)
  const task = await arkRequest<ArkTask>(`${SEEDANCE_TASKS_URL}/${encodeURIComponent(taskId)}`);
  if (task.status !== "succeeded" || !task.content?.video_url) {
    return NextResponse.json({ status: "error", message: "Wideo nie jest dostępne." }, { status: 404 });
  }
  const upstream = await fetch(task.content.video_url, {
    headers: req.headers.get("range") ? { Range: req.headers.get("range") as string } : {},
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { status: "error", message: `Link do wideo BytePlus jest niedostępny (HTTP ${upstream.status}).` },
      { status: 502 }
    );
  }
  const headers: Record<string, string> = {
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  };
  for (const h of ["content-length", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) headers[h] = v;
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
