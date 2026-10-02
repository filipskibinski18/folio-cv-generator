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
- **Zdjęcie**: „Dane osobowe → Dodaj zdjęcie” przyjmuje JPG, PNG i WEBP do 10 MB / 40 megapikseli. Edytor pozwala powiększyć kadr i przesunąć go w obu osiach. Obraz jest lokalnie kadrowany do kwadratu i zmniejszany do 512 × 512 px, aby oszczędzać miejsce w localStorage. Można go zmienić lub usunąć. Zdjęcie pozostaje częścią danych CV po zmianie szablonu i trafia do kopii projektu JSON.
- **Wygląd**: dwa niezależne fonty, rozmiary tekstu/nagłówków/nazwiska, interlinia, tracking, sześć kolorów, cztery marginesy w mm, odstępy, padding, zaokrąglenia i separatory. Dodatkowo trzy kompozycje nagłówka, trzy style tytułów sekcji oraz widoczność, kształt (koło/zaokrąglone/kwadrat), pozycja i rozmiar zdjęcia (20–40 mm).
- **Układ**: jedna kolumna, lewa lub prawa belka o szerokości 25–45%, Modern Grid oraz listy, tagi lub poziomy umiejętności. Rozwiń sekcję, aby zmienić jej nagłówek i przypisać kolumnę. Widoczność zmienia ikona oka.
- **Przeciąganie**: użyj uchwytu obok sekcji. Klawiaturą: ustaw fokus na uchwycie, naciśnij spację, użyj strzałek i zatwierdź spacją. Kolejność obowiązuje wewnątrz przypisanej kolumny; w jednym słupku jest globalna. Klauzula jako ostatnia sekcja główna zajmuje pełną szerokość pod kolumnami. Po jej przeniesieniu obowiązuje nowa pozycja.
- **Szablony**: osiem presetów — Modern (zielona lewa kolumna), Executive (klasyczny szeryfowy), Creative (terakota i tagi), Blueprint (granatowy baner), Editorial (burgundowa typografia), Nordic (turkus i prawa kolumna), Atelier (ciepły Modern Grid), Midnight (fioletowy baner, jedna kolumna). W każdym domyślnie widoczna jest ramka na zdjęcie. Zapis własnego szablonu przechowuje motyw, ustawienia zdjęcia i sekcji. Można go załadować, sklonować, zmienić nazwę/zapisać nowy wygląd, usunąć i wyeksportować do JSON. Dane osoby i samo zdjęcie nie są częścią szablonu.
- **JSON**: „Eksportuj CV → Kopia projektu” zapisuje wszystkie dane i motyw. „Importuj JSON” rozpoznaje projekt lub szablon, sprawdza wersję 1, strukturę, dopuszczalne parametry oraz limit 2 MB. Błędny import nie nadpisuje dokumentu.
- **Cofanie**: przyciski w nagłówku; poza polem tekstowym także Ctrl/Cmd+Z i Ctrl/Cmd+Shift+Z. Do 40 stanów danych/motywu. Historia pozostaje w pamięci bieżącej sesji. Wpisywanie w polu obsługuje również natywne cofanie przeglądarki.
- **Telefon**: przełącznik „Podgląd / Edytor” zachowuje dostęp do wszystkich paneli. Podgląd można powiększać i dopasowywać do dostępnej szerokości.

## Eksport i zgodność

### PDF

`ResumeDocument` jest jedynym rendererem dokumentu. Pracuje w Web Workerze, dzięki czemu układanie stron nie blokuje formularzy. Podgląd wykorzystuje PDF.js do pokazania dokładnie tego samego PDF wraz z zaznaczalną warstwą tekstu. Odświeżanie jest opóźnione o 350 ms; ostatnie trzy wyniki są buforowane. Eksport pozostaje wektorowy: tekst, linki, linie i tagi nie są screenshotami.

Format A4, marginesy mm → pt, automatyczna paginacja, ochrona wdów/sierot, miejsce po nagłówkach oraz pełne polskie fonty TTF. Długie akapity dzielą się pomiędzy całymi liniami. Długie sekcje i kolumny przechodzą na kolejne strony.

Zdjęcie jest osadzonym obrazem rastrowym, maskowanym zgodnie z kształtem ramki; tekst i pozostałe elementy dokumentu pozostają wektorowe. Bez dodanego zdjęcia renderer pokazuje wektorową sylwetkę i etykietę ramki. Ramkę można wyłączyć w panelu Wygląd.

### DOCX

Natywne `Paragraph`, `TextRun`, `ExternalHyperlink`, listy numerowane jako punktory i edytowalne tabele kolumn. Zachowane są dane, kolejność, widoczność, nagłówki, pogrubienia, hierarchia list, kolory, rozmiary, interlinia, marginesy i podstawowe tagi. Fonty podstawowe obu rodzin są osadzane jako OFL TTF w pliku Worda; pogrubienie pozostaje natywnym formatowaniem tekstu.

Zdjęcie trafia do natywnego `ImageRun` z opisem alternatywnym, w tabeli nagłówka obok edytowalnych danych kandydata. Przy pobieraniu z przeglądarki maska koła lub zaokrąglenia jest zachowana w przezroczystym PNG. Obraz można zaznaczyć, zmienić lub usunąć w Wordzie. Bez zdjęcia nagłówek zawiera miejsce na jego dodanie.

Opcja **„Układ jednokolumnowy dla ATS”** usuwa zdjęcie i ramkę, tabele kolumn oraz tagi graficzne, zachowując tekst oraz listy. Czytelność w konkretnym systemie ATS zależy od jego parsera.

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

Starsze projekty JSON i zapisane motywy z wersji 1 pozostają zgodne: brakujące pola zdjęcia, nagłówka i stylu sekcji są uzupełniane wartościami domyślnymi. Import zdjęcia akceptuje wyłącznie lokalny JPEG/PNG jako data URL; adresy zewnętrzne i SVG są odrzucane.

## Weryfikacja

Testy sprawdzają walidację importów i motywów, zgodność starszych plików, kadr zdjęcia, zapis zdjęcia po zmianie szablonu, historię, błąd quota, polskie znaki, natywną strukturę Worda i osadzony obraz, fonty, ATS, długie listy, kompletność wielostronicowych kolumn, A4, marginesy i zachowanie wektorowego tekstu PDF. `node scripts/export-smoke.mjs` tworzy w ignorowanym katalogu `test-results/` PDF, DOCX, JSON oraz PNG każdej strony ośmiu presetów, wariantów ze zdjęciem i długiego CV. Generuje też anonimowy portret diagnostyczny do sprawdzenia uploadu i kadrowania. To materiały diagnostyczne, nie część buildu produkcyjnego.

Podczas wdrożenia hosting musi obsługiwać workery i lokalne pliki fontów. Przy restrykcyjnym CSP dopuść workery z własnej domeny oraz `blob:` dla PDF.js, lokalne fonty i inline styles wymagane przez renderer/zmienne CSS. Aplikacja wymaga nowoczesnej przeglądarki obsługującej modułowe workery, Canvas i API używane przez PDF.js. Interfejs zweryfikowano w przeglądarce opartej na Chromium. Aplikacja nie realizuje synchronizacji kont ani kopii w chmurze.

Dokumentacja bibliotek: [React PDF](https://react-pdf.org/), [docx](https://docx.js.org/), [Tailwind + Vite](https://tailwindcss.com/docs/installation/using-vite).
