import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  CloudRain,
  CloudSnow,
  RefreshCw,
  Snowflake,
  Sun,
  ThermometerSnowflake,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { describeWmoCode } from '../services/weatherApi';
import type {
  FactorLevel,
  RawWeatherDataset,
  TireVerdict,
} from '../types/weather';

interface VerdictSectionProps {
  dataset: RawWeatherDataset;
  verdict: TireVerdict;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function getVerdictTheme(status: TireVerdict['status']) {
  if (status === 'winter') {
    return {
      icon: Snowflake,
      iconColor: 'text-sky-600 dark:text-sky-400',
      labelColor: 'text-sky-700 dark:text-sky-300',
      surfaceTint: 'bg-sky-50/60 dark:bg-sky-950/25',
    };
  }
  if (status === 'summer') {
    return {
      icon: Sun,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      labelColor: 'text-emerald-700 dark:text-emerald-300',
      surfaceTint: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    };
  }
  return {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    labelColor: 'text-amber-700 dark:text-amber-300',
    surfaceTint: 'bg-amber-50/60 dark:bg-amber-950/20',
  };
}

function getFactorTextColor(level: FactorLevel): string {
  if (level === 'winter') return 'text-sky-700 dark:text-sky-400';
  if (level === 'caution') return 'text-amber-700 dark:text-amber-400';
  return 'text-emerald-700 dark:text-emerald-400';
}

export function VerdictSection({
  dataset,
  verdict,
  onRefresh,
  isRefreshing,
}: VerdictSectionProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const theme = getVerdictTheme(verdict.status);
  const VerdictIcon = theme.icon;

  const updatedTime = new Date(dataset.fetchedAt).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const trendSign = verdict.trendDelta > 0 ? '+' : '';
  const weatherLabel = describeWmoCode(dataset.current.weatherCode);

  return (
    <section id="werdykt" aria-labelledby="verdict-heading" className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Minimal header line */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 text-xs text-slate-500 sm:px-6 dark:border-slate-800 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {dataset.location.name}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{weatherLabel}</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="hidden font-mono tabular-nums sm:inline">
              {Math.round(dataset.current.windSpeed)} km/h
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono tabular-nums">{updatedTime}</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Odśwież dane pogodowe"
              title="Odśwież dane pogodowe"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Clean, focused Verdict Hero */}
        <div className={`px-4 py-5 sm:px-6 sm:py-6 ${theme.surfaceTint}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <VerdictIcon
                  className={`h-4 w-4 shrink-0 ${theme.iconColor}`}
                  aria-hidden="true"
                />
                <span className={`text-xs font-semibold ${theme.labelColor}`}>
                  {verdict.recommendedTire}
                </span>
              </div>

              <h1
                id="verdict-heading"
                className="text-xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white"
              >
                {verdict.headline}
              </h1>
            </div>

            {verdict.hazards.length > 0 && (
              <div className="flex flex-col gap-1 text-xs font-medium text-amber-800 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1 dark:text-amber-300">
                {verdict.hazards.map((hazard) => {
                  const Icon =
                    hazard.type === 'snow'
                      ? CloudSnow
                      : hazard.type === 'black_ice'
                      ? ThermometerSnowflake
                      : hazard.type === 'cold_rain'
                      ? CloudRain
                      : Snowflake;
                  return (
                    <span
                      key={hazard.id}
                      title={hazard.description}
                      className="inline-flex items-start gap-1.5 leading-snug sm:items-center"
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" aria-hidden="true" />
                      <span>{hazard.title}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Clean 2x2 mobile / 4-col desktop KPI strip with exact borders */}
        <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-4 dark:border-slate-800">
          <div className="border-b border-r border-slate-200 px-4 py-3.5 sm:border-b-0 sm:px-6 sm:py-4 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Teraz</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-950 sm:text-2xl dark:text-white">
              {dataset.current.temperature.toFixed(1)}°C
            </p>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              Odcz. {dataset.current.apparentTemperature.toFixed(1)}°C
            </p>
          </div>

          <div className="border-b border-slate-200 px-4 py-3.5 sm:border-b-0 sm:border-r sm:px-6 sm:py-4 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">7 dni wstecz</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-950 sm:text-2xl dark:text-white">
              {verdict.past7Avg.toFixed(1)}°C
            </p>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {verdict.pastDaysBelow7}/7 dni &lt; 7°C
            </p>
          </div>

          <div className="border-r border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Prognoza 7 dni</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-950 sm:text-2xl dark:text-white">
              {verdict.forecast7Avg.toFixed(1)}°C
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {verdict.trendDelta < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              )}
              <span>
                {trendSign}
                {verdict.trendDelta.toFixed(1)}°C
              </span>
            </p>
          </div>

          <div className="px-4 py-3.5 sm:px-6 sm:py-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Min. w porze jazdy</p>
            <p
              className={`mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl ${
                verdict.forecastDrivingMin <= 0
                  ? 'text-sky-700 dark:text-sky-400'
                  : verdict.forecastDrivingMin < 7
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {verdict.forecastDrivingMin.toFixed(1)}°C
            </p>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              Śr. {verdict.forecastDrivingAvg.toFixed(1)}°C
            </p>
          </div>
        </div>

        {/* Collapsible Decision Breakdown (collapsed by default) */}
        <div className="border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => setIsDetailsOpen((prev) => !prev)}
            aria-expanded={isDetailsOpen}
            className="flex min-h-[44px] w-full items-center justify-between gap-4 px-4 py-3 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100/80 hover:text-slate-950 sm:px-6 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold">Składowe decyzji i uzasadnienie</span>
              <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
                · Próg 7°C · Pora jazdy · Opady · Trend
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                isDetailsOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {isDetailsOpen && (
            <div className="space-y-4 border-t border-slate-200 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5 dark:border-slate-800">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 md:gap-4">
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                  {verdict.summary}
                </p>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    Zalecenie:{' '}
                  </strong>
                  {verdict.actionGuidance}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 md:grid-cols-2 xl:grid-cols-4 dark:border-slate-800">
                {verdict.factors.map((factor) => (
                  <div key={factor.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {factor.label}
                      </span>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap shrink-0 ${getFactorTextColor(
                          factor.level
                        )}`}
                      >
                        {factor.levelLabel}
                      </span>
                    </div>
                    <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {factor.valueText}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {factor.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
