import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, voiceId, apiKey } = body;

    const activeKey = apiKey || process.env.ELEVENLABS_API_KEY;

    // If live API key is provided and not demo, try contacting ElevenLabs
    if (activeKey && !activeKey.includes("mock") && !activeKey.includes("demo")) {
      const targetVoice = voiceId || "21m00Tcm4TlvDq8ikWAM";
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}/with-timestamps`,
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
      } else {
        const errJson = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            status: "error",
            message: `Błąd ElevenLabs API (${response.status}): ${errJson?.detail?.message || response.statusText}`,
          },
          { status: response.status }
        );
      }
    }

    // Default Sandbox / Ready-to-go Response with real audio file and word timestamps
    const sampleWords = (text || "Jedwab i kaszmir. Odkryj nową kolekcję kapsułową SiMotion.").split(" ");
    let currentTime = 0.2;
    const characters: string[] = [];
    const character_start_times_seconds: number[] = [];
    const character_end_times_seconds: number[] = [];

    sampleWords.forEach((word: string) => {
      const wordDuration = 0.35 + word.length * 0.04;
      for (let i = 0; i < word.length; i++) {
        characters.push(word[i]);
        character_start_times_seconds.push(Number((currentTime + (i * wordDuration) / word.length).toFixed(3)));
        character_end_times_seconds.push(Number((currentTime + ((i + 1) * wordDuration) / word.length).toFixed(3)));
      }
      currentTime += wordDuration + 0.12;
    });

    let base64Audio = "";
    try {
      const audioPath = path.join(process.cwd(), "public", "audio", "voiceover_sample.wav");
      if (fs.existsSync(audioPath)) {
        base64Audio = fs.readFileSync(audioPath).toString("base64");
      }
    } catch (e) {}

    return NextResponse.json({
      status: "success",
      source: "sandbox_simulation",
      model: "eleven_multilingual_v2",
      total_duration_seconds: Number(currentTime.toFixed(2)),
      audio_url: "/audio/voiceover_sample.m4a",
      audio_base64: base64Audio,
      alignment: {
        characters,
        character_start_times_seconds,
        character_end_times_seconds,
      },
      message: "Wygenerowano podgląd głosu lektora (gotowy do spięcia z ElevenLabs po podaniu klucza).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Błąd przetwarzania TTS" },
      { status: 500 }
    );
  }
}
