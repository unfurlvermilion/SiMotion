import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mdk = searchParams.get("mdk") || "001KR-83X";

  const pcmDatabase: Record<string, any> = {
    "001KR-83X": {
      mdk: "001KR-83X",
      name: "Jedwab & Kaszmir — Płaszcz Camel",
      composition: "90% Wełna Dziewicza, 10% Kaszmir",
      color: "Warm Camel / Champagne Lining",
      packshots_count: 4,
      high_res_urls: [
        "/preview/packshot_front.jpg",
        "/preview/packshot_fabric_close.jpg",
        "/preview/packshot_model_movement.jpg",
      ],
      price_pln: 1290,
      stock_status: "IN_STOCK",
    },
    "002KR-91Y": {
      mdk: "002KR-91Y",
      name: "Koszula Silk Minimalist Ecru",
      composition: "100% Jedwab Morwowy",
      color: "Ecru / Mother of Pearl Buttons",
      packshots_count: 3,
      high_res_urls: ["/preview/shirt_front.jpg", "/preview/shirt_detail.jpg"],
      price_pln: 690,
      stock_status: "IN_STOCK",
    },
  };

  const product = pcmDatabase[mdk] || {
    mdk,
    name: `Produkt ${mdk}`,
    composition: "Tkanina Naturalna Atelier",
    color: "Neutral",
    packshots_count: 1,
    high_res_urls: ["/preview/generic_packshot.jpg"],
    price_pln: 490,
    stock_status: "PENDING_PCM",
  };

  return NextResponse.json({
    status: "success",
    product,
  });
}
