# SiMotion (Sinsay Motion Studio) — Instrukcja Obsługi

**Dla kogo:** AI Artists, Graphic Designers, Motion & Social Media Team (LPP / Sinsay)  
**Adres aplikacji:** `https://simotion-1042226773059.europe-central2.run.app` (logowanie kontem Google z dostępem IAP)

---

## 0. Zanim zaczniesz — 3 złote zasady

1. **„Produkt jest święty”**: Krój, kolor, print i faktura ubrania z packshotu (PSH) muszą pozostać w 100% wierne. W promptach i przy kadrowaniu nie zmieniamy produktu — generujemy tło, ruch, modelkę i światło.
2. **Tryb Testowy (Sandbox) vs Produkcyjny (Live)**:
   - Domyślnie przed szkoleniem i testami upewnij się w **Ustawieniach API** (ikona ⚙️ w prawym górnym rogu), w jakim trybie pracujesz.
   - **Testowy (Sandbox):** nic nie kosztuje, używa wideo próbnego i symulacji — idealny do nauki i układania napisów.
   - **Produkcyjny (Live):** wysyła płatne zlecenia do **BytePlus Seedance 2.5** (każde wygenerowane wideo zapisuje się automatycznie w Google Cloud Storage).
3. **Sieć LPP / PCM:** Automatyczne pobieranie zdjęć po kodzie MDK (`Pobierz z PCM ↻`) łączy się z firmową bazą `http://pcm.lppapps.com`. Jeśli pracujesz spoza sieci LPP i PCM nie odpowiada, wrzuć packshoty ręcznie przyciskiem **`📁 Z dysku`**.

---

## 1. Nawigacja — co gdzie jest?

W górnym pasku masz 6 głównych modułów + ustawienia po prawej:

| Zakładka | Do czego służy |
| :--- | :--- |
| **Studio Wideo** | Główny warsztat: generowanie 1 klipu AI z packshotu **albo** montaż i napisy na własnym wideo + eksport 4 formatów naraz. |
| **Batch** | Produkcja masowa z listy kodów MDK / pliku CSV (kolejka wielu produktów naraz + zbiorczy ZIP). |
| **Grafiki** | Szybkie grafiki statyczne (1:1, 4:5, 9:16, 3:4) z maskowaniem starych tekstów i tłumaczeniami na 28 rynków. |
| **Materiały** | Firmowy Brand Kit: badge (np. `NEW AW26`), przyciski CTA, ramki, sygnety i animowane logo outro Sinsay. |
| **Tłumaczenia** | Tabela wielojęzyczna do zarządzania tekstami kampanii, sprawdzania długości znaków i eksportu do Excela (`.xlsx`). |
| **Eksport** | Pakowanie gotowej paczki kampanii w ustandaryzowane foldery (`MDK/Format/Język` lub `Język/Format/MDK`) + manifest CSV/JSON. |
| **⚙️ (Ustawienia API)** | Przełącznik **Sandbox / Live**, podgląd statusu klucza Seedance na serwerze, konfiguracja ElevenLabs i test połączeń. |

---

## 2. Scenariusz A: Tworzenie nowej rolki wideo AI z kodu MDK (Studio Wideo)

1. Wejdź w **Studio Wideo** i wybierz tryb **Generuj wideo AI**.
2. W polu **Kod MDK (artykuł LPP)** wpisz kod produktu (np. `001KR-83X`) i kliknij **`Pobierz z PCM ↻`**.
   - Apka pobierze dostępne kąty (050 przód, 051 modelka, 052 detal tkaniny) i automatycznie podepnie je do scen storyboardu.
   - *Alternatywnie:* kliknij **`📁 Z dysku`** i wskaż packshoty z komputera.
3. Wybierz **Silnik wideo** (np. `Seedance 2.5`), **Długość** i **Tryb** (`Storyboard` lub `Pojedyncze ujęcie`).
4. Wpisz lub wygeneruj **Prompt AI** (zawsze po angielsku — możesz skorzystać z gotowych presetów kategorii ubrania).
5. Zaznacz docelowe formaty pod podglądem: **3:4 Master**, **9:16 TikTok**, **4:5 Feed**, **1:1 Kwadrat**.
   - Suwakiem **Fokus kadru** ustaw przesunięcie poziome (Smart Crop), żeby modelka zawsze była w centrum kadru na węższym `9:16`.
   - Włącz **Strefy ochronne**, aby widzieć, gdzie TikTok/Reels zasłania ekran interfejsem (przyciski po prawej, opis na dole).
6. Kliknij **`⚡ Generuj wideo AI`**.
   - W trybie **Live** system wyśle zadanie do BytePlus Seedance 2.5 i poczeka na render (może to potrwać kilka minut), a gotowy klip trafi od razu do odtwarzacza.

---

## 3. Scenariusz B: Mam gotowe wideo — chcę dodać napisy na wiele rynków i przyciąć formaty

1. W **Studio Wideo** przełącz tryb na **Montaż własnego wideo** i wgraj plik `.mp4` / `.mov` z dysku.
2. Włącz sekcję **Napisy i tłumaczenia**:
   - **Wybierz rynki** (np. `PL`, `ENG`, `DE`, `RO`, `CZ` lub paczkę CEE).
   - **Tryb napisów**:
     - **Oś czasu (`timeline`)** — różne teksty pojawiające się w konkretnych sekundach (np. Hook 0–2.5s, Detal 2.5–5.5s, CTA 8–10s).
     - **Stały (`static`)** — jedno stałe hasło wyświetlane przez cały film.
   - Skorzystaj z **Asystenta haseł Sinsay** (baza **4524 oficjalnych haseł** przetłumaczonych na 28 rynków — zero ryzyka literówek w językach lokalnych!).
3. Dopasuj wygląd napisów: pozycja pionowa `Y%`, czcionka (`Euclid Circular B`), styl (`Pill`, `TikTok Neon`, `Cień`, `Czysty`).
4. Włącz lub wyłącz **Animowane Logo Outro Sinsay** (białe lub czarne, z oficjalnego Brand Kitu).
5. Kliknij **`💾 Pobierz paczkę ZIP`**:
   - Przeglądarka automatycznie wykadruje wideo na **każdy zaznaczony format** (`3:4`, `9:16`, `4:5`, `1:1`), wypali napisy per język, dorzuci pliki `.srt` / `.vtt` i spakuje wszystko w gotowe foldery:
     - `00_Czyste_Bez_Napisow/`
     - `01_Wersje_Rynkowe_Z_Napisami/<RYNEK>/`
     - `02_Napisy_SRT_VTT/`

> **Wskazówka:** Jeśli na komputerze używasz **DaVinci Resolve**, w widoku postprodukcji możesz pobrać gotową oś czasu klikając **`🎬 DaVinci FCPXML`**.

---

## 4. Scenariusz C: Produkcja masowa wielu produktów (Batch)

1. Przejdź do zakładki **Batch**.
2. Wgraj plik **CSV** z listą kodów MDK (lub dodaj pozycje ręcznie / z próbnego zestawu).
3. Kliknij **`▶ Uruchom Batch`**.
   - System przetwarza kolejno każdy kod MDK przez `/api/video` (w trybie Live każdy produkt wysyła płatne zlecenie do BytePlus, postęp i koszt zapisują się w logu na bieżąco).
4. Po zakończeniu kliknij **`💾 Pobierz Batch ZIP`**, aby pobrać foldery dla wszystkich MDK wraz z wideo, napisami `.srt` i raportem `batch_summary.csv`.

---

## 5. Scenariusz D: Grafiki statyczne na 28 rynków

1. Wejdź w **Grafiki**.
2. Wgraj zdjęcie bazowe z dysku.
3. Wybierz format docelowy (`1:1`, `4:5`, `9:16`, `3:4` lub `Oryginał`).
4. Jeśli na zdjęciu był stary napis w innym języku, użyj sekcji **Maskowanie starego napisu** (blur / gradient / jednolita belka).
5. Wybierz hasło z **Asystenta haseł Sinsay** lub wpisz własne, zaznacz kraje i kliknij **`💾 Pobierz paczkę ZIP`** — dostaniesz gotowe pliki `.png` wyrenderowane z fontem `Euclid Circular B` dla każdego kraju.

---

## 6. Najczęstsze pytania (FAQ)

- **Dlaczego `Pobierz z PCM` nie znajduje zdjęć?**  
  Sprawdź, czy kod MDK nie ma literówki i czy serwer działa w sieci LPP. Jeśli pracujesz zdalnie bez dostępu do `pcm.lppapps.com`, użyj przycisku `📁 Z dysku`.
- **Dlaczego eksport ZIP dla 4 formatów × 5 języków trwa kilkanaście/kilkadziesiąt sekund?**  
  Przeglądarka klatka po klatce renderuje i przycina każde wideo osobno do `1440×1920`, `1080×1920`, `1080×1350` i `1080×1080`. Jeśli potrzebujesz tylko rolek, odznacz pozostałe formaty przed kliknięciem eksportu.
- **Czy lektor ElevenLabs jest już aktywny?**  
  Na ten moment ElevenLabs działa w trybie podglądu/symulacji (bez podpiętego płatnego klucza API).
