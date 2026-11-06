# Si Vc — Studio Wideo (Faza Planowania)

Projekt planistyczny i prototyp aplikacji webowej **Si Vc (Video Creative)** do generowania, montażu, lokalizacji i eksportu kreacji wideo oraz grafik statycznych (w oparciu o ComfyUI, Seedance i PCM).

## Struktura projektu

- `prototype/index.html` — Interaktywna makieta HTML/CSS/JS z podziałem na 8 widoków roboczych (układ Top Bar 100% szerokości, przełącznik Light/Dark, paleta *Bold Creative Studio × Warm Luxury*).
- `docs/` — Dokumentacja projektowa, architektura, kontrakty danych, roadamapa i system wizualny (`01`–`05`).

## Moduły (Zakładki)

1. **Pulpit (`#vision`)** — Przegląd projektu, statystyki, szybki dostęp do narzędzi, schemat pipeline'u i decyzje architektoniczne.
2. **Studio TikTok (`#single`)** — Tworzenie pojedynczej kreacji z promptu (brief + storyboard 6 scen), wybór formatów (`9:16`, `4:5`, `1:1`) oraz warstw językowych i dubbingu.
3. **Produkcja batchowa (`#batch`)** — Masowe generowanie wideo na podstawie listy `MDK` (import CSV + integracja z PCM).
4. **Napisy i logo (`#post`)** — Postprodukcja: szablony napisów, animacje logo, nakładki z biblioteki i wersje językowe na gotowym wideo.
5. **Materiały (`#assets`)** — Biblioteka nakładek graficznych (badge, CTA, ramki, własne pliki PNG/SVG/WebP) do wideo i grafik.
6. **Grafiki statyczne (`#static`)** — Adaptacja kreacji statycznych na wiele rynków i formatów z eksportem do PNG.
7. **Lokalizacja (`#local`)** — Podmiana tekstów w zatwierdzonej kreacji na podstawie arkuszy tłumaczeń (CSV/XLSX) oraz kontrola długości i safe area.
8. **Eksport i pliki (`#export`)** — Standaryzacja nazewnictwa plików, manifest CSV oraz struktura paczki ZIP (`język -> format`).
