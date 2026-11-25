import { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { describeWmoCode } from '../services/weatherApi';
import type {
  DailySummary,
  DrivingWindow,
  HourlyPoint,
} from '../types/weather';
import {
  DRIVING_WINDOW_OPTIONS,
  EXPERT_TEMP_THRESHOLD,
  isHourInDrivingWindow,
} from '../utils/tireAdvisor';

interface TemperatureChartsSectionProps {
  dailySummaries: DailySummary[];
  hourly48: HourlyPoint[];
  drivingWindow: DrivingWindow;
  theme: 'light' | 'dark';
}

type ChartMode = 'trend15' | 'hourly48';
type TableFilter = 'all' | 'history' | 'forecast' | 'risk';

interface TrendTooltipPayload {
  payload: DailySummary;
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TrendTooltipPayload[];
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const segmentName =
    d.segment === 'history'
      ? 'Historia'
      : d.segment === 'today'
      ? 'Dziś'
      : 'Prognoza';

  const riskTags: string[] = [];
  if (d.hasSnowRisk) riskTags.push('Śnieg');
  if (d.hasBlackIceRisk) riskTags.push('Ryzyko gołoledzi');
  if (d.hasFrostRisk) riskTags.push('Przymrozek');
  if (d.hasColdRainRisk) riskTags.push('Zimny deszcz');

  return (
    <div className="min-w-[205px] max-w-[250px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 dark:border-slate-800">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {d.fullDateLabel}
        </span>
        <span className="font-medium text-slate-500 dark:text-slate-400">
          {segmentName}
        </span>
      </div>

      <div className="mt-2 space-y-1 font-mono tabular-nums">
        <div className="flex justify-between gap-3">
          <span className="font-sans text-slate-600 dark:text-slate-400">Średnia dobowa</span>
          <span className="font-semibold text-slate-950 dark:text-white">
            {d.avgTemp.toFixed(1)}°C
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-sans text-slate-600 dark:text-slate-400">Min. w porze jazdy</span>
          <span className="font-semibold text-sky-700 dark:text-sky-400">
            {d.drivingMinTemp.toFixed(1)}°C
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-sans text-slate-600 dark:text-slate-400">Zakres dobowy</span>
          <span className="text-slate-700 dark:text-slate-300">
            {d.minTemp.toFixed(1)}° / {d.maxTemp.toFixed(1)}°
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-sans text-slate-600 dark:text-slate-400">Opady / Śnieg</span>
          <span className="text-slate-700 dark:text-slate-300">
            {d.precipitationSum.toFixed(1)} mm · {d.snowfallSum.toFixed(1)} cm
          </span>
        </div>
      </div>

      <div className="mt-2 border-t border-slate-100 pt-1.5 text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <span>{describeWmoCode(d.dominantWeatherCode)}</span>
        {riskTags.length > 0 && (
          <p className="mt-0.5 font-semibold text-amber-700 dark:text-amber-400">
            Uwaga: {riskTags.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}

interface HourlyChartRow extends HourlyPoint {
  tickLabel: string;
  fullHourLabel: string;
  inDrivingWindow: boolean;
}

function HourlyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: HourlyChartRow }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const h = payload[0].payload;

  return (
    <div className="min-w-[195px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 dark:border-slate-800">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {h.fullHourLabel}
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          {h.inDrivingWindow ? 'Pora jazdy' : 'Poza oknem'}
        </span>
      </div>
      <div className="mt-2 space-y-1 font-mono tabular-nums">
        <div className="flex justify-between gap-3">
          <span className="font-sans text-slate-600 dark:text-slate-400">Temperatura</span>
          <span className="font-semibold text-slate-950 dark:text-white">
            {h.temperature.toFixed(1)}°C
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-sans text-slate-600 dark:text-slate-400">Odczuwalna</span>
          <span className="text-slate-700 dark:text-slate-300">
            {h.apparentTemperature.toFixed(1)}°C
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-sans text-slate-600 dark:text-slate-400">Opady</span>
          <span className="text-slate-700 dark:text-slate-300">
            {h.precipitation.toFixed(1)} mm
            {h.snowfall > 0 ? ` (${h.snowfall.toFixed(1)} cm)` : ''}
          </span>
        </div>
      </div>
      <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {describeWmoCode(h.weatherCode)}
      </p>
    </div>
  );
}

function getDayStatus(day: DailySummary): { text: string; shortText: string; className: string } {
  if (day.hasSnowRisk) {
    return {
      text: 'Opady śniegu — wymagane zimowe',
      shortText: 'Śnieg — zimowe',
      className: 'text-sky-700 font-semibold dark:text-sky-400',
    };
  }
  if (day.hasBlackIceRisk) {
    return {
      text: 'Ryzyko gołoledzi — wymagane zimowe',
      shortText: 'Gołoledź — zimowe',
      className: 'text-sky-700 font-semibold dark:text-sky-400',
    };
  }
  if (day.hasFrostRisk) {
    return {
      text: 'Przymrozek ≤ 0°C — zalecane zimowe',
      shortText: 'Przymrozek ≤ 0°C',
      className: 'text-sky-700 font-semibold dark:text-sky-400',
    };
  }
  if (day.avgTemp < EXPERT_TEMP_THRESHOLD) {
    return {
      text: 'Poniżej 7°C — zalecane zimowe',
      shortText: 'Poniżej 7°C',
      className: 'text-amber-700 font-medium dark:text-amber-400',
    };
  }
  if (day.drivingMinTemp < 5) {
    return {
      text: 'Chłodne dojazdy (< 5°C)',
      shortText: 'Chłodne dojazdy',
      className: 'text-amber-700 font-medium dark:text-amber-400',
    };
  }
  return {
    text: 'Stabilnie powyżej 7°C',
    shortText: 'Powyżej 7°C',
    className: 'text-emerald-700 font-medium dark:text-emerald-400',
  };
}

export function TemperatureChartsSection({
  dailySummaries,
  hourly48,
  drivingWindow,
  theme,
}: TemperatureChartsSectionProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('trend15');
  const [tableFilter, setTableFilter] = useState<TableFilter>('all');

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const historyFill = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.14)';
  const drivingBandFill = isDark ? 'rgba(14, 165, 233, 0.12)' : 'rgba(2, 132, 199, 0.09)';

  const trendChartData = useMemo(
    () =>
      dailySummaries.map((d) => ({
        ...d,
        tempRange: [d.minTemp, d.maxTemp] as [number, number],
      })),
    [dailySummaries]
  );

  const todayLabel = useMemo(
    () => dailySummaries.find((d) => d.segment === 'today')?.shortLabel,
    [dailySummaries]
  );

  const firstHistoryLabel = useMemo(
    () => dailySummaries.find((d) => d.segment === 'history')?.shortLabel,
    [dailySummaries]
  );

  const lastHistoryLabel = useMemo(() => {
    const history = dailySummaries.filter((d) => d.segment === 'history');
    return history.length ? history[history.length - 1].shortLabel : undefined;
  }, [dailySummaries]);

  const trendDomain = useMemo<[number, number]>(() => {
    if (!dailySummaries.length) return [-5, 15];
    const minVal = Math.min(...dailySummaries.map((d) => d.minTemp), 0);
    const maxVal = Math.max(...dailySummaries.map((d) => d.maxTemp), 10);
    return [Math.floor(minVal - 2), Math.ceil(maxVal + 2)];
  }, [dailySummaries]);

  const hourlyRows = useMemo<HourlyChartRow[]>(() => {
    return hourly48.map((h) => {
      const dayPart = h.dateKey.slice(8, 10);
      const monthPart = h.dateKey.slice(5, 7);
      const hourStr = `${String(h.hour).padStart(2, '0')}:00`;
      return {
        ...h,
        tickLabel: h.hour === 0 ? `${dayPart}.${monthPart}` : hourStr,
        fullHourLabel: `${dayPart}.${monthPart} · ${hourStr}`,
        inDrivingWindow: isHourInDrivingWindow(h.hour, drivingWindow),
      };
    });
  }, [hourly48, drivingWindow]);

  const hourlyWindowBands = useMemo(() => {
    if (drivingWindow === 'all_day' || !hourlyRows.length) return [];
    const bands: { x1: string; x2: string }[] = [];
    let start: string | null = null;
    for (let i = 0; i < hourlyRows.length; i++) {
      const row = hourlyRows[i];
      if (row.inDrivingWindow && !start) {
        start = row.fullHourLabel;
      } else if (!row.inDrivingWindow && start) {
        bands.push({ x1: start, x2: hourlyRows[i - 1].fullHourLabel });
        start = null;
      }
    }
    if (start) {
      bands.push({
        x1: start,
        x2: hourlyRows[hourlyRows.length - 1].fullHourLabel,
      });
    }
    return bands;
  }, [hourlyRows, drivingWindow]);

  const hourlyDomain = useMemo<[number, number]>(() => {
    if (!hourlyRows.length) return [-5, 15];
    const minVal = Math.min(...hourlyRows.map((h) => h.temperature), 0);
    const maxVal = Math.max(...hourlyRows.map((h) => h.temperature), 10);
    return [Math.floor(minVal - 2), Math.ceil(maxVal + 2)];
  }, [hourlyRows]);

  const filteredTableRows = useMemo(() => {
    if (tableFilter === 'history') {
      return dailySummaries.filter((d) => d.segment === 'history');
    }
    if (tableFilter === 'forecast') {
      return dailySummaries.filter(
        (d) => d.segment === 'today' || d.segment === 'forecast'
      );
    }
    if (tableFilter === 'risk') {
      return dailySummaries.filter(
        (d) =>
          d.hasSnowRisk ||
          d.hasBlackIceRisk ||
          d.hasFrostRisk ||
          d.hasColdRainRisk ||
          d.avgTemp < EXPERT_TEMP_THRESHOLD
      );
    }
    return dailySummaries;
  }, [dailySummaries, tableFilter]);

  const riskCount = useMemo(
    () =>
      dailySummaries.filter(
        (d) =>
          d.hasSnowRisk ||
          d.hasBlackIceRisk ||
          d.hasFrostRisk ||
          d.hasColdRainRisk ||
          d.avgTemp < EXPERT_TEMP_THRESHOLD
      ).length,
    [dailySummaries]
  );

  const windowMeta = DRIVING_WINDOW_OPTIONS.find((w) => w.id === drivingWindow)!;

  return (
    <section id="wykresy" aria-labelledby="charts-heading" className="space-y-5 sm:space-y-6">
      {/* Main Chart Container */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 dark:border-slate-800">
          <h2
            id="charts-heading"
            className="text-base font-bold tracking-tight text-slate-950 dark:text-white"
          >
            Temperatura (historia i prognoza)
          </h2>

          <div
            role="tablist"
            aria-label="Widok wykresu temperatury"
            className="grid w-full grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:inline-flex sm:w-auto dark:bg-slate-950"
          >
            <button
              type="button"
              role="tab"
              aria-selected={chartMode === 'trend15'}
              onClick={() => setChartMode('trend15')}
              className={`min-h-[36px] rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap truncate transition-colors sm:min-h-0 sm:px-3.5 cursor-pointer ${
                chartMode === 'trend15'
                  ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">Trend 15 dni</span>
              <span className="hidden sm:inline">Trend 15 dni (historia + prognoza)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={chartMode === 'hourly48'}
              onClick={() => setChartMode('hourly48')}
              className={`min-h-[36px] rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap truncate transition-colors sm:min-h-0 sm:px-3.5 cursor-pointer ${
                chartMode === 'hourly48'
                  ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="sm:hidden">48h i opady</span>
              <span className="hidden sm:inline">Szczegół 48h i opady</span>
            </button>
          </div>
        </div>

        {/* Chart legend row (unboxed text) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-100 px-4 py-2.5 text-[11px] text-slate-600 sm:gap-x-5 sm:px-6 sm:text-xs dark:border-slate-800/80 dark:text-slate-400">
          {chartMode === 'trend15' ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 bg-slate-900 dark:bg-slate-100" />
                Średnia
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 bg-sky-600 dark:bg-sky-400" />
                Min. w porze jazdy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-3.5 rounded-xs bg-slate-300/60 dark:bg-slate-600/50" />
                Min–max
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 border-t-2 border-dashed border-amber-500" />
                Próg 7°C
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 border-t-2 border-dotted border-red-500" />
                0°C
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 bg-sky-600 dark:bg-sky-400" />
                Temperatura
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-indigo-500/60" />
                Opady (mm)
              </span>
              {drivingWindow !== 'all_day' && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-3.5 rounded-xs bg-sky-500/20" />
                  Pora jazdy ({windowMeta.shortLabel})
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 border-t-2 border-dashed border-amber-500" />
                7°C
              </span>
            </>
          )}
        </div>

        {/* Chart Viewport */}
        <div className="px-2 py-4 sm:p-6">
          <div className="h-[260px] w-full sm:h-[360px]">
            {chartMode === 'trend15' ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendChartData}
                  margin={{ top: 16, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    minTickGap={20}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: gridColor }}
                  />
                  <YAxis
                    yAxisId="temp"
                    width={38}
                    domain={trendDomain}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickFormatter={(v) => `${v}°`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="precip"
                    orientation="right"
                    domain={[0, 'dataMax + 6']}
                    hide
                  />
                  <Tooltip content={<TrendTooltip />} />

                  {firstHistoryLabel && lastHistoryLabel && (
                    <ReferenceArea
                      yAxisId="temp"
                      x1={firstHistoryLabel}
                      x2={lastHistoryLabel}
                      fill={historyFill}
                      fillOpacity={1}
                      label={{
                        value: 'Historia',
                        position: 'insideTopLeft',
                        fill: axisColor,
                        fontSize: 10,
                      }}
                    />
                  )}

                  {todayLabel && (
                    <ReferenceLine
                      yAxisId="temp"
                      x={todayLabel}
                      stroke={isDark ? '#64748b' : '#475569'}
                      strokeDasharray="4 4"
                      label={{
                        value: 'Dziś',
                        position: 'top',
                        fill: isDark ? '#e2e8f0' : '#0f172a',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  )}

                  <ReferenceLine
                    yAxisId="temp"
                    y={EXPERT_TEMP_THRESHOLD}
                    stroke="#d97706"
                    strokeWidth={1.75}
                    strokeDasharray="6 4"
                    label={{
                      value: '7°C',
                      position: 'insideTopRight',
                      fill: '#d97706',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />

                  <ReferenceLine
                    yAxisId="temp"
                    y={0}
                    stroke="#dc2626"
                    strokeWidth={1.25}
                    strokeDasharray="2 3"
                    label={{
                      value: '0°C',
                      position: 'insideBottomRight',
                      fill: '#dc2626',
                      fontSize: 10,
                    }}
                  />

                  <Bar
                    yAxisId="precip"
                    dataKey="precipitationSum"
                    name="Opady (mm)"
                    fill={isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.25)'}
                    radius={[3, 3, 0, 0]}
                    barSize={12}
                  />

                  <Area
                    yAxisId="temp"
                    type="monotone"
                    dataKey="tempRange"
                    name="Zakres min–max"
                    stroke="none"
                    fill={isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.24)'}
                  />

                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="avgTemp"
                    name="Średnia dobowa"
                    stroke={isDark ? '#f8fafc' : '#0f172a'}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5, fill: isDark ? '#0f172a' : '#ffffff' }}
                    activeDot={{ r: 5 }}
                  />

                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="drivingMinTemp"
                    name="Min. w porze jazdy"
                    stroke={isDark ? '#38bdf8' : '#0284c7'}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: isDark ? '#38bdf8' : '#0284c7' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={hourlyRows}
                  margin={{ top: 16, right: 6, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="fullHourLabel"
                    minTickGap={28}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickFormatter={(val: string) => {
                      const parts = val.split(' · ');
                      return parts[1] === '00:00' ? parts[0] : parts[1] ?? val;
                    }}
                    tickLine={false}
                    axisLine={{ stroke: gridColor }}
                  />
                  <YAxis
                    yAxisId="temp"
                    width={38}
                    domain={hourlyDomain}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickFormatter={(v) => `${v}°`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="precip"
                    orientation="right"
                    domain={[0, 'dataMax + 3']}
                    tick={{ fill: axisColor, fontSize: 10 }}
                    tickFormatter={(v) => `${v}mm`}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip content={<HourlyTooltip />} />

                  {hourlyWindowBands.map((band) => (
                    <ReferenceArea
                      key={`${band.x1}-${band.x2}`}
                      yAxisId="temp"
                      x1={band.x1}
                      x2={band.x2}
                      fill={drivingBandFill}
                      fillOpacity={1}
                    />
                  ))}

                  <ReferenceLine
                    yAxisId="temp"
                    y={EXPERT_TEMP_THRESHOLD}
                    stroke="#d97706"
                    strokeWidth={1.75}
                    strokeDasharray="6 4"
                    label={{
                      value: '7°C',
                      position: 'insideTopRight',
                      fill: '#d97706',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <ReferenceLine
                    yAxisId="temp"
                    y={0}
                    stroke="#dc2626"
                    strokeWidth={1.25}
                    strokeDasharray="2 3"
                  />

                  <Bar
                    yAxisId="precip"
                    dataKey="precipitation"
                    name="Opady (mm)"
                    fill={isDark ? 'rgba(129, 140, 248, 0.55)' : 'rgba(99, 102, 241, 0.45)'}
                    radius={[2, 2, 0, 0]}
                    barSize={6}
                  />

                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temperature"
                    name="Temperatura"
                    stroke={isDark ? '#38bdf8' : '#0284c7'}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Daily Data Breakdown: Compact list on mobile, dense table on md+ */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
            Zestawienie dzienne
          </h3>

          <div
            role="group"
            aria-label="Filtr tabeli dziennej"
            className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-slate-950"
          >
            {(
              [
                { id: 'all', label: `Wszystkie (${dailySummaries.length})` },
                { id: 'history', label: 'Historia' },
                { id: 'forecast', label: 'Prognoza' },
                { id: 'risk', label: `Ryzyko (${riskCount})` },
              ] as { id: TableFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTableFilter(tab.id)}
                className={`min-h-[34px] rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors sm:min-h-0 sm:px-3 sm:py-1.5 cursor-pointer ${
                  tableFilter === tab.id
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile stacked list view (< md) */}
        <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800/80">
          {filteredTableRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Brak dni spełniających wybrane kryterium.
            </p>
          ) : (
            filteredTableRows.map((day) => {
              const status = getDayStatus(day);
              return (
                <div
                  key={day.dateKey}
                  className={`space-y-1.5 px-4 py-3 ${
                    day.segment === 'today' ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5 text-sm">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {day.weekdayShort}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {day.shortLabel}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        ·{' '}
                        {day.segment === 'history'
                          ? 'Historia'
                          : day.segment === 'today'
                          ? 'Dziś'
                          : 'Prognoza'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 font-mono text-xs tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400">
                        {day.minTemp.toFixed(0)}°/{day.maxTemp.toFixed(0)}°
                      </span>
                      <span className="text-sm font-bold text-slate-950 dark:text-white">
                        {day.avgTemp.toFixed(1)}°C
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      Jazda:{' '}
                      <strong
                        className={
                          day.drivingMinTemp <= 0
                            ? 'text-sky-700 dark:text-sky-400'
                            : day.drivingMinTemp < 7
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }
                      >
                        {day.drivingMinTemp.toFixed(1)}°C
                      </strong>
                      {day.precipitationSum > 0
                        ? ` · ${day.precipitationSum.toFixed(1)} mm`
                        : ''}
                      {day.snowfallSum > 0
                        ? ` · ${day.snowfallSum.toFixed(1)} cm`
                        : ''}
                    </span>

                    <span className={status.className}>{status.shortText}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop dense table view (md+) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <th className="py-3 pl-6 pr-3">Data</th>
                <th className="px-3 py-3">Okres</th>
                <th className="px-3 py-3 text-right">Min / Max</th>
                <th className="px-3 py-3 text-right">Średnia</th>
                <th className="px-3 py-3 text-right">Min. w porze jazdy</th>
                <th className="px-3 py-3 text-right">Opady / Śnieg</th>
                <th className="py-3 pl-3 pr-6">Ocena warunków</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Brak dni spełniających wybrane kryterium filtrowania.
                  </td>
                </tr>
              ) : (
                filteredTableRows.map((day) => {
                  const status = getDayStatus(day);
                  return (
                    <tr
                      key={day.dateKey}
                      className={`transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40 ${
                        day.segment === 'today'
                          ? 'bg-sky-50/40 dark:bg-sky-950/20'
                          : ''
                      }`}
                    >
                      <td className="whitespace-nowrap py-2.5 pl-6 pr-3 font-medium text-slate-900 dark:text-slate-100">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mr-2">
                          {day.weekdayShort}
                        </span>
                        {day.shortLabel}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                        {day.segment === 'history'
                          ? 'Historia'
                          : day.segment === 'today'
                          ? 'Dziś'
                          : 'Prognoza'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                        {day.minTemp.toFixed(1)}° / {day.maxTemp.toFixed(1)}°
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs font-semibold tabular-nums text-slate-950 dark:text-white">
                        {day.avgTemp.toFixed(1)}°C
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs font-semibold tabular-nums ${
                          day.drivingMinTemp <= 0
                            ? 'text-sky-700 dark:text-sky-400'
                            : day.drivingMinTemp < 7
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {day.drivingMinTemp.toFixed(1)}°C
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                        {day.precipitationSum.toFixed(1)} mm
                        {day.snowfallSum > 0 ? ` · ${day.snowfallSum.toFixed(1)} cm` : ''}
                      </td>
                      <td className={`whitespace-nowrap py-2.5 pl-3 pr-6 text-xs ${status.className}`}>
                        {status.text}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
