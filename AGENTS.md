# Zasady rozwoju Forna Child Theme

Te zasady obowiązują w całym repozytorium.

- Pisz modularny TypeScript zamiast niestrukturyzowanego JavaScriptu i nie dodawaj kodu aplikacyjnego do elementów Code w Bricks.
- Każdy komponent frontendu rejestruj w `src/ts/main.ts` przez `ComponentRegistry`.
- Uruchamiaj komponenty selektorami `data-*`; nie wiąż ich ze slugami, ID podstron ani adresami URL.
- Ciężkie oraz opcjonalne moduły ładuj przez dynamiczny `import()` i tylko po znalezieniu selektora w DOM.
- Inicjalizacja musi być idempotentna. Każdy listener, observer i zasób komponentu musi mieć cleanup.
- Nie dodawaj globalnych listenerów bez cleanup; listener z `{ once: true }` jest dopuszczalny.
- Awaria jednego opcjonalnego modułu nie może zatrzymać innych komponentów.
- Nie dodawaj bibliotek ani frameworków bez udokumentowanego uzasadnienia, oceny wpływu na bundle i zgody właściciela projektu.
- Zachowuj progressive enhancement: treść i nawigacja muszą być użyteczne bez JavaScriptu.
- Przestrzegaj WCAG 2.2 AA, semantyki HTML, obsługi klawiatury i `prefers-reduced-motion`.
- Zachowuj kompatybilność z `bricks/ajax/nodes_added` i treścią wymienianą przez Bricks AJAX.
- PHP musi przestrzegać WordPress Coding Standards, zaczynać się ochroną `ABSPATH` i nie mieć zamykającego znacznika.
- Nie nadpisuj szablonów WooCommerce bez konkretnej potrzeby; preferuj hooki, aby ograniczyć koszt aktualizacji.
- Po każdej zmianie uruchom `npm run check` i upewnij się, że lint, typecheck oraz build przechodzą.
- Po zmianach źródeł zawsze wygeneruj i dodaj do commita cały aktualny `dist/`.
- Nie umieszczaj w repozytorium sekretów, tokenów, haseł ani danych środowiskowych.
- Nie wykonuj commitów ani pushy bez wyraźnej zgody użytkownika.
