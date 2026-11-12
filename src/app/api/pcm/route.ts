import { NextResponse } from "next/server";

// LPP PCM Production Endpoint (internal network)
const PCM_BASE = (process.env.PCM_BASE_URL || "http://pcm.lppapps.com").replace(/\/$/, "");
const USER_AGENT = "SilkyLook-SiMotion-PCM/1.0";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 1. PCM Image Proxy: streams full-resolution retouched packshots from pcm.lppapps.com
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

  // 2. Listing packshots from PCM for the given MDK
  const rawMdk = searchParams.get("mdk")?.trim() || "";
  if (!rawMdk) {
    return NextResponse.json(
      {
        status: "error",
        message: "Brak parametru MDK artykułu",
        assets: [],
      },
      { status: 400 }
    );
  }

  // Normalize any unicode dashes (en-dash, em-dash, minus) to regular hyphen
  const cleanMdk = rawMdk
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();

  const pcmUrl = `${PCM_BASE}/api/packshots/get/${encodeURIComponent(cleanMdk)}`;

  try {
    const pcmRes = await fetch(pcmUrl, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });

    if (pcmRes.status === 404) {
      return NextResponse.json({
        status: "success",
        mdk: cleanMdk,
        pcmFound: false,
        source: "pcm",
        message: `Brak wyretuszowanych packshotów dla kodu ${cleanMdk} w bazie PCM.`,
        totalAssets: 0,
        assets: [],
        product: {
          mdk: cleanMdk,
          name: `Artykuł ${cleanMdk}`,
          packshots_count: 0,
          high_res_urls: [],
        },
      });
    }

    if (!pcmRes.ok) {
      return NextResponse.json(
        {
          status: "error",
          mdk: cleanMdk,
          message: `PCM (http://pcm.lppapps.com) zwrócił kod HTTP ${pcmRes.status}`,
          assets: [],
        },
        { status: pcmRes.status }
      );
    }

    const paths: string[] = await pcmRes.json();
    if (!Array.isArray(paths)) {
      return NextResponse.json(
        {
          status: "error",
          mdk: cleanMdk,
          message: "PCM zwrócił nieprawidłową odpowiedź (oczekiwano tablicy ścieżek).",
          assets: [],
        },
        { status: 502 }
      );
    }

    // Whitelist only valid /uploads/ paths without path traversal
    const validPaths = paths.filter(
      (p) => typeof p === "string" && p.startsWith("/uploads/") && !p.includes("..")
    );

    const assets = validPaths.map((p, idx) => {
      const filename = p.split("/").pop()?.split("?")[0] || `${cleanMdk}_05${idx}.jpg`;
      const label =
        idx === 0
          ? "050 Przód (Packshot)"
          : idx === 1
          ? "051 Sylwetka / Modelka"
          : idx === 2
          ? "052 Makro Tkanina"
          : idx === 3
          ? "053 Detal / Tył"
          : `Ujęcie PCM ${idx + 1}`;

      return {
        id: `pcm-${idx}`,
        label,
        filename,
        url: `/api/pcm?imageProxy=1&path=${encodeURIComponent(p)}`,
        rawPcmUrl: `${PCM_BASE}${p}`,
        source: "pcm" as const,
        type: idx === 0 ? "packshot_front" : idx === 1 ? "model_full" : idx === 2 ? "detail_fabric" : "packshot_back",
      };
    });

    return NextResponse.json({
      status: "success",
      mdk: cleanMdk,
      pcmFound: true,
      source: "pcm",
      totalAssets: assets.length,
      assets,
      product: {
        mdk: cleanMdk,
        name: `Artykuł Sinsay ${cleanMdk}`,
        packshots_count: assets.length,
        high_res_urls: assets.map((a) => a.url),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        mdk: cleanMdk,
        pcmFound: false,
        message: `Błąd połączenia z PCM (http://pcm.lppapps.com): ${err.message}. Upewnij się, że serwer aplikacji ma dostęp do sieci wewnętrznej LPP.`,
        assets: [],
      },
      { status: 503 }
    );
  }
}
