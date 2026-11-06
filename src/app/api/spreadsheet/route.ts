import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, rows, workbookId } = body;

    if (action === "update_status") {
      return NextResponse.json({
        status: "success",
        updated_rows: rows?.length || 1,
        timestamp: new Date().toISOString(),
        message: "Statusy produkcji zostały pomyślnie zsynchronizowane z arkuszem Excel Online.",
      });
    }

    // Default: fetch rows
    const mockExcelRows = [
      {
        mdk: "001KR-83X",
        name: "Płaszcz Wełniany Camel",
        category: "Outerwear",
        markets: "PL,DE,CZ,RO,HU",
        excel_status: "Zatwierdzony",
        last_modified: "2026-11-06 08:30",
      },
      {
        mdk: "002KR-91Y",
        name: "Koszula Silk Ecru",
        category: "Atelier Silk",
        markets: "PL,DE,RO",
        excel_status: "W trakcie renderu",
        last_modified: "2026-11-06 09:12",
      },
      {
        mdk: "003KR-14A",
        name: "Spodnie Wide Leg Taupe",
        category: "Sartorial",
        markets: "PL,DE",
        excel_status: "Czeka na packshot PCM",
        last_modified: "2026-11-06 09:45",
      },
      {
        mdk: "004KR-55C",
        name: "Sukienka Velvet Burgundy",
        category: "Evening",
        markets: "PL,DE,CZ,RO,HU",
        excel_status: "Szkic AI",
        last_modified: "2026-11-06 10:05",
      },
    ];

    return NextResponse.json({
      status: "success",
      source: "microsoft_graph_api_mock",
      workbook_id: workbookId || "01ABCDEF23456789!9876",
      rows_count: mockExcelRows.length,
      data: mockExcelRows,
      message: "Pobrano najnowsze zlecenia z Microsoft Excel Online.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Błąd synchronizacji z arkuszem" },
      { status: 500 }
    );
  }
}
