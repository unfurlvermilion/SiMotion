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

## Wdrożenie na Google Cloud Run

Aplikacja jest budowana jako samodzielny serwer Next.js (`output: "standalone"`) w obrazie z `Dockerfile`. Obraz buduje Cloud Build w GCP, więc lokalnie wystarczy Google Cloud SDK (`gcloud`) — Node.js ani Docker nie są potrzebne.

| Parametr | Wartość |
| --- | --- |
| Projekt GCP | `genai-test-417109` |
| Region | `europe-central2` |
| Usługa Cloud Run | `simotion` |
| Adres | https://simotion-1042226773059.europe-central2.run.app |
| Dostęp | tylko wybrane konta (Identity-Aware Proxy) |
| Seedance (BytePlus ModelArk) | klucz w Secret Manager (`seedance-api-key`), tryb Live wybierany w Ustawieniach API |
| Archiwum wygenerowanych wideo | bucket Cloud Storage `genai-test-417109-simotion-videos` |
| ElevenLabs | tryb symulacji (bez klucza API) |

### Wymagania

- Zainstalowany Google Cloud SDK i zalogowanie: `gcloud auth login`.
- Uprawnienia w projekcie do: Cloud Run, Cloud Build, Artifact Registry, IAP oraz nadawania ról IAM.
- Skonfigurowany ekran zgody OAuth (OAuth consent screen) w projekcie — wymagany przez IAP.

### Komendy (PowerShell, uruchamiane z katalogu projektu)

```powershell
$PROJECT = "genai-test-417109"
$REGION  = "europe-central2"
$SERVICE = "simotion"
# Wybrane konta z dostępem do aplikacji — każde w formacie "user:adres@domena"
$MEMBERS = @(
  "user:<UZUPEŁNIJ>"
)

gcloud config set project $PROJECT

# 1. Włączenie usług
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iap.googleapis.com

# 2. Budowa obrazu w Cloud Build i wdrożenie z włączonym IAP
#    (przy pierwszym wdrożeniu gcloud zapyta o utworzenie repozytorium Artifact Registry — odpowiedz Y)
gcloud run deploy $SERVICE `
  --source . `
  --region $REGION `
  --port 8080 `
  --timeout 180 `
  --no-allow-unauthenticated `
  --iap

# 3. Uprawnienie dla agenta IAP do wywoływania usługi
#    (gcloud 592+ nadaje je automatycznie przy deploy z --iap; komenda jest bezpieczna do ponownego uruchomienia)
$PROJECT_NUMBER = gcloud projects describe $PROJECT --format="value(projectNumber)"
gcloud run services add-iam-policy-binding $SERVICE `
  --region $REGION `
  --member "serviceAccount:service-$PROJECT_NUMBER@gcp-sa-iap.iam.gserviceaccount.com" `
  --role "roles/run.invoker"

# 4. Dostęp dla wybranych kont z listy $MEMBERS
foreach ($MEMBER in $MEMBERS) {
  gcloud iap web add-iam-policy-binding `
    --resource-type cloud-run `
    --service $SERVICE `
    --region $REGION `
    --member $MEMBER `
    --role "roles/iap.httpsResourceAccessor"
}

# 5. Adres aplikacji
gcloud run services describe $SERVICE --region $REGION --format="value(status.url)"
```

Jeśli `gcloud` zgłosi nieznaną flagę `--iap`, zaktualizuj SDK (`gcloud components update`) lub użyj `gcloud beta run deploy` z tymi samymi parametrami.

### Aktualizacja wersji

Kolejne wdrożenia to tylko krok 2 (`gcloud run deploy ...`). Uprawnienia z kroków 3 i 4 pozostają.

### Dodanie lub odebranie dostępu

Nowe konto: krok 4 z jednym adresem w `$MEMBERS`. Odebranie dostępu: ta sama komenda z `remove-iam-policy-binding` zamiast `add-iam-policy-binding`. Dostęp można też nadawać w konsoli GCP: Security → Identity-Aware Proxy → zasób Cloud Run `simotion` → Add principal, rola **IAP-secured Web App User**.

### Seedance (BytePlus ModelArk)

Generowanie wideo korzysta z API BytePlus ModelArk (`ark.ap-southeast.bytepluses.com`). Klucz jest wyłącznie po stronie serwera — przeglądarka nie wysyła ani klucza, ani adresu API. Prawdziwa generacja startuje tylko wtedy, gdy użytkownik wybierze w **Ustawieniach API** tryb **Produkcyjny (Live)** i go zapisze; w trybie testowym działa symulacja bez kosztów. W trybie Live prompt i packshot (jako obraz referencyjny w base64) są wysyłane do BytePlus, czyli poza infrastrukturę LPP.

Przepływ:

1. `POST /api/video` zleca zadanie (`dreamina-seedance-2-5-260628` lub `dreamina-seedance-2-0-260128`, 720p, 9:16, bez dźwięku, packshot jako `reference_image`) i zwraca `jobId = sd_<id zadania>`.
2. `GET /api/video?jobId=…` odpytuje BytePlus. Po zakończeniu kopiuje wideo do bucketu (link BytePlus wygasa po 24 h) i zwraca adres `/api/video?jobId=…&file=1`.
3. `GET /api/video?config=1` — konfiguracja bez sekretów; `GET /api/video?check=1` — test połączenia bez generowania.

Zmienne środowiskowe usługi:

| Zmienna | Znaczenie | Domyślnie |
| --- | --- | --- |
| `SEEDANCE_API_KEY` | klucz BytePlus (z Secret Manager) | — |
| `SIMOTION_VIDEO_BUCKET` | bucket na wygenerowane wideo | — (bez niego wideo jest dostępne 24 h) |
| `SEEDANCE_API_ENDPOINT` | adres zadań ModelArk | `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks` |
| `SEEDANCE_MODEL_ID_25` / `SEEDANCE_MODEL_ID_20` | identyfikatory modeli | `dreamina-seedance-2-5-260628` / `dreamina-seedance-2-0-260128` |
| `SEEDANCE_RESOLUTION` | rozdzielczość | `720p` |
| `SEEDANCE_USD_PER_MTOK_25` / `SEEDANCE_USD_PER_MTOK_20` | stawka USD za 1 mln tokenów z cennika BytePlus — do wyliczenia kosztu po generacji | brak (koszt pokazywany jako liczba tokenów) |

Jednorazowa konfiguracja (PowerShell):

```powershell
$PROJECT = "genai-test-417109"
$REGION  = "europe-central2"
$BUCKET  = "genai-test-417109-simotion-videos"
$SA      = gcloud run services describe simotion --region $REGION --format="value(spec.template.spec.serviceAccountName)"
# Pusta wartość = domyślne konto Compute Engine:
if (-not $SA) { $SA = "$(gcloud projects describe $PROJECT --format='value(projectNumber)')-compute@developer.gserviceaccount.com" }

# 1. Sekret z kluczem tworzy właściciel w konsoli: Security → Secret Manager → Create secret "seedance-api-key"
gcloud secrets add-iam-policy-binding seedance-api-key --member "serviceAccount:$SA" --role "roles/secretmanager.secretAccessor"

# 2. Bucket na wideo (prywatny, w regionie usługi)
gcloud storage buckets create "gs://$BUCKET" --location $REGION --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member "serviceAccount:$SA" --role "roles/storage.objectCreator"
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member "serviceAccount:$SA" --role "roles/storage.objectViewer"

# 3. Wdrożenie z sekretem i bucketem
gcloud run deploy simotion `
  --source . `
  --region $REGION `
  --update-secrets "SEEDANCE_API_KEY=seedance-api-key:latest" `
  --update-env-vars "SIMOTION_VIDEO_BUCKET=$BUCKET"
```

### ElevenLabs (opcjonalnie)

Bez klucza endpoint `/api/tts` działa w trybie symulacji. Klucz podpina się analogicznie: `--update-secrets "ELEVENLABS_API_KEY=<sekret>:latest"` — nigdy w kodzie ani w obrazie.
