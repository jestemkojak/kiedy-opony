import { useEffect, useRef, useState } from 'react';
import { Clock, LocateFixed, Loader2, MapPin, Search, X } from 'lucide-react';
import { PRESET_CITIES, searchCities } from '../services/weatherApi';
import type { DrivingWindow, LocationPoint } from '../types/weather';
import { DRIVING_WINDOW_OPTIONS } from '../utils/tireAdvisor';

interface ControlStripProps {
  location: LocationPoint;
  onSelectLocation: (loc: LocationPoint) => void;
  onRequestGeolocation: () => void;
  isLocating: boolean;
  geoError: string | null;
  onClearGeoError: () => void;
  drivingWindow: DrivingWindow;
  onChangeDrivingWindow: (win: DrivingWindow) => void;
}

const MOBILE_WINDOW_LABELS: Record<DrivingWindow, string> = {
  commute: 'Poranki',
  daytime: 'Dzień',
  all_day: 'Całodobowo',
};

export function ControlStrip({
  location,
  onSelectLocation,
  onRequestGeolocation,
  isLocating,
  geoError,
  onClearGeoError,
  drivingWindow,
  onChangeDrivingWindow,
}: ControlStripProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationPoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredWindow, setHoveredWindow] = useState<DrivingWindow | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const found = await searchCities(trimmed, controller.signal);
        setResults(found);
        setIsOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchError('Nie udało się wyszukać miejscowości.');
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleChooseCity = (city: LocationPoint) => {
    onSelectLocation(city);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onClearGeoError();
  };

  const activeWindowMeta = DRIVING_WINDOW_OPTIONS.find(
    (w) => w.id === drivingWindow
  )!;

  return (
    <section
      aria-label="Wybór lokalizacji i godzin jazdy"
      className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-5">
          {/* Left column: Location */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="city-search-input"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <span>Lokalizacja</span>
              </label>
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                {location.name}
                {location.source === 'gps' ? ' · GPS' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div ref={containerRef} className="relative flex-1 min-w-0">
                <div className="relative flex items-center">
                  <Search
                    className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    ref={inputRef}
                    id="city-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (e.target.value.trim().length >= 2) setIsOpen(true);
                    }}
                    onFocus={() => {
                      if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder="Wpisz miasto..."
                    autoComplete="off"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20 sm:h-10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-900"
                  />
                  {isSearching ? (
                    <Loader2
                      className="absolute right-2.5 h-4 w-4 animate-spin text-sky-600 dark:text-sky-400"
                      aria-hidden="true"
                    />
                  ) : query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setResults([]);
                        setIsOpen(false);
                        inputRef.current?.focus();
                      }}
                      aria-label="Wyczyść"
                      className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                {isOpen &&
                  (results.length > 0 ||
                    searchError ||
                    (!isSearching && query.trim().length >= 2)) && (
                    <div
                      role="listbox"
                      className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                    >
                      {searchError ? (
                        <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                          {searchError}
                        </p>
                      ) : results.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          Brak wyników dla „{query.trim()}”.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                          {results.map((item) => (
                            <li
                              key={`${item.name}-${item.latitude}-${item.longitude}`}
                            >
                              <button
                                type="button"
                                onClick={() => handleChooseCity(item)}
                                className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <MapPin
                                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                    aria-hidden="true"
                                  />
                                  <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                                    {item.name}
                                  </span>
                                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {[item.region, item.country]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
              </div>

              <button
                type="button"
                onClick={onRequestGeolocation}
                disabled={isLocating}
                title="Użyj bieżącej lokalizacji GPS"
                aria-label="Użyj mojej lokalizacji GPS"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 whitespace-nowrap shrink-0 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:h-10 sm:px-3.5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-700 dark:hover:bg-sky-950/50 dark:hover:text-sky-300 cursor-pointer"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LocateFixed className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                )}
                <span className="sm:hidden">GPS</span>
                <span className="hidden sm:inline">Moja lokalizacja</span>
              </button>
            </div>

            {/* Horizontal swipe strip on mobile, wrap on desktop */}
            <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-0.5 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {PRESET_CITIES.map((city) => {
                const isActive =
                  location.name === city.name &&
                  Math.abs(location.latitude - city.latitude) < 0.05;
                return (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => handleChooseCity(city)}
                    className={`rounded-md px-2.5 py-1.5 font-medium whitespace-nowrap shrink-0 transition-colors sm:px-2 sm:py-0.5 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    {city.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right column: Driving hours */}
          <div className="lg:col-span-6 space-y-2 border-t border-slate-100 pt-3.5 lg:border-l lg:border-t-0 lg:border-slate-200 lg:pl-6 lg:pt-0 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <span>Godziny jazdy</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {activeWindowMeta.shortLabel}
              </span>
            </div>

            <div
              role="group"
              aria-label="Godziny jazdy"
              className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:gap-1.5 dark:border-slate-700 dark:bg-slate-950"
            >
              {DRIVING_WINDOW_OPTIONS.map((option, idx) => {
                const isSelected = drivingWindow === option.id;
                const showTooltip = hoveredWindow === option.id;
                const tooltipAlignClass =
                  idx === 0
                    ? 'left-0'
                    : idx === DRIVING_WINDOW_OPTIONS.length - 1
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2';

                return (
                  <div
                    key={option.id}
                    className="relative"
                    onMouseEnter={() => setHoveredWindow(option.id)}
                    onMouseLeave={() => setHoveredWindow(null)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChangeDrivingWindow(option.id);
                        setHoveredWindow(null);
                      }}
                      onFocus={() => setHoveredWindow(option.id)}
                      onBlur={() => setHoveredWindow(null)}
                      aria-pressed={isSelected}
                      title={`${option.shortLabel} — ${option.hoursDescription}`}
                      className={`h-10 w-full rounded-md px-2 text-xs font-medium whitespace-nowrap truncate transition-colors sm:h-8 sm:px-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-xs dark:bg-sky-500 dark:text-slate-950'
                          : 'text-slate-700 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <span className="sm:hidden">{MOBILE_WINDOW_LABELS[option.id]}</span>
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>

                    {showTooltip && (
                      <div
                        role="tooltip"
                        className={`pointer-events-none hidden sm:block absolute top-full z-30 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-lg dark:border-slate-700 dark:bg-slate-800 ${tooltipAlignClass}`}
                      >
                        <p className="font-mono text-[11px] font-semibold text-sky-300 tabular-nums">
                          {option.shortLabel}
                        </p>
                        <p className="mt-0.5 leading-snug text-slate-200">
                          {option.hoursDescription}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {geoError && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <span>{geoError}</span>
            <button
              type="button"
              onClick={() => {
                onClearGeoError();
                inputRef.current?.focus();
              }}
              className="font-medium underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Wpisz miasto
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
