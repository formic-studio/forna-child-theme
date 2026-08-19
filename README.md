# Forna Child Theme

Produkcyjny child theme dla WordPressa, Bricks Buildera i WooCommerce. WordPress oraz Bricks odpowiadają za treść, strukturę stron i renderowanie HTML. Vite buduje wyłącznie własny, modularny frontend w TypeScript i CSS.

## Architektura

- WordPress: CMS, routing, media, użytkownicy i API.
- Bricks: szablony, layout, Theme Styles i SSR.
- WooCommerce: katalog, warianty, koszyk, checkout, płatności i zamówienia.
- Child theme: bootstrap PHP, integracja assetów i rozszerzenia projektu.
- Vite: TypeScript, CSS, minifikacja, sourcemapy development i dynamiczne chunki.
- `ComponentRegistry`: wykrywa `data-component`, zapobiega podwójnej inicjalizacji, izoluje błędy i uruchamia cleanup.

Bricks i jego licencja, WordPress oraz WooCommerce nie są częścią repozytorium. Motyw nadrzędny musi być zainstalowany w katalogu `bricks`.

## Wymagania

- WordPress 6.5 lub nowszy.
- PHP 8.1 lub nowszy.
- Bricks Builder jako aktywny motyw nadrzędny.
- WooCommerce w aktualnej stabilnej wersji.
- Node.js 24 LTS i npm 11 do pracy lokalnej.
- Git oraz dostęp do `https://github.com/formic-studio/forna-child-theme/`.

Node.js nie jest wymagany na hostingu produkcyjnym, ponieważ `dist/` jest commitowany.

## Instalacja deweloperska

```bash
git clone https://github.com/formic-studio/forna-child-theme.git
cd forna-child-theme
nvm use
npm ci
npm run check
```

Repozytorium powinno być katalogiem motywu, a nie jego katalogiem nadrzędnym. W instalacji WordPress ścieżka docelowa to `wp-content/themes/forna-child-theme/`.

Nie ma `.env.example`, ponieważ starter nie używa zmiennych środowiskowych ani sekretów.

## Komendy npm

| Komenda                | Działanie                                                                        |
| ---------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`          | Stabilny build obserwujący zmiany; development bez minifikacji i z sourcemapami. |
| `npm run build`        | Czyści `dist/` i tworzy zminifikowany build produkcyjny.                         |
| `npm run typecheck`    | Sprawdza TypeScript w strict mode bez emitowania plików.                         |
| `npm run lint`         | Uruchamia ESLint dla TypeScriptu i konfiguracji Vite.                            |
| `npm run format`       | Formatuje obsługiwane pliki przez Prettier.                                      |
| `npm run format:check` | Sprawdza format bez zmian.                                                       |
| `npm run check`        | Format check, typecheck, lint i produkcyjny build.                               |

Po zatrzymaniu `npm run dev` uruchom `npm run build`, aby w repozytorium nie zostały sourcemapy ani niezminifikowane assety.

## Struktura

```text
forna-child-theme/
├── .github/workflows/quality.yml
├── dist/                         # wynik Vite, obowiązkowo w Git
├── inc/
│   ├── assets.php
│   ├── helpers.php
│   └── theme-setup.php
├── languages/                    # pliki tłumaczeń WordPress
├── src/
│   ├── css/
│   │   ├── accessibility.css
│   │   └── main.css
│   └── ts/
│       ├── components/
│       │   └── example-disclosure.ts
│       ├── core/
│       │   ├── bricks-events.ts
│       │   ├── component-registry.ts
│       │   └── motion-preference.ts
│       ├── types/bricks.d.ts
│       └── main.ts
├── AGENTS.md
├── functions.php
├── style.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Tworzenie komponentu

1. Dodaj `src/ts/components/nazwa.ts` z domyślnie eksportowaną funkcją inicjalizującą.
2. Funkcja otrzymuje pasujący `HTMLElement`. Może zwrócić funkcję cleanup.
3. Zarejestruj moduł w `src/ts/main.ts` z unikalną nazwą, selektorem `data-*` i dynamicznym importem.
4. Zadbaj o semantyczny stan bez JavaScriptu, klawiaturę, ARIA i reduced motion.
5. Uruchom `npm run check` i commituj źródła razem z `dist/`.

```ts
registry.register({
  name: 'configurator',
  selector: '[data-component="configurator"]',
  load: () => import('./components/configurator'),
});
```

Import uruchamia się dopiero, gdy selektor istnieje w DOM. Vite zapisuje moduł w osobnym, hashowanym pliku. Błąd pobrania lub inicjalizacji jest przechwytywany dla konkretnego komponentu i nie zatrzymuje pozostałych.

### Użycie w Bricks

W polu **Attributes** elementu root ustaw:

- name: `data-component`
- value: `disclosure`

Przykładowy komponent wykorzystuje natywne, działające bez JS elementy:

```html
<details data-component="disclosure">
  <summary data-disclosure-trigger>Specyfikacja produktu</summary>
  <div data-disclosure-panel>Treść specyfikacji</div>
</details>
```

W Bricks zbuduj tę strukturę elementami HTML/Block i dodaj wskazane atrybuty. Nie wklejaj modułu do Code elementu. Bez JavaScriptu disclosure nadal działa dzięki natywnemu `<details>`.

## Bricks AJAX

Rejestr wykonuje skan po gotowości DOM. Obserwuje również dodawane i usuwane węzły oraz jawnie reaguje na `bricks/ajax/nodes_added`, używane m.in. przez infinite scroll, Load More, paginację AJAX i Query Filters. Ten sam element oraz ten sam komponent nie zostaną zainicjalizowane drugi raz. Po usunięciu elementu wykonywany jest jego cleanup.

Runtime nie jest ładowany w głównym interfejsie buildera, zgodnie z `bricks_is_builder_main()`. Jest dostępny na frontendzie i w canvasie. Jeśli przyszły moduł koliduje z canvasem, należy warunkować go na poziomie jego inicjalizatora zamiast wyłączać cały frontend dla odwiedzających.

## CSS i WCAG 2.2 AA

Starter zawiera wyłącznie techniczne zmienne, `.screen-reader-only`, widoczny `focus-visible`, bezpieczny `[hidden]`, obsługę reduced motion i regułę kursora dla disclosure. Nie narzuca brandingu ani animacji.

Każdy nowy komponent musi:

- być obsługiwalny klawiaturą i mieć poprawną semantykę;
- zachowywać czytelny stan bez JavaScriptu;
- aktualizować ARIA tylko wtedy, gdy jest potrzebne;
- nie opierać informacji tylko na kolorze, hoverze lub ruchu;
- respektować `prefers-reduced-motion`;
- unikać migania i zmian layoutu podczas inicjalizacji;
- sprzątać listenery, observery i utworzone zasoby.

Testy Playwright i axe należy dodać po udostępnieniu stabilnego środowiska testowego z finalnymi szablonami sklepu. Minimalny zakres ręczny to klawiatura, zoom 200/400%, czytnik ekranu, reduced motion, błędy konsoli oraz wszystkie warianty Bricks AJAX.

## Workflow development i produkcja

1. Zmieniaj kod w `src/` oraz `inc/`.
2. Podczas pracy uruchom `npm run dev`.
3. Przed przekazaniem uruchom `npm run check`.
4. Upewnij się, że produkcyjny `dist/` jest aktualny.
5. Commituj źródła i cały `dist/`.
6. Pushuj zaakceptowane zmiany do `main`.

Główny JS i CSS mają stałe ścieżki `dist/assets/main.js` oraz `dist/assets/main.css`; opcjonalne chunki mają hash w nazwie. PHP sprawdza istnienie plików i wersjonuje je przez `filemtime()`. JavaScript jest ładowany jako ES module przez natywne API WordPress 6.5+, z bezpiecznym fallbackiem dla starszego core.

### Ciężkie biblioteki

Dodaj bibliotekę tylko wtedy, gdy realna funkcja jej wymaga. Importuj ją wewnątrz konkretnego modułu komponentu, nigdy w `main.ts`:

```ts
export default async function initialize(element: HTMLElement): Promise<() => void> {
  const { default: Library } = await import('heavy-library');
  const instance = new Library(element);
  return () => instance.destroy();
}
```

Zweryfikuj rozmiar chunku po `npm run build`, licencję biblioteki, działanie bez modułu oraz cleanup.

## Deployment GitHub → WP Pusher

1. W GitHub ustaw domyślny branch `main` i upewnij się, że repo ma `style.css` w katalogu głównym.
2. W WordPress zainstaluj osobno Bricks, WooCommerce i WP Pusher.
3. W WP Pusher wybierz **Install Theme**, podaj repozytorium `formic-studio/forna-child-theme` i branch `main`.
4. Dla repozytorium prywatnego skonfiguruj autoryzację GitHub w WP Pusher; tokenu nie zapisuj w repo.
5. Zainstaluj i aktywuj **Forna Child Theme**. Bricks musi istnieć pod slugiem `bricks`.
6. Po kolejnych pushach aktualizuj motyw przez WP Pusher, a następnie czyść cache hostingu/CDN.

WP Pusher nie uruchamia Node.js. Dlatego `dist/` musi być commitowany po każdej zmianie źródeł. GitHub Actions ponownie buduje projekt i kończy się błędem, jeśli wynik różni się od commita.

## Nieaktualny `dist/`

Jeśli CI zgłasza różnicę:

```bash
nvm use
npm ci
npm run build
git status --short dist
git diff -- dist
```

Dodaj wszystkie zmienione, nowe i usunięte pliki z `dist/` do tego samego commita co źródła. Nie edytuj plików w `dist/` ręcznie. Sprawdź też Node 24 i czysty `npm ci`, ponieważ inna wersja toolchainu może zmienić output.

## Konfiguracja WooCommerce

Motyw deklaruje wsparcie WooCommerce i natywnych galerii produktu, ale celowo nie nadpisuje szablonów wtyczki. Po instalacji utwórz strony Sklep, Koszyk, Zamówienie i Moje konto; skonfiguruj PLN, podatki, wysyłkę, płatności, e-maile i polityki prawne. Szablony produktu, archiwum, koszyka i checkoutu zbuduj w Bricks Theme Builder i przetestuj na realnych wariantach produktu.

## Checklista przed wdrożeniem

- [ ] `npm ci` oraz `npm run check` przechodzą bez błędów.
- [ ] `dist/assets/main.js`, `dist/assets/main.css` i wszystkie chunki są w Git.
- [ ] Bricks, child theme i WooCommerce są aktualne na stagingu.
- [ ] Brak błędów konsoli na stronach bez `data-component` i z każdym komponentem.
- [ ] Load More, paginacja i filtry Bricks inicjalizują nowe komponenty tylko raz.
- [ ] Menu, formularze, produkt, koszyk i checkout działają klawiaturą.
- [ ] Sprawdzono focus, reduced motion, zoom, komunikaty błędów i kontrast.
- [ ] Skonfigurowano kopie zapasowe, płatności testowe, podatki, wysyłkę i e-maile.
- [ ] Usunięto testowe konta, zamówienia i produkty oraz wyczyszczono cache.
- [ ] WP Pusher śledzi `main`, a deployment nie wymaga Node.js na serwerze.
