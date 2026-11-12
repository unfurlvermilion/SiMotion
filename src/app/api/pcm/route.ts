import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawMdk = searchParams.get("mdk")?.trim() || "";
  const mdk = rawMdk || "001KR-83X";

  // Predefined sample items if user requests them, otherwise dynamically generate standard LPP packshot structure
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
      assets: [
        { id: "050", label: "Packshot Przód (050)", filename: "001KR-83X_050.jpg", type: "packshot_front" },
        { id: "051", label: "Sylwetka Modelka (051)", filename: "001KR-83X_051.jpg", type: "model_full" },
        { id: "052", label: "Makro Tkanina (052)", filename: "001KR-83X_052.jpg", type: "detail_fabric" },
        { id: "053", label: "Detal Tył (053)", filename: "001KR-83X_053.jpg", type: "packshot_back" },
      ],
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
      assets: [
        { id: "050", label: "Packshot Przód (050)", filename: "002KR-91Y_050.jpg", type: "packshot_front" },
        { id: "051", label: "Sylwetka Modelka (051)", filename: "002KR-91Y_051.jpg", type: "model_full" },
        { id: "052", label: "Makro Tkanina (052)", filename: "002KR-91Y_052.jpg", type: "detail_fabric" },
      ],
    },
  };

  const product = pcmDatabase[mdk] || {
    mdk,
    name: `Artykuł ${mdk}`,
    composition: "Tkanina certyfikowana Sinsay",
    color: "Zgodny z kartą produktu",
    packshots_count: 4,
    high_res_urls: [
      `/pcm/${mdk}_050.jpg`,
      `/pcm/${mdk}_051.jpg`,
      `/pcm/${mdk}_052.jpg`,
      `/pcm/${mdk}_053.jpg`,
    ],
    assets: [
      { id: "050", label: "Packshot Przód (050)", filename: `${mdk}_050.jpg`, type: "packshot_front" },
      { id: "051", label: "Sylwetka Modelka (051)", filename: `${mdk}_051.jpg`, type: "model_full" },
      { id: "052", label: "Makro Tkanina (052)", filename: `${mdk}_052.jpg`, type: "detail_fabric" },
      { id: "053", label: "Detal Tył (053)", filename: `${mdk}_053.jpg`, type: "packshot_back" },
    ],
    price_pln: 99.99,
    stock_status: "IN_STOCK",
  };

  return NextResponse.json({
    status: "success",
    product,
  });
}
