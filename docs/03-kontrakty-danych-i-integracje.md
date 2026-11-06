# 03. Kontrakty Danych i Integracje (PCM, Excel Online, AI API, Manifest)

## 1. Integracja z systemem produktowym PCM

Backend odpytuje wewnętrzne API PCM na podstawie kodu `MDK` (lub `model_color`) i zwraca ustandaryzowany obiekt produktu. Gdy produkt nie istnieje jeszcze w PCM, interfejs pozwala na ręczne dogranie zdjęć z dysku.

### Schemat odpowiedzi `ProductAssetBundle`:
```json
{
  "mdk": "001KR-83X",
  "name": "Sukienka midi z wiskozy",
  "category": "Fashion / Dresses",
  "source": "PCM_API",
  "images": [
    { "id": "img_01", "role": "packshot_front", "url": "https://pcm.internal/assets/001KR-83X_01.jpg" },
    { "id": "img_02", "role": "model_full", "url": "https://pcm.internal/assets/001KR-83X_02.jpg" },
    { "id": "img_03", "role": "detail_fabric", "url": "https://pcm.internal/assets/001KR-83X_03.jpg" }
  ]
}
```

---

## 2. Synchronizacja dwukierunkowa z Microsoft Excel Online (Microsoft Graph API)

Zamiast ręcznego przesyłania plików CSV przy każdej zmianie, aplikacja łączy się przez **Microsoft Graph API** ze wskazanym skoroszytem **Excel Online (SharePoint / OneDrive)**, który jest codziennie aktualizowany przez zespół tłumaczy.

### Struktura tabeli w arkuszu Excel Online (`TranslationsTable`):
| `creative_id` | `mdk` | `scene_key` | `time_range` | `type` | `max_chars` | `pl-PL` | `en-US` | `de-DE` | `cs-CZ` | `ro-RO` | `updated_by` | `status` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `KR-042` | `001KR-83X` | `hero_01` | `0.0-3.0` | `caption_or_vo` | `32` | Nowa kolekcja na Twój sposób | New collection, your way | Neue Kollektion, dein Stil | Nová kolekce po tvém | Noua colecție în stilul tău | AI_Draft | `ready` |
| `KR-042` | `001KR-83X` | `detail_02` | `3.0-7.0` | `caption_or_vo` | `28` | Detal, który robi różnicę | Details that stand out | Details, die begeistern | Detail, který dělá rozdíl | Detaliul care face diferența | anna.k@firma | `approved` |
| `KR-042` | `001KR-83X` | `cta_03` | `7.0-10.0` | `outro_cta` | `22` | Odkryj teraz | Discover now | Jetzt online entdecken | Objevte nyní | Descoperă acum | thomas.m@firma | `review_length` |

### Tryby działania synchronizacji:
1. **Push (Aplikacja → Excel Online):** Po utworzeniu kreacji lub kliknięciu *„Wygeneruj szkic AI”* backend dopisuje klucze scen (`hero_01`, `detail_02`, `cta_03`, skrypt lektora, teksty statyczne `headline`/`subline`) wraz ze wstępnym tłumaczeniem LLM.
2. **Pull (Excel Online → Aplikacja):** Kliknięcie *„Synchronizuj z Excel Online ↻”* (lub webhook/polling) pobiera aktualne komórki, waliduje długość znaków (`max_chars`) i odświeża podgląd wideo oraz grafik statycznych.
3. **Fallback lokalny:** W każdej chwili można wgrać plik `.xlsx` lub `.csv` z dysku, jeśli praca odbywa się offline.

---

## 3. Kontrakt wejściowy CSV dla Produkcji Batchowej (`#batch`)

Plik CSV wgrywany do kolejki masowej obsługuje separator `;` lub `,` oraz kodowanie `UTF-8`:

| Kolumna | Wymagana | Opis | Przykład |
|---|---|---|---|
| `MDK` (lub `model_color`) | **Tak** | Identyfikator produktu w PCM | `001KR-83X` |
| `target_type` | Nie | `both`, `product_card`, `social` (domyślnie z ustawień zadania) | `both` |
| `engine` | Nie | `seedance` lub `higgsfield` | `seedance` |
| `template_id` | Nie | Szablon ruchu/scen | `tryon_6_scenes` |
| `custom_prompt` | Nie | Nadpisanie domyślnego promptu dla danego produktu | `Zbliżenie na fakturę lnu w ruchu` |

---

## 4. Wymienny Adapter Modeli AI (Backend Interfaces)

### 4.1. Generowanie Wideo (`VideoGenerationRequest`)
```json
{
  "provider": "seedance | higgsfield",
  "mode": "single_clip | storyboard_scenes",
  "base_ratio": "9:16",
  "duration_sec": 10,
  "scenes": [
    {
      "scene_index": 1,
      "name": "Hook",
      "duration_sec": 2.0,
      "prompt": "Dynamiczne otwarcie, modelka wchodzi w kadr, jasne studio",
      "source_image_url": "https://pcm.internal/assets/001KR-83X_02.jpg"
    }
  ]
}
```

### 4.2. Generowanie Głosu i Timestampów Słowo po Słowie (`VoiceGenerationRequest`)
Wywołanie ElevenLabs API z endpointem `/v1/text-to-speech/{voice_id}/with-timestamps`, który zwraca zarówno plik audio (`.mp3`/`.wav`), jak i tablicę czasów dla każdego słowa potrzebną do **dynamicznych napisów w stylu TikTok/CapCut**:
```json
{
  "provider": "elevenlabs",
  "lang": "pl-PL",
  "voice_id": "voice_pl_maja",
  "text": "Nowa kolekcja na Twój sposób. Odkryj teraz.",
  "word_timestamps": [
    { "word": "Nowa", "start": 0.12, "end": 0.45 },
    { "word": "kolekcja", "start": 0.46, "end": 0.98 },
    { "word": "na", "start": 0.99, "end": 1.12 },
    { "word": "Twój", "start": 1.13, "end": 1.42 },
    { "word": "sposób.", "start": 1.43, "end": 1.95 }
  ]
}
```

---

## 5. Nazewnictwo Plików i Manifest Eksportu (`#export`)

### 5.1. Wzorzec nazw plików
- **Wideo (MP4):** `{MDK}_{kreacja}_{format}_{tekst}_{dubbing}_{wersja}.mp4`
  - Przykład z lektorem: `001KR-83X_KR-042_9x16_pl-PL_pl-PL_v01.mp4`
  - Przykład bez lektora (tylko muzyka): `001KR-83X_KR-042_4x5_de-DE_nodub_v01.mp4`
- **Grafika statyczna (PNG):** `{MDK}_{kreacja}_{format}_{tekst}_static_{wersja}.png`
  - Przykład: `001KR-83X_KR-042_1x1_cs-CZ_static_v01.png`

### 5.2. Struktura pliku `manifest.csv`
Każda wyeksportowana paczka zawiera plik `manifest.csv` z lokalną ścieżką w archiwum ZIP oraz bezpośrednim linkiem `cloud_url` w SharePoint / OneDrive / S3:

```csv
MDK;creative_id;engine;ratio;text_lang;dub_lang;version;filename;zip_path;cloud_url;approval_status
001KR-83X;KR-042;seedance;9x16;pl-PL;pl-PL;v01;001KR-83X_KR-042_9x16_pl-PL_pl-PL_v01.mp4;pl-PL/9x16/001KR-83X_KR-042_9x16_pl-PL_pl-PL_v01.mp4;https://sharepoint.internal/sites/sivc/exports/KR-042/pl-PL/9x16/001KR-83X_KR-042_9x16_pl-PL_pl-PL_v01.mp4;approved
```
