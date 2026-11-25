# Kiedy Opony

Panel analityczny pomagający ocenić, czy nadszedł odpowiedni moment na sezonową zmianę opon na zimowe lub letnie. Decyzja opiera się na rzeczywistych danych pogodowych z **7 dni wstecz** i **7-dniowej prognozy**, wybranej porze codziennej jazdy, ryzyku opadów i gołoledzi oraz wytycznych organizacji eksperckich (**PZPO**, **ADAC**, **TÜV SÜD**).

## Najważniejsze funkcje

- **Automatyczny werdykt z uzasadnieniem** — ocena warunków w oparciu o 4 kryteria: wielodniowy trend względem progu `7°C`, temperatury minimalne w godzinach jazdy, opady śniegu / ryzyko gołoledzi oraz kierunek zmian temperatury (ochłodzenie vs. ocieplenie).
- **Lokalizacja GPS lub wybór ręczny** — pobieranie bieżącej lokalizacji przeglądarki, wyszukiwarka dowolnej miejscowości oraz szybki wybór głównych miast Polski (domyślnie **Poznań**, z zapamiętywaniem ostatniego wyboru użytkownika).
- **Profile godzin jazdy** — możliwość wyboru typowej pory korzystania z auta (*Poranki i wieczory*, *Godziny dzienne*, *Jazda całodobowa*), co natychmiast przelicza ryzyko porannych przymrozków i werdykt.
- **Czytelne wykresy i zestawienie dzienne**:
  - 15-dniowy wykres trendu (7 dni historii + dziś + 7 dni prognozy) z zaznaczonym progiem `7°C` i `0°C`,
  - 48-godzinny wykres godzinowy z opadami oraz podświetlonymi godzinami jazdy,
  - filtrowana tabela dzienna (na urządzeniach mobilnych prezentowana jako kompaktowa lista).
- **Porównywarka drogi hamowania i fizyka mieszanki** — interaktywne porównanie drogi hamowania opon zimowych i letnich dla różnych nawierzchni i prędkości (`50 km/h` / `80 km/h`) oraz wykres elastyczności mieszanki gumowej względem temperatury.
- **Zalecenia ekspertów** — zwięzłe opracowanie zasady `7°C`, zalecanej głębokości bieżnika (`4 mm` dla opon zimowych, `3 mm` dla letnich wobec ustawowych `1,6 mm`) oraz znaczenia symbolu alpejskiego `3PMSF`.
- **Tryb jasny i ciemny** oraz układ dostosowany do telefonów i komputerów.

## Źródła danych

Aplikacja działa w 100% po stronie przeglądarki i nie wymaga kluczy API:
- **Open-Meteo Forecast API** — aktualna pogoda, dane historyczne (7 dni wstecz) oraz prognoza godzinowa (7 dni naprzód),
- **Open-Meteo Geocoding API** — wyszukiwanie miejscowości,
- **BigDataCloud Reverse Geocoding** — zamiana współrzędnych GPS na nazwę miejscowości.

## Stos technologiczny

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Recharts
- Lucide React

## Uruchomienie lokalne

Wymagany jest Node.js w wersji 20 lub nowszej.

```bash
npm install
npm run dev
```

Aplikacja uruchomi się lokalnie pod adresem `http://localhost:3000`.

### Pozostałe polecenia

```bash
npm run build   # Zbudowanie wersji produkcyjnej w katalogu dist/
npm run preview # Podgląd zbudowanej wersji produkcyjnej
npm run lint    # Sprawdzenie typów TypeScript (tsc --noEmit)
```

## Publikacja na GitHub Pages

Repozytorium zawiera gotowy workflow w pliku `.github/workflows/deploy-pages.yml` oraz konfigurację `base: './'` w `vite.config.ts`.

1. Wypchnij kod na gałąź `main` (lub `master`).
2. W ustawieniach repozytorium na GitHub przejdź do **Settings → Pages**.
3. W sekcji **Build and deployment → Source** wybierz **GitHub Actions**.

Po każdym kolejnym wypchnięciu zmian strona zbuduje się i zaktualizuje automatycznie.

## Zastrzeżenie

Wskazania aplikacji mają charakter informacyjny i wspierający decyzję na podstawie prognoz meteorologicznych oraz ogólnych zaleceń ekspertów. Kierowca zawsze powinien dostosować ogumienie i styl jazdy do aktualnych, lokalnych warunków drogowych.
