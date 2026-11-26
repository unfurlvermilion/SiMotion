import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, voiceId } = body;

    const activeKey = (process.env.ELEVENLABS_API_KEY || "").trim();
    if (!activeKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "Brak klucza ELEVENLABS_API_KEY w konfiguracji serwera.",
        },
        { status: 503 }
      );
    }

    const targetVoice = voiceId || "21m00Tcm4TlvDq8ikWAM";
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(targetVoice)}/with-timestamps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": activeKey,
        },
        body: JSON.stringify({
          text: text || "Jedwab i kaszmir. Odkryj nową kolekcję kapsułową SiMotion.",
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.78,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: "success",
        source: "elevenlabs_live",
        audio_base64: data.audio_base64,
        alignment: data.alignment,
        voice_id: targetVoice,
        model: "eleven_multilingual_v2",
        characters_count: (text || "").length,
      });
    }

    const errJson = await response.json().catch(() => ({}));
    return NextResponse.json(
      {
        status: "error",
        message: `Błąd ElevenLabs API (${response.status}): ${errJson?.detail?.message || response.statusText}`,
      },
      { status: response.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Błąd przetwarzania TTS" },
      { status: 500 }
    );
  }
}
