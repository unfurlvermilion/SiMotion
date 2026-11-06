# 05. System Wizualny i Architektura UI — Si Vc (Video Creative)

## 1. Kierunek Estetyczny: Bold Creative Studio × Ciepły Luksus (Fashion Atelier)

Interfejs **Si Vc** łączy energię nowoczesnych narzędzi kreatywnych (**Bold Creative Studio** — wyraziste karty, duże nagłówki, miękkie zaokrąglenia, czytelne stany interaktywne w duchu Figmy i Framera) z wyrafinowaną paletą świata mody (**Ciepły luksus / Fashion** — złamana biel, ciepły szampan i piaskowy beż, głęboki antracyt/obsydian oraz akcenty szlachetnej terakoty i głębokiego burgundu).

---

## 2. Układ Przestrzenny: Górna Nawigacja Zakładkowa (100% Szerokości)

Zrezygnowano z bocznego paska (Sidebar) na rzecz **sticky Top Bara** (górnej nawigacji zakładkowej), co uwalnia **100% szerokości okna (`max-width: 1640px`)** dla kluczowych widoków produkcyjnych:
- **3 kadry obok siebie (`9:16`, `4:5`, `1:1`)** w Studio TikTok mieszczą się wygodnie w dużej skali bez ściskania podglądu.
- **Siatka 6-scenowego Storyboardu** prezentuje pełne karty scen z miniaturami PCM, czasami i przyciskami przelosowania.
- **Szerokie tabele Produkcji Batchowej i Lokalizacji Excel Online** wyświetlają wszystkie języki (`PL`, `EN`, `DE`, `CZ`, `RO`), limity znaków i statusy akceptacji bez ucinania tekstu.

### Struktura Górnego Paska (`Top Bar`):
1. **Lewa strefa (Brand + Kontekst projektu):** Sygnet **Si Vc** w odcieniu terakoty/burgundu, nazwa studia oraz aktywna plakietka projektu (`KR-042`).
2. **Centralna strefa (Nawigacja 8 modułów):** Pozioma kapsuła z 8 zakładkami (`Pulpit`, `Studio TikTok`, `Produkcja batchowa`, `Napisy i logo`, `Materiały`, `Grafiki statyczne`, `Lokalizacja`, `Eksport i pliki`), wyposażona w czytelne ikony SVG i wskaźnik aktywnego modułu.
3. **Prawa strefa (Statusy + Przełącznik Motywu):** Wskaźnik synchronizacji `PCM + Excel Online`, przełącznik motywu **Light / Dark** oraz awatar zespołu.

---

## 3. Dwumotywowa Paleta Kolorów (Light & Dark Mode)

Aplikacja wspiera natywnie oba motywy poprzez `<meta name="color-scheme" content="light dark">`, właściwość `color-scheme: light dark` na `:root`, funkcję CSS `light-dark()` oraz fallbacki `@media (prefers-color-scheme: dark)`.

| Token CSS | Motyw Jasny (*Atelier Ivory*) | Motyw Ciemny (*Obsidian Velvet*) | Zastosowanie |
|---|---|---|---|
| `--bg-canvas` | `#FAF7F2` (Ciepła złamana biel) | `#12100E` (Ciepły obsydian / antracyt) | Główne tło aplikacji |
| `--bg-elevated` | `#F2ECE1` (Szampan / ciepły piasek) | `#1A1714` (Głęboki espresso-grafit) | Tła sekcji, scen wideo (`stage`), nagłówki tabel |
| `--bg-card` | `#FFFFFF` (Czysta biel papieru) | `#211D1A` (Ciepły ciemny grafit) | Karty modułów, panele formularzy |
| `--ink-primary` | `#1C1816` (Głęboki antracyt) | `#F7F3EC` (Kość słoniowa) | Nagłówki, główny tekst i wartości KPI |
| `--ink-secondary` | `#6B6059` (Ciepły taupe) | `#B5ABA1` (Piaskowy szary) | Opisy sekcji, etykiety pomocnicze |
| `--border-subtle` | `#E6DDD0` (Szampański obrys) | `#332C27` (Ciemny brązowo-grafitowy) | Obramowania kart, wierszy i pól formularzy |
| `--accent-primary` | `#C84B31` (Szlachetna terakota) | `#E56B4E` (Świetlista terakota) | Główne przyciski CTA, aktywne stany, suwaki |
| `--accent-burgundy` | `#6E1D2F` (Głęboki burgund) | `#9E334A` (Aksamitny burgund) | Wyróżnienia editorialowe, gradienty banerów, badge |
| `--accent-champagne` | `#D8C3A5` (Złoty szampan) | `#4A3F35` (Ciemny szampan) | Tła aktywnych chipów, akcenty dekoracyjne |
| `--status-ok` | `#246A4E` (Butelkowy szmaragd) | `#6CD4A6` (Jasny szmaragd) | Statusy „Zaakceptowany”, „Gotowy”, połączenie API |
| `--status-warn` | `#9E5814` (Ciepły bursztyn) | `#F3B36B` (Złoty bursztyn) | Ostrzeżenia długości znaków i braków packshotów |

---

## 4. Typografia, Zaokrąglenia i Detale Komponentów

- **Skala typograficzna (w jednostkach `rem` + `clamp()`):**
  - **Nagłówki widoków (`h1`):** `clamp(1.85rem, 1.2rem + 2vw, 2.75rem)`, `font-weight: 750`, ciasny kerning (`-0.035em`), `text-wrap: balance`.
  - **Nagłówki kart (`h2`, `h3`):** `1.05rem–1.25rem`, `font-weight: 700`.
  - **Tekst roboczy i formularze:** `0.8125rem–0.9375rem` (`13px–15px` przy bazie `16px`), bezjednostkowy `line-height: 1.55`.
  - **Kody MDK, ścieżki plików i timestampy:** Font monospaced (`JetBrains Mono`, `SFMono-Regular`, `ui-monospace`).
- **Miękka geometria (Bold Studio):**
  - Karty główne: `border-radius: 20px` (z progresywnym `corner-shape: squircle`).
  - Baner projektu i scena podglądu (`stage`): `border-radius: 24px`.
  - Przyciski, pola wejściowe i mini-karty scen: `border-radius: 12px`.
  - Zakładki nawigacji, chipy wyboru i tagi statusów: `border-radius: 999px` (pełne kapsułki).
- **Warstwowa głębia:**
  - Wielowarstwowe, miękkie cienie o ciepłym zabarwieniu oraz subtelny efekt przydymionego szkła (`backdrop-filter: blur(16px)`) na przyklejonym pasku górnym.
