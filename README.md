# Folio — Studio CV

Nowoczesny, zaawansowany generator i edytor CV z polskim i angielskim interfejsem: **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Zustand**, **dnd-kit**, **React PDF**, **PDF.js** oraz **docx**.

Aplikacja działa w **100% lokalnie w przeglądarce**: dane, zdjęcia i szablony przechowywane są w pamięci lokalnej (`localStorage`), eksport PDF i DOCX odbywa się po stronie klienta, a import plików PDF/DOCX nie wymaga żadnych zewnętrznych serwerów, modeli AI ani płatnych kluczy API. Żadna treść dokumentu nie opuszcza Twojego urządzenia.

---

## Główne możliwości

- 🌙 **Tryb jasny i ciemny** w stylistyce „Nordycki spokój” (Fiord / Mgła nocą): przełącznik w nagłówku, zapamiętywanie wyboru i domyślne dopasowanie do ustawień systemu. Motyw interfejsu jest niezależny od kolorów CV i eksportowanych dokumentów.
- 🎯 **Optymalizator ATS**:
  - Interaktywny moduł analizy CV pod kątem systemów Applicant Tracking System (ATS).
  - Wklejanie treści oferty pracy i obliczanie procentowego wskaźnika dopasowania (ATS Score: 0–100%).
  - Analiza słów kluczowych: lista wykrytych oraz brakujących umiejętności i technologii z przyciskiem natychmiastowego dodania (`+`) do Twojego CV.
  - Weryfikacja metryk i mierzalnych osiągnięć w opisach stanowisk i projektów.
  - Lista kontrolna dobrych praktyk ATS (układ jednokolumnowy, czytelność nagłówków, czcionki, marginesy).
  - Szybki eksport 1-kliknięciem w wariancie dedykowanym dla ATS (zarówno wektorowy PDF, jak i DOCX).
- 🖱️ **Bezpośrednia edycja z podglądu (Click-to-edit)**:
  - Kliknij dowolny element w oknie podglądu (imię, dane kontaktowe, zdjęcie, nagłówek sekcji czy konkretne stanowisko w historii pracy), aby natychmiast otworzyć jego dedykowany formularz w lewym panelu edytora.
  - Wyraźne podświetlenie edytowanego elementu i szybki powrót („Wróć do listy” / klawisz Escape).
- 🎨 **115 profesjonalnych szablonów i Style w 1 kliknięcie**:
  - Kolekcja **Wyróżnione** (15 szablonów) z nowymi możliwościami renderera: kolumna boczna od krawędzi do krawędzi strony lub oddzielona tylko linią, nagłówek „hero” na całą szerokość, tytuły sekcji numerowane (01, 02…) lub umieszczone na marginesie, dwukolorowe imię i nazwisko, oś czasu z węzłami oraz nowe dekoracje.
  - Galeria pokazuje prawdziwe miniatury pierwszej strony (`npm run thumbnails` po zmianie szablonów lub renderera).
  - Pozostałe szablony podzielone na 7 kategorii: **Minimalistyczne**, **Klasyczne**, **Biznesowe**, **Kreatywne**, **Eleganckie**, **Techniczne** i **Artystyczne**, a także kategoria **Moje** na własne kompozycje.
  - Filtry szablonów według układu kolumn, obecności zdjęcia czy stylu oraz zintegrowana wyszukiwarka.
  - „Styl w 1 kliknięcie” (Design Presets): 12 kompletnych palet zmieniających jednocześnie tło strony i kolumny, tekst, akcenty, separatory oraz ramkę zdjęcia. Każdy ze 100 szablonów ma domyślnie włączone zdjęcie.
  - Możliwość zapisu, duplikowania, edycji oraz eksportu/importu własnych kompozycji szablonów.
- 📥 **Lokalny import PDF i DOCX**:
  - Zaawansowany parser działający po stronie klienta (PDF.js + JSZip) obsługujący pliki do 15 MB.
  - Rozpoznawanie sekcji, danych kontaktowych, dat, wielopoziomowych punktów, technologii, linków (w tym profili LinkedIn/GitHub) i zainteresowań.
  - Okno podglądu rozpoznanych danych przed ich zastosowaniem, opcja zachowania obecnego zdjęcia oraz pełna możliwość cofnięcia operacji (Undo).
- 🖼️ **Zaawansowany edytor zdjęcia**:
  - Obsługa formatów JPG, PNG i WebP (do 10 MB / 40 MP).
  - Kadrowanie przez przeciąganie zdjęcia myszką lub palcem (oraz strzałkami), powiększanie kółkiem myszy lub suwakiem i oddalanie, by zmieścić całą sylwetkę.
  - Kadr ma proporcje ramki z CV (koło/kwadrat 1:1, portret 3:4), a zapisane zdjęcie można w każdej chwili wykadrować ponownie przyciskiem „Kadruj”.
  - Kształty ramki: koło, zaokrąglony prostokąt, kwadrat, portret, a także regulacja obramowania i rozmiaru w mm.
  - Automatyczne skalowanie po stronie klienta do 512 × 512 px w celu optymalizacji pamięci.
- 🌐 **Wielojęzyczność (i18n)**:
  - Przełącznik języka interfejsu (PL / EN).
  - Niezależne ustawienie języka dokumentu CV („Język CV”), które automatycznie dostosowuje standardowe etykiety sekcji oraz formatowanie dat bez naruszania wpisanej treści.
- 🔤 **9 lokalnych rodzin fontów**:
  - Inter, Lora, Roboto, Montserrat, Playfair Display, Source Sans 3, Oswald, Cormorant Garamond oraz Caveat.
  - Pełne wsparcie dla polskich znaków diakrytycznych, fonty serwowane w całości lokalnie (licencja SIL OFL).
- 📄 **Podwójny silnik eksportu**:
  - **PDF (A4)**: wektorowy, generowany w Web Workerze bez blokowania interfejsu. Rzeczywisty podział stron. Domyślnie włączone „Przenoś całe sekcje” przenosi sekcje mieszczące się na jednej stronie w całości, także w kolumnach; dłuższe sekcje dzielą się bez utraty treści. Ustawienie zachowuje się przy zmianie szablonu. Nagłówki pozostają z początkiem treści, a tekst można zaznaczać na każdej stronie.
  - **DOCX (Word)**: natywne style, tabele kolumn, hiperłącza, listy wypunktowane i osadzone czcionki TTF, z opcją formatu jednokolumnowego ATS. Przenoszenie sekcji korzysta z natywnego łączenia akapitów w Wordzie.
- 🔗 **Linki**: wklejony adres jest czyszczony z białych znaków i parametrów śledzących (`utm_…`, `trk`…), profile typu LinkedIn/GitHub dostają nazwę automatycznie, a w PDF zbyt długie adresy są skracane do szerokości kolumny (pełny adres pozostaje klikalny).
- ❤️ **Sekcja Zainteresowania / Hobby**: zwarta lista lub wpisy z krótkim opisem; starsze projekty dostają ją automatycznie.
- 💾 **Kopia zapasowa i historia**:
  - Eksport i import całych projektów do formatu JSON z rygorystyczną walidacją Zod.
  - Pełna historia operacji Undo/Redo (do 40 stanów) dostępna z przycisków w nagłówku oraz skrótów klawiszowych (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z).

---

## Wymagania i instalacja

Wymagany **Node.js 20+** (zalecany Node.js 22.12+ lub 24 LTS).

```sh
# Instalacja zależności
npm install
# lub: pnpm install --frozen-lockfile

# Uruchomienie serwera deweloperskiego
npm run dev
# lub: pnpm dev
```

Aplikacja będzie dostępna pod adresem: **http://127.0.0.1:5173**.

---

## Polecenia i skrypty

| Polecenie | Opis |
| :--- | :--- |
| `npm run dev` | Uruchomienie lokalnego serwera deweloperskiego Vite |
| `npm test` | Uruchomienie zestawu testów Vitest (PDF, DOCX, ATS, parser, i18n, design) |
| `npm run thumbnails` | Renderuje miniatury wszystkich szablonów do `public/thumbnails/` (test pilnuje, by żadnej nie brakowało) |
| `npm run build` | Ścisła kontrola TypeScript (`tsc -b`), budowa aplikacji klienta i serwera produkcyjnego |
| `npm run preview` | Podgląd zbudowanej aplikacji klienckiej przez Vite |
| `npm start` | Uruchomienie zoptymalizowanego, lokalnego serwera produkcyjnego (`node dist-server/index.mjs`) |

Zmienne środowiskowe `HOST` (domyślnie `127.0.0.1`) i `PORT` (domyślnie `4173`) sterują parametrami lokalnego serwera. Przykładową konfigurację zawiera plik `.env.example`.

---

## Architektura projektu

```text
src/
├── types/resume.ts             # Silne typy TypeScript i schematy walidacyjne Zod
├── data/
│   ├── sampleResume.ts         # Realistyczne, przykładowe dane początkowe CV
│   ├── presets.ts              # 100 wbudowanych szablonów dokumentu
│   ├── designPresets.ts        # Presety typograficzne i kolorystyczne (Style w 1 kliknięcie)
│   └── templateCategories.ts   # Kategoryzacja i filtrowanie szablonów
├── store/
│   ├── useResumeStore.ts       # Główny magazyn stanu Zustand z persist i historią (Undo/Redo)
│   └── useLocaleStore.ts       # Stan języka interfejsu aplikacji (PL / EN)
├── components/
│   ├── ImportCvDialog.tsx      # Modal importu dokumentów PDF i DOCX
│   ├── ExportDialog.tsx        # Modal wyboru formatu eksportu (PDF, DOCX, JSON)
│   ├── editor/
│   │   ├── AtsOptimizer.tsx    # Skaner zgodności z ATS, analiza słów kluczowych i eksport ATS
│   │   ├── SelectedElementEditor.tsx # Kontekstowy edytor wybranego na podglądzie elementu
│   │   ├── DataEditor.tsx      # Formularze edycji sekcji i danych osobowych
│   │   ├── ThemeEditor.tsx     # Konfiguracja kolorów, typografii, geometrii i układu
│   │   ├── TemplateManager.tsx # Przeglądarka 100 szablonów i zarządzanie własnymi motywami
│   │   ├── PhotoEditor.tsx     # Kadrowanie, powiększanie i dopasowanie zdjęcia
│   │   └── SectionList.tsx     # Zarządzanie sekcjami i przeciąganie dnd-kit
│   └── preview/
│       ├── ResumeDocument.tsx  # Wektorowy renderer dokumentu w React PDF
│       ├── ResumePreview.tsx   # Interaktywny podgląd PDF.js z warstwą tekstu i detekcją kliknięć
│       └── fonts.ts            # Rejestracja rodzin fontów TTF
├── services/
│   ├── cvParser.ts             # Parser plików PDF i DOCX oparty na lokalnych regułach
│   ├── renderResume.tsx        # Zunifikowany potok renderowania i pomiaru sekcji
│   ├── exportPdf.ts            # Klient Web Workera i generowanie plików PDF
│   ├── pdf.worker.ts           # Web Worker renderowania wektorowego
│   ├── exportDocx.ts           # Generator natywnego formatu Word (.docx) z osadzonymi czcionkami
│   └── projectJson.ts          # Eksport i bezpieczny import plików JSON
├── lib/
│   ├── i18n.ts & english.json  # Tłumaczenia interfejsu (PL / EN)
│   ├── cvLanguage.ts           # Tłumaczenia i formatowanie nagłówków samego CV
│   ├── previewTargets.ts       # Adapter mapowania współrzędnych PDF na elementy edytora
│   ├── sectionIcons.ts         # Zestaw wektorowych ikon dla sekcji i kontaktów
│   ├── photo.ts                # Narzędzia przetwarzania grafiki na Canvas
│   └── format.ts               # Pomocnicze funkcje formatowania dat, tekstu i jednostek mm/pt
└── __tests__/                  # Testy jednostkowe i integracyjne (ATS, parser, PDF, DOCX, motywy)
server/
└── index.ts                    # Lekki serwer HTTP do hostowania wersji produkcyjnej
public/fonts/                   # Lokalne pliki TrueType (.ttf) i licencje SIL Open Font License
scripts/
├── build-server.mjs            # Kompilator serwera produkcyjnego do dist-server/
├── export-smoke.mjs            # Skrypt testowy generujący próbki wszystkich szablonów
└── prepare_fonts.py            # Opcjonalny skrypt przygotowania fontów
```

---

## Bezpieczeństwo i prywatność

1. **Praca offline**: Aplikacja nie wykonuje żadnych zewnętrznych zapytań sieciowych w trakcie pracy. Wszystkie fonty, biblioteki i skrypty serwowane są lokalnie.
2. **Prywatność danych**: Wprowadzane dane osobowe, zdjęcia oraz załączane pliki PDF/DOCX są przetwarzane wyłącznie w pamięci przeglądarki i zapisywane w lokalnym magazynie `localStorage` użytkownika.
3. **Brak telemetrii**: Kod nie zawiera żadnych skryptów śledzących, analityki ani modułów wysyłających zdarzenia.
4. **Zgodność z CSP**: Aplikacja nie wymaga zewnętrznych połączeń CDN. Do poprawnego działania wymaga jedynie uprawnień dla lokalnych Web Workerów oraz `blob:` dla silnika PDF.js.

---

## Licencja

Projekt jest udostępniony na licencji MIT. Użyte kroje pisma podlegają licencji [SIL Open Font License (OFL)](https://scripts.sil.org/OFL).
