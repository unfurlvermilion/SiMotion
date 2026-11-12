import { NextResponse } from "next/server";

const PCM_BASE = (process.env.PCM_BASE_URL || "http://pcm.lppapps.com").replace(/\/$/, "");
const PDM_MODEL_BASE = (process.env.PDM_MODEL_URL || "https://pdm.lppsa.com/ecommerce-graphics/model").replace(/\/$/, "");
const USER_AGENT = "SilkyLook-SiMotion-PCM/1.0";

// SVG Placeholder generator to guarantee zero broken images
function createPlaceholderSvg(title: string, sku: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="#1e1a17">
    <rect width="100%" height="100%" fill="#1a1715"/>
    <rect x="10" y="10" width="280" height="380" rx="16" fill="#241f1c" stroke="#3d352e" stroke-width="2"/>
    <path d="M150 120 C130 90 100 90 90 110 L70 170 C65 185 75 200 90 200 L110 200 L110 320 C110 330 120 340 130 340 L170 340 C180 340 190 330 190 320 L190 200 L210 200 C225 200 235 185 230 170 L210 110 C200 90 170 90 150 120 Z" fill="#352e27" stroke="#c84b31" stroke-width="2"/>
    <text x="150" y="270" font-family="sans-serif" font-size="14" font-weight="bold" fill="#f7f3ec" text-anchor="middle">${title}</text>
    <text x="150" y="295" font-family="monospace" font-size="12" fill="#c84b31" font-weight="bold" text-anchor="middle">${sku}</text>
    <text x="150" y="365" font-family="sans-serif" font-size="10" fill="#8e8379" text-anchor="middle">Sinsay Packshot PSH</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 1. PDM Proxy Handler: streams e-commerce model image directly
  const pdmCode = searchParams.get("pdmCode");
  if (pdmCode) {
    try {
      const codeClean = pdmCode.trim().replace(/[\u2010-\u2015\u2212-]/g, "_").toUpperCase();
      const targetUrl = `${PDM_MODEL_BASE}/${codeClean}`;
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
      });
      if (!response.ok) {
        return new NextResponse("Photo not found in PDM", { status: 404 });
      }
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch (err: any) {
      return new NextResponse("Error fetching from PDM: " + err.message, { status: 502 });
    }
  }

  // 2. PCM Image Proxy Handler: streams retouched packshot image safely
  const imageProxy = searchParams.get("imageProxy");
  const imagePath = searchParams.get("path");
  if (imageProxy && imagePath) {
    if (!imagePath.startsWith("/uploads/") || imagePath.includes("..")) {
      return new NextResponse("Forbidden photo path", { status: 403 });
    }
    try {
      const targetUrl = `${PCM_BASE}${imagePath}`;
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!response.ok) {
        return new NextResponse(`PCM image fetch failed (${response.status})`, { status: response.status });
      }
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch (err: any) {
      return new NextResponse("PCM proxy error: " + err.message, { status: 502 });
    }
  }

  // 3. Packshot Listing Handler for MDK
  const rawMdk = searchParams.get("mdk")?.trim() || "";
  if (!rawMdk) {
    return NextResponse.json({
      status: "error",
      message: "Brak parametru MDK",
      assets: [],
    }, { status: 400 });
  }

  // Normalize any unicode dashes (en-dash, em-dash, minus) to regular hyphen
  const cleanMdk = rawMdk
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();

  const assets: Array<{
    id: string;
    label: string;
    filename: string;
    url: string;
    source: "pcm" | "pdm" | "fallback";
    type: string;
  }> = [];

  let pcmFound = false;
  let pcmError = "";

  // A. Attempt connection to PCM internal endpoint (http://pcm.lppapps.com/api/packshots/get/{MDK})
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const pcmUrl = `${PCM_BASE}/api/packshots/get/${encodeURIComponent(cleanMdk)}`;
    const pcmRes = await fetch(pcmUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (pcmRes.ok) {
      const paths: string[] = await pcmRes.json();
      if (Array.isArray(paths)) {
        const validPaths = paths.filter((p) => typeof p === "string" && p.startsWith("/uploads/") && !p.includes(".."));
        if (validPaths.length > 0) {
          pcmFound = true;
          validPaths.forEach((p, idx) => {
            const filename = p.split("/").pop() || `${cleanMdk}_${idx}.jpg`;
            const label = filename.includes("050")
              ? "Packshot Przód (050)"
              : filename.includes("051")
              ? "Sylwetka / Modelka (051)"
              : filename.includes("052")
              ? "Makro Faktura Tkaniny (052)"
              : filename.includes("053")
              ? "Detal / Tył (053)"
              : `Ujęcie ${idx + 1}`;

            assets.push({
              id: `pcm-${idx}`,
              label,
              filename,
              url: `/api/pcm?imageProxy=1&path=${encodeURIComponent(p)}`,
              source: "pcm",
              type: "packshot",
            });
          });
        }
      }
    } else if (pcmRes.status === 404) {
      pcmError = "Brak wyretuszowanych zdjęć w PCM";
    } else {
      pcmError = `PCM zwrócił status HTTP ${pcmRes.status}`;
    }
  } catch (err: any) {
    pcmError = `PCM niedostępny (${err.name === "AbortError" ? "timeout / poza siecią LPP" : err.message})`;
  }

  // B. Fallback to PDM E-Commerce Model Graphics (https://pdm.lppsa.com/ecommerce-graphics/model/{MDK})
  let pdmFound = false;
  try {
    const pdmCodeClean = cleanMdk.replace(/-/g, "_");
    const pdmUrl = `${PDM_MODEL_BASE}/${pdmCodeClean}`;
    const pdmRes = await fetch(pdmUrl, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
    });

    if (pdmRes.ok) {
      pdmFound = true;
      assets.unshift({
        id: "pdm-model-hero",
        label: "Zdjęcie Modelki PDM (E-Commerce)",
        filename: `${cleanMdk}_model.jpg`,
        url: `/api/pcm?pdmCode=${encodeURIComponent(cleanMdk)}`,
        source: "pdm",
        type: "model_full",
      });
    }
  } catch {
    // PDM unavailable
  }

  // C. Fallback SVG cards if neither PCM nor PDM returned photos
  if (assets.length === 0) {
    assets.push(
      {
        id: "placeholder-050",
        label: "Packshot Przód (050)",
        filename: `${cleanMdk}_050.jpg`,
        url: createPlaceholderSvg("Packshot Przód (050)", cleanMdk),
        source: "fallback",
        type: "packshot_front",
      },
      {
        id: "placeholder-051",
        label: "Sylwetka Modelka (051)",
        filename: `${cleanMdk}_051.jpg`,
        url: createPlaceholderSvg("Sylwetka Modelka (051)", cleanMdk),
        source: "fallback",
        type: "model_full",
      },
      {
        id: "placeholder-052",
        label: "Makro Tkanina (052)",
        filename: `${cleanMdk}_052.jpg`,
        url: createPlaceholderSvg("Makro Faktura (052)", cleanMdk),
        source: "fallback",
        type: "detail_fabric",
      }
    );
  }

  return NextResponse.json({
    status: "success",
    mdk: cleanMdk,
    pcmFound,
    pcmError: pcmError || null,
    pdmFound,
    source: pcmFound ? "pcm" : pdmFound ? "pdm" : "fallback",
    totalAssets: assets.length,
    assets,
    product: {
      mdk: cleanMdk,
      name: `Produkt Sinsay ${cleanMdk}`,
      packshots_count: assets.length,
      high_res_urls: assets.map((a) => a.url),
    },
  });
}
