import { NextResponse } from "next/server";

export interface ExcelRow {
  mdk: string;
  name: string;
  category: string;
  markets: string[];
  formats: string[];
  status: "queued" | "rendering" | "completed" | "error";
  pcmStatus: "ready" | "missing_media";
  videoUrl?: string;
  lastUpdated: string;
}

// In-memory state on the server so updates persist between sync calls during server lifetime
let excelDatabase: ExcelRow[] = [
  {
    mdk: "001KR-83X",
    name: "Jedwab & Kaszmir — Płaszcz Camel",
    category: "Outerwear / Premium",
    markets: ["PL", "DE", "CZ", "RO", "HU"],
    formats: ["9:16", "4:5", "1:1"],
    status: "completed",
    pcmStatus: "ready",
    videoUrl: "https://si-motion.vercel.app/preview/001KR-83X_master.mp4",
    lastUpdated: new Date().toLocaleTimeString("pl-PL"),
  },
  {
    mdk: "002KR-91Y",
    name: "Koszula Silk Minimalist Ecru",
    category: "Shirts / Atelier",
    markets: ["PL", "DE", "RO"],
    formats: ["9:16", "4:5"],
    status: "rendering",
    pcmStatus: "ready",
    lastUpdated: new Date().toLocaleTimeString("pl-PL"),
  },
  {
    mdk: "003KR-14A",
    name: "Spodnie Wide Leg Wool Taupe",
    category: "Pants / Sartorial",
    markets: ["PL", "DE", "CZ"],
    formats: ["9:16", "1:1"],
    status: "queued",
    pcmStatus: "missing_media",
    lastUpdated: new Date().toLocaleTimeString("pl-PL"),
  },
  {
    mdk: "004KR-55C",
    name: "Sukienka Maxi Velvet Burgundy",
    category: "Dresses / Evening",
    markets: ["PL", "DE", "CZ", "RO", "HU"],
    formats: ["9:16", "4:5", "1:1"],
    status: "queued",
    pcmStatus: "ready",
    lastUpdated: new Date().toLocaleTimeString("pl-PL"),
  },
];

const SINSAY_SHAREPOINT_DEFAULT =
  "https://lppsa.sharepoint.com/:x:/s/MEDIAPLANYSinsay/IQARpS_SW7lDSb2wNp3zaIgPATUAtU7X3qUNksY7p-aRCWM?e=OF5v7Y&nav=MTVfe0VBQTEzQzQ2LUU4QjItNEVCMy04RjcxLTIyOTFBOUQxQUY1QX0";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sharepointUrl = searchParams.get("url");

  return NextResponse.json({
    status: "success",
    filename: "Sinsay_TRANSLATIONS.xlsx",
    organization: "LPP SA / MEDIAPLANY Sinsay",
    source: "sharepoint_lppsa_excel",
    sharepointUrl: sharepointUrl || SINSAY_SHAREPOINT_DEFAULT,
    totalRows: excelDatabase.length,
    rows: excelDatabase,
    syncedAt: new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString("pl-PL"),
    message: "Połączono ze skoroszytem Sinsay_TRANSLATIONS.xlsx na SharePoint LPP SA.",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, mdk, newStatus, videoUrl, newRow, sharepointUrl } = body;

    // 1. Updating status of an existing row from SiMotion -> Excel Online
    if (action === "update_status" && mdk) {
      excelDatabase = excelDatabase.map((row) => {
        if (row.mdk.toUpperCase() === mdk.toUpperCase()) {
          return {
            ...row,
            status: newStatus || row.status,
            videoUrl: videoUrl || row.videoUrl,
            lastUpdated: new Date().toLocaleTimeString("pl-PL"),
          };
        }
        return row;
      });

      return NextResponse.json({
        status: "success",
        action: "update_status",
        mdk,
        updatedAt: new Date().toLocaleTimeString("pl-PL"),
        message: `Zaktualizowano status wiersza ${mdk} w arkuszu Excel Online na: ${newStatus}`,
      });
    }

    // 2. Appending new product row from Excel Online into SiMotion
    if (action === "add_row" && newRow) {
      const addedRow: ExcelRow = {
        mdk: newRow.mdk || `MDK-${Date.now().toString().slice(-4)}`,
        name: newRow.name || "Nowy produkt z Excela",
        category: newRow.category || "Kolekcja Kapsułowa",
        markets: Array.isArray(newRow.markets) ? newRow.markets : ["PL", "DE"],
        formats: Array.isArray(newRow.formats) ? newRow.formats : ["9:16", "4:5"],
        status: "queued",
        pcmStatus: newRow.pcmStatus || "ready",
        lastUpdated: new Date().toLocaleTimeString("pl-PL"),
      };
      excelDatabase.push(addedRow);

      return NextResponse.json({
        status: "success",
        action: "add_row",
        addedRow,
        totalRows: excelDatabase.length,
        message: `Dodano pozycję ${addedRow.mdk} do bazy Excel Online.`,
      });
    }

    // 3. Fallback: return full dataset
    return NextResponse.json({
      status: "success",
      source: "excel_online_sync",
      sharepointUrl: sharepointUrl || "https://company.sharepoint.com/teams/FashionAtelier/Shared%20Documents/Kolekcja_FW26_Statusy.xlsx",
      totalRows: excelDatabase.length,
      rows: excelDatabase,
      syncedAt: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString("pl-PL"),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Błąd operacji na arkuszu Excel Online" },
      { status: 500 }
    );
  }
}
