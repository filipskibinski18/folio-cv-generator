# Folio — Studio CV

Kompletny generator CV w języku polskim: React 19, TypeScript, Vite, Tailwind CSS, Zustand, dnd-kit, React PDF oraz docx. Wszystkie dane i szablony są zapisywane lokalnie. Eksport odbywa się w przeglądarce, bez wysyłania CV na serwer.

## Uruchomienie

Wymagany Node.js 22.12+ lub 24 LTS. Projekt zawiera `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Alternatywnie, z npm:

```sh
npm install
npm run dev
```

Otwórz http://127.0.0.1:5173. Aplikacja od razu pokazuje realistyczne, wypełnione CV.

```sh
pnpm test          # walidacja, historia, szablony, struktura DOCX, fonty i paginacja PDF
pnpm build         # ścisła kontrola TypeScript + produkcyjny build
pnpm preview       # podgląd produkcyjnego buildu
```

Nie jest wymagany backend, konto, klucz API ani płatna usługa. Gotowy katalog `dist/` można udostępnić na hostingu plików statycznych przez HTTP/HTTPS. Przy publikacji w podkatalogu ustaw `base` w `vite.config.ts` przed kompilacją. Fonty PDF/DOCX uwzględniają ten prefiks. Otwieranie `index.html` przez `file://` nie obsługuje modułów i workerów.

## Korzystanie

- **Treść**: edycja danych kontaktowych, podsumowania, doświadczenia, edukacji, kategorii umiejętności i poziomów, projektów, certyfikatów, języków, linków i klauzuli. W doświadczeniu i projektach dostępne są punkty i podpunkty, maksymalnie cztery poziomy. `**tekst**` oznacza pogrubienie w opisie i punktach.
- **Wygląd**: dwa niezależne fonty, rozmiary tekstu/nagłówków/nazwiska, interlinia, tracking, sześć kolorów, cztery marginesy w mm, odstępy, padding, zaokrąglenia i separatory.
- **Układ**: jedna kolumna, lewa lub prawa belka o szerokości 25–45%, Modern Grid oraz listy, tagi lub poziomy umiejętności. Rozwiń sekcję, aby zmienić jej nagłówek i przypisać kolumnę. Widoczność zmienia ikona oka.
- **Przeciąganie**: użyj uchwytu obok sekcji. Klawiaturą: ustaw fokus na uchwycie, naciśnij spację, użyj strzałek i zatwierdź spacją. Kolejność obowiązuje wewnątrz przypisanej kolumny; w jednym słupku jest globalna. Klauzula jako ostatnia sekcja główna zajmuje pełną szerokość pod kolumnami. Po jej przeniesieniu obowiązuje nowa pozycja.
- **Szablony**: Modern (dwukolumnowy), Executive (szeryfowy, klasyczny), Creative (prawa kolumna i kolorowe tagi). Zapis własnego szablonu przechowuje motyw i ustawienia sekcji. Można go załadować, sklonować, zmienić nazwę/zapisać nowy wygląd, usunąć i wyeksportować do JSON. Dane osoby nie są częścią szablonu.
- **JSON**: „Eksportuj CV → Kopia projektu” zapisuje wszystkie dane i motyw. „Importuj JSON” rozpoznaje projekt lub szablon, sprawdza wersję 1, strukturę, dopuszczalne parametry oraz limit 2 MB. Błędny import nie nadpisuje dokumentu.
- **Cofanie**: przyciski w nagłówku; poza polem tekstowym także Ctrl/Cmd+Z i Ctrl/Cmd+Shift+Z. Do 40 stanów danych/motywu. Historia pozostaje w pamięci bieżącej sesji. Wpisywanie w polu obsługuje również natywne cofanie przeglądarki.
- **Telefon**: przełącznik „Podgląd / Edytor” zachowuje dostęp do wszystkich paneli. Podgląd można powiększać i dopasowywać do dostępnej szerokości.

## Eksport i zgodność

### PDF

`ResumeDocument` jest jedynym rendererem dokumentu. Pracuje w Web Workerze, dzięki czemu układanie stron nie blokuje formularzy. Podgląd wykorzystuje PDF.js do pokazania dokładnie tego samego PDF wraz z zaznaczalną warstwą tekstu. Odświeżanie jest opóźnione o 350 ms; ostatnie trzy wyniki są buforowane. Eksport pozostaje wektorowy: tekst, linki, linie i tagi nie są screenshotami.

Format A4, marginesy mm → pt, automatyczna paginacja, ochrona wdów/sierot, miejsce po nagłówkach oraz pełne polskie fonty TTF. Długie akapity dzielą się pomiędzy całymi liniami. Długie sekcje i kolumny przechodzą na kolejne strony.

### DOCX

Natywne `Paragraph`, `TextRun`, `ExternalHyperlink`, listy numerowane jako punktory i edytowalne tabele kolumn. Zachowane są dane, kolejność, widoczność, nagłówki, pogrubienia, hierarchia list, kolory, rozmiary, interlinia, marginesy i podstawowe tagi. Fonty podstawowe obu rodzin są osadzane jako OFL TTF w pliku Worda; pogrubienie pozostaje natywnym formatowaniem tekstu.

Opcja **„Układ jednokolumnowy dla ATS”** usuwa tabelę kolumn i tagi graficzne, zachowując tekst oraz listy. Czytelność w konkretnym systemie ATS zależy od jego parsera.

PDF jest formatem wiernego odwzorowania podglądu. DOCX zachowuje treść i edytowalność, ale Word/LibreOffice mają własne algorytmy łamania stron i zastępowania fontów. Zaokrąglenia i identyczna geometria każdego elementu PDF nie mają pełnego odpowiednika w natywnym DOCX. Nie należy traktować DOCX jako identycznego wizualnie, bezstratnego obrazu PDF.

## Struktura

```text
src/
  types/resume.ts             # modele wywiedzione ze schematów Zod
  data/                      # dane demonstracyjne i trzy presety
  store/useResumeStore.ts    # persist, bezpieczna hydratacja i historia
  components/editor/         # formularze, DnD, kontrolki, szablony
  components/preview/        # wspólny dokument, fonty, canvas + tekst PDF.js
  services/exportPdf.ts      # klient Workera i bufor PDF
  services/pdf.worker.ts     # sekwencyjne renderowanie wektorowe
  services/exportDocx.ts     # mapper natywnego Worda + osadzone fonty
  services/projectJson.ts    # import/eksport wersjonowanych plików
  lib/                       # formatowanie, jednostki i bezpieczny storage
  __tests__/                 # testy danych, stanu i dokumentów
public/fonts/                # statyczne fonty i licencje OFL
scripts/export-smoke.mjs      # eksport wszystkich presetów i stress test
```

Nową sekcję dodaje się w `sectionIds`, schemacie danych, etykietach, edytorze, rendererze PDF i mapperze DOCX. Modele `ResumeData` i `ResumeTheme` mają jawne, silne typy. Schematy Zod kontrolują także dane z localStorage i importowanych plików.

## Fonty, prywatność i trwałość

Inter, Lora i Roboto są lokalne; licencje znajdują się w `public/fonts/*-OFL.txt`. Pełne fonty PDF są statycznymi instancjami otwartych źródeł [Google Fonts](https://github.com/google/fonts). Normalne działanie aplikacji nie pobiera zasobów z Google ani CDN. Opcjonalny skrypt `scripts/prepare_fonts.py` regeneruje pliki i wymaga Python + `fonttools`; nie jest potrzebny do uruchomienia aplikacji.

Stan jest przechowywany pod kluczem `folio-resume-v1` w localStorage. Czyszczenie danych witryny lub zmiana domeny/przeglądarki usuwa dostęp do tej kopii. Warto zachować eksport JSON. Brak miejsca lub wyłączony storage jest sygnalizowany; edycja działa dalej w pamięci. Dane przykładowe są fikcyjne. Aplikacja nie zawiera analityki ani telemetrii aplikacyjnej.

## Weryfikacja

Testy sprawdzają walidację importów i motywów, historię, szablony, błąd quota, polskie znaki, natywną strukturę Worda, osadzone fonty, ATS, długie listy, kompletność wielostronicowych kolumn, A4, marginesy i brak rasteryzacji PDF. `node scripts/export-smoke.mjs` tworzy w ignorowanym katalogu `test-results/` PDF, DOCX, JSON oraz PNG każdej strony trzech presetów i długiego CV do kontroli wizualnej. To materiały diagnostyczne, nie część buildu produkcyjnego.

Podczas wdrożenia hosting musi obsługiwać workery i lokalne pliki fontów. Przy restrykcyjnym CSP dopuść workery z własnej domeny oraz `blob:` dla PDF.js, lokalne fonty i inline styles wymagane przez renderer/zmienne CSS. Aplikacja wymaga nowoczesnej przeglądarki obsługującej modułowe workery, Canvas i API używane przez PDF.js. Interfejs zweryfikowano w przeglądarce opartej na Chromium. Aplikacja nie realizuje synchronizacji kont ani kopii w chmurze.

Dokumentacja bibliotek: [React PDF](https://react-pdf.org/), [docx](https://docx.js.org/), [Tailwind + Vite](https://tailwindcss.com/docs/installation/using-vite).
