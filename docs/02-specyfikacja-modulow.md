# 02. Specyfikacja Modułów i Przepływów Pracy (8 Zakładek)

Moduły aplikacji **Si Vc** są połączone w jeden spójny pipeline produkcyjny (`Brief + PCM → Generacja → Napisy + logo → Lokalizacja → Akceptacja → Eksport`), ale jednocześnie każdy moduł pozwala na niezależne wejście (np. wgranie gotowego filmu z dysku bezpośrednio do zakładki **Napisy i logo**).

---

## 1. Pulpit (`#vision`)
- **Cel:** Centrum dowodzenia produkcją kreacji wideo i statycznych.
- **Kluczowe elementy:**
  - Baner aktywnego projektu (np. `KR-042 · Try-on nowej kolekcji`) z informacją o wybranym silniku (`Seedance` / `Higgsfield`), liczbie formatów i aktywnych rynkach.
  - Karty KPI: liczba wariantów w projekcie, produkty w kolejce batchowej, aktywne rynki językowe i status synchronizacji z **Microsoft Excel Online**.
  - Szybkie przejścia do wszystkich 6 narzędzi roboczych.
  - Podgląd całego pipeline'u oraz statusu kluczowych integracji (`PCM API`, `Excel Online Graph API`, `Seedance / Higgsfield`, `ElevenLabs`).

---

## 2. Studio TikTok (`#single`)
- **Cel:** Tworzenie pojedynczej kreacji wideo o wysokim zaangażowaniu i rozмноżenie jej na formaty oraz rynki.
- **Przepływ i funkcje:**
  1. **Źródło produktu:** Wpisanie kodu `MDK` (automatyczne pobranie packshotów i zdjęć na modelach z **API PCM**) + możliwość ręcznego dogrania zdjęć z dysku (fallback).
  2. **Silnik i tryb generacji:**
     - Wybór modelu wideo: **Seedance** lub **Higgsfield**.
     - Wybór trybu: **Szybki klip (1 ujęcie 5–10 s)** lub **Wieloscenowy Storyboard (6 scen)**.
  3. **Brief i Storyboard (LLM):**
     - Wpisanie promptu, wybór szablonu scen i czasu trwania (5–30 s).
     - Wygenerowanie przez LLM (Gemini/OpenAI) szkicu briefu oraz 6 scen (`Hook`, `Produkt`, `Detal`, `Ruch`, `Hero shot`, `CTA`).
     - W trybie wieloscenowym każda karta sceny pozwala na edycję promptu, wybór zdjęcia bazowego z PCM oraz przelosowanie tylko tej jednej sceny.
  4. **Formaty i Smart Crop:**
     - Wybór proporcji (`9:16`, `4:5`, `1:1`, własny).
     - Podgląd 3 kadrów obok siebie z suwakiem przesunięcia punktu fokusu (Smart Crop z jednej generacji bazowej) + opcja wymuszenia osobnego renderu dla wybranego formatu.
  5. **Języki, Dubbing (ElevenLabs) i Audio:**
     - Dynamiczny wybór rynków + szybkie presety (`CEE`, `DACH`, `Wszystkie rynki`).
     - Konfiguracja dubbingu TTS (ElevenLabs): wybór głosu (np. *Maja — Naturalny*, *Adam — Dynamiczny*), możliwość wpisania osobnego skryptu lektorskiego lub użycia tekstu napisów, wybór podkładu muzycznego (BGM) z Brand Kitu oraz opcja krzyżowania wersji (`crossDubs`).
  6. **Kalkulator kosztu i przekazanie dalej:**
     - Wyświetlenie estymowanego kosztu API przed uruchomieniem generacji.
     - Przycisk przekazania gotowej kreacji jednym kliknięciem do modułu **Napisy i logo (`#post`)** lub **Lokalizacja (`#local`)**.

---

## 3. Produkcja batchowa (`#batch`)
- **Cel:** Masowe przetwarzanie dziesiątków/setek produktów (`MDK`) w tle na serwerze.
- **Przepływ i funkcje:**
  1. **Wejście danych:** Import listy CSV (kolumna `MDK` lub `model_color` + opcjonalny prompt) lub ręczne wklejenie listy kodów `MDK`.
  2. **Pobieranie zasobów:** Automatyczna walidacja każdego `MDK` względem **API PCM** (z możliwością ręcznego dogrania brakujących packshotów dla wierszy ze statusem `Brak packshotu`).
  3. **Rozróżnienie typów materiału docelowego:**
     - **Karta produktu (E-commerce):** Czyste wideo produktowe (np. produkt w ruchu na neutralnym tle, bez napisów i nakładek marketingowych).
     - **Social media:** Wideo z nałożonym szablonem napisów, animacją logo i nakładką z Brand Kitu.
     - **Karta produktu + Social media:** Wygenerowanie obu wariantów z jednego przebiegu.
  4. **Kolejka serwerowa i kontrola kosztów:**
     - Wybór silnika (**Seedance** / **Higgsfield**) oraz podgląd estymowanego kosztu całej kolejki przed startem.
     - Przetwarzanie w tle na backendzie (użytkownik może zamknąć kartę przeglądarki), z możliwością ponowienia tylko błędnych wierszy.

---

## 4. Napisy i logo / Postprodukcja (`#post`)
- **Cel:** Montaż warstw tekstowych, dynamicznych napisów, animacji logo i nakładek na wideo (wygenerowanym w Studio TikTok lub wgranym z dysku).
- **Przepływ i funkcje:**
  1. **Dwa tryby napisów:**
     - **Dynamiczne słowo po słowie (Styl TikTok / CapCut):** Automatyczna synchronizacja z głosem lektora TTS (word-level timestamps) z wyróżnieniem (podświetleniem/powiększeniem) aktualnie wypowiadanego słowa.
     - **Belki / nagłówki sceniczne z Excel Online:** Wyświetlanie haseł marketingowych w przedziałach czasowych scen (`0–3 s Hook`, `3–7 s Detal`, `7–10 s CTA`) – idealne także dla filmów z samą muzyką bez lektora.
  2. **Logo, Plansza końcowa (Outro) i Nakładki:**
     - Wybór animacji logo (`fade`, `slide`, `pop`, `none`) oraz momentu wyświetlania (`Plansza końcowa / Outro`, `Cały film`, `Intro + Outro`).
     - Przypięcie nakładki graficznej oraz podkładu muzycznego z zakładki **Materiały (Brand Kit)**.
  3. **Synchronizacja tłumaczeń:** Pobranie tekstów z **Microsoft Excel Online** (lub awaryjny import pliku CSV/XLSX) i natychmiastowy podgląd każdego języka na ekranie telefonu.

---

## 5. Materiały / Brand Kit (`#assets`)
- **Cel:** Współdzielona, wersjonowana biblioteka zasobów marki dla całego zespołu.
- **Kategorie zasobów (filtry):**
  - **Nakładki wideo i foto:** Badge (`NEW`, `SALE`), przyciski CTA (`SHOP NOW`), ramki produktowe, naklejki PNG/SVG/WebP.
  - **Logo i Plansze Outro:** Warianty logotypów i gotowe animacje końcowe.
  - **Muzyka (BGM):** Licencjonowane podkłady muzyczne przypisywane do kreacji wideo.
  - **Fonty i Kolory marki:** Czcionki firmowe i predefiniowane palety kolorystyczne używane przez szablony napisów i grafik statycznych.

---

## 6. Grafiki statyczne (`#static`)
- **Cel:** Szybka adaptacja kreacji statycznych (zdjęć produktowych i kampanii) na wszystkie rynki i formaty społecznościowe.
- **Przepływ i funkcje:**
  1. **Źródło obrazu:** Pobranie zdjęcia po kodzie `MDK` z **PCM** lub wgranie własnego zdjęcia z dysku.
  2. **Formaty i układ:** Wybór proporcji (`1:1`, `4:5`, `9:16`), wybór szablonu układu oraz możliwość korekty pozycji tekstu i nakładki z Brand Kitu na płótnie.
  3. **Wersje językowe:** Synchronizacja tekstów (`headline`, `subline`, `CTA`) z **Microsoft Excel Online** (lub import CSV/XLSX) + ręczna edycja per rynek.
  4. **Eksport pojedynczy i masowy:** Pobranie pojedynczego pliku PNG lub **masowy eksport wszystkich języków i formatów (1:1, 4:5, 9:16) jednym kliknięciem do paczki ZIP**.

---

## 7. Lokalizacja (`#local`)
- **Cel:** Zarządzanie tłumaczeniami na żywo z arkuszem tłumaczy, kontrola jakości (długość tekstu, safe area) oraz proces akceptacji rynków.
- **Przepływ i funkcje:**
  1. **Synchronizacja dwukierunkowa z Microsoft Excel Online (SharePoint / OneDrive):**
     - Przycisk **Wygeneruj szkic AI (Gemini/OpenAI)**: automatyczne przetłumaczenie tekstów bazowych (PL/EN) na wybrane rynki i wypchnięcie nowych wierszy do arkusza Excel Online.
     - Przycisk **Synchronizuj z Excel Online ↻**: pobranie najnowszych poprawek wpisanych przez tłumaczy w codziennie aktualizowanym arkuszu (z zachowaniem awaryjnego uploadu pliku `.xlsx`/`.csv`).
  2. **Automatyczna walidacja:** Kontrola przekroczenia maksymalnej liczby znaków dla sceny/outro oraz sprawdzenie bezpiecznych stref (*safe areas*) na formatach `9:16`, `4:5` i `1:1`.
  3. **Statusy akceptacji rynków:** Każdy rynek posiada niezależny status (`Roboczy` → `Do akceptacji` → `Zaakceptowany`) z informacją, kto i kiedy zatwierdził dany język.

---

## 8. Eksport i pliki (`#export`)
- **Cel:** Standaryzacja nazewnictwa, generowanie paczek wynikowych oraz automatyczny zapis w chmurze.
- **Przepływ i funkcje:**
  - **Konwencja nazewnictwa:** `{MDK}_{kreacja}_{format}_{tekst}_{dubbing}_{wersja}.mp4` (oraz analogicznie `.png` dla grafik statycznych).
  - **Struktura folderów ZIP:** `język -> format -> pliki` wraz z plikiem `manifest.csv`.
  - **Zapis chmurowy:** Równoległy eksport gotowych plików do **SharePoint / OneDrive / Cloud Storage**, dzięki czemu `manifest.csv` zawiera bezpośrednie linki `cloud_url` gotowe do użycia w automatyzacjach e-commerce i systemach reklamowych.
