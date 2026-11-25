import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { BrakingCompoundSection } from './components/BrakingCompoundSection';
import { ControlStrip } from './components/ControlStrip';
import { ExpertGuidelinesSection } from './components/ExpertGuidelinesSection';
import { Navbar } from './components/Navbar';
import { TemperatureChartsSection } from './components/TemperatureChartsSection';
import { VerdictSection } from './components/VerdictSection';
import {
  DEFAULT_LOCATION,
  fetchWeatherDataset,
  reverseGeocode,
} from './services/weatherApi';
import type {
  DrivingWindow,
  LocationPoint,
  RawWeatherDataset,
} from './types/weather';
import {
  buildDailySummaries,
  evaluateTireVerdict,
  getNext48Hours,
} from './utils/tireAdvisor';

const STORAGE_LOCATION_KEY = 'kiedyopony_location_v2';
const LEGACY_LOCATION_KEY = 'oponaradar_location_v1';
const STORAGE_WINDOW_KEY = 'oponaradar_driving_window_v1';
const STORAGE_THEME_KEY = 'oponaradar_theme';

function loadSavedLocation(): LocationPoint {
  try {
    const raw =
      localStorage.getItem(STORAGE_LOCATION_KEY) ??
      localStorage.getItem(LEGACY_LOCATION_KEY);
    if (!raw) return DEFAULT_LOCATION;
    const parsed = JSON.parse(raw) as Partial<LocationPoint>;
    if (
      typeof parsed.name === 'string' &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return {
        name: parsed.name,
        region: parsed.region,
        country: parsed.country,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        source: parsed.source === 'gps' ? 'gps' : 'manual',
      };
    }
  } catch {
    // Ignore invalid storage
  }
  return DEFAULT_LOCATION;
}

function loadSavedDrivingWindow(): DrivingWindow {
  try {
    const saved = localStorage.getItem(STORAGE_WINDOW_KEY);
    if (saved === 'commute' || saved === 'daytime' || saved === 'all_day') {
      return saved;
    }
  } catch {
    // Ignore
  }
  return 'commute';
}

function loadSavedTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(STORAGE_THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Ładowanie danych pogodowych">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="h-11 border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50" />
        <div className="space-y-4 p-6">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-full max-w-2xl rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-4 dark:border-slate-800">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 p-6">
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/70" />
              <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-64 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-52 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-[340px] w-full rounded-lg bg-slate-100/80 dark:bg-slate-800/40" />
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(loadSavedTheme);
  const [location, setLocation] = useState<LocationPoint>(loadSavedLocation);
  const [drivingWindow, setDrivingWindow] = useState<DrivingWindow>(
    loadSavedDrivingWindow
  );

  const [dataset, setDataset] = useState<RawWeatherDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Sync theme to documentElement & localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {
      // Ignore storage error
    }
  }, [theme]);

  const handleSelectLocation = useCallback((nextLocation: LocationPoint) => {
    setLocation(nextLocation);
    try {
      localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(nextLocation));
    } catch {
      // Ignore
    }
  }, []);

  // Persist driving window
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WINDOW_KEY, drivingWindow);
    } catch {
      // Ignore
    }
  }, [drivingWindow]);

  // Fetch weather whenever location or refreshTick changes
  useEffect(() => {
    const controller = new AbortController();
    const isInitialForLocation = dataset === null;

    if (isInitialForLocation) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setFetchError(null);

    fetchWeatherDataset(location, controller.signal)
      .then((res) => {
        setDataset(res);
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setFetchError(
          err.message || 'Nie udało się pobrać danych pogodowych. Sprawdź połączenie.'
        );
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, refreshTick]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleRequestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError(
        'Twoja przeglądarka nie obsługuje geolokalizacji. Wybierz miasto ręcznie.'
      );
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const resolved = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          handleSelectLocation(resolved);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            'Brak zgody na udostępnienie lokalizacji GPS. Możesz wpisać miasto ręcznie.'
          );
        } else if (err.code === err.TIMEOUT) {
          setGeoError(
            'Przekroczono czas ustalania lokalizacji GPS. Spróbuj ponownie lub wybierz miasto ręcznie.'
          );
        } else {
          setGeoError(
            'Nie udało się ustalić Twojej lokalizacji. Wybierz miasto z listy poniżej.'
          );
        }
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 }
    );
  }, [handleSelectLocation]);

  const dailySummaries = useMemo(() => {
    if (!dataset) return [];
    return buildDailySummaries(dataset, drivingWindow);
  }, [dataset, drivingWindow]);

  const verdict = useMemo(() => {
    if (!dataset || !dailySummaries.length) return null;
    return evaluateTireVerdict(dataset, dailySummaries, drivingWindow);
  }, [dataset, dailySummaries, drivingWindow]);

  const hourly48 = useMemo(() => {
    if (!dataset) return [];
    return getNext48Hours(dataset);
  }, [dataset]);

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <ControlStrip
        location={location}
        onSelectLocation={handleSelectLocation}
        onRequestGeolocation={handleRequestGeolocation}
        isLocating={isLocating}
        geoError={geoError}
        onClearGeoError={() => setGeoError(null)}
        drivingWindow={drivingWindow}
        onChangeDrivingWindow={setDrivingWindow}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
        {fetchError && !dataset ? (
          <div
            role="alert"
            className="flex flex-col items-start justify-between gap-4 rounded-xl border border-red-200 bg-white p-6 sm:flex-row sm:items-center dark:border-red-900/60 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  Nie udało się pobrać danych pogodowych
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {fetchError}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Spróbuj ponownie</span>
            </button>
          </div>
        ) : isLoading || !dataset || !verdict ? (
          <DashboardSkeleton />
        ) : (
          <>
            {fetchError && (
              <div
                role="status"
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
              >
                <span>
                  Wyświetlono ostatnio pobrane dane. Błąd odświeżania: {fetchError}
                </span>
                <button
                  type="button"
                  onClick={() => setRefreshTick((t) => t + 1)}
                  className="font-semibold underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ponów
                </button>
              </div>
            )}

            <VerdictSection
              dataset={dataset}
              verdict={verdict}
              onRefresh={() => setRefreshTick((t) => t + 1)}
              isRefreshing={isRefreshing}
            />

            <TemperatureChartsSection
              dailySummaries={dailySummaries}
              hourly48={hourly48}
              drivingWindow={drivingWindow}
              theme={theme}
            />

            <BrakingCompoundSection
              currentTemperature={dataset.current.temperature}
              theme={theme}
            />
          </>
        )}

        <ExpertGuidelinesSection />
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-slate-400">
          <p>
            Kiedy Opony · Dane meteorologiczne i historyczne dostarcza{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Open-Meteo
            </a>
            .
          </p>
          <p>
            Zalecenia opracowano na podstawie wytycznych PZPO, ADAC oraz TÜV SÜD. Zawsze dostosuj decyzję do lokalnych warunków na trasie.
          </p>
        </div>
      </footer>
    </div>
  );
}
