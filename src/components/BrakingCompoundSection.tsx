import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BRAKING_SCENARIOS,
  COMPOUND_CURVE_DATA,
  calculateResidualSpeedKmh,
} from '../data/expertData';
import type { SurfaceId } from '../types/weather';

interface BrakingCompoundSectionProps {
  currentTemperature: number;
  theme: 'light' | 'dark';
}

export function BrakingCompoundSection({
  currentTemperature,
  theme,
}: BrakingCompoundSectionProps) {
  const [selectedSurface, setSelectedSurface] = useState<SurfaceId>('wet_snow_0');
  const [speedKmh, setSpeedKmh] = useState<50 | 80>(50);

  const scenario =
    BRAKING_SCENARIOS.find((s) => s.id === selectedSurface) ??
    BRAKING_SCENARIOS[0];

  const distances =
    speedKmh === 50 ? scenario.distances50 : scenario.distances80;

  const maxDist = Math.max(distances.winter, distances.summer);
  const diffMeters = Math.abs(distances.summer - distances.winter);
  const carLengths = (diffMeters / 4.5).toFixed(1);
  const shorterDist = Math.min(distances.winter, distances.summer);
  const longerDist = Math.max(distances.winter, distances.summer);
  const residualSpeed = calculateResidualSpeedKmh(
    speedKmh,
    shorterDist,
    longerDist
  );

  const winterPct = Math.round((distances.winter / maxDist) * 100);
  const summerPct = Math.round((distances.summer / maxDist) * 100);
  const winterIsBetter = distances.winter <= distances.summer;

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  const clampedCurrentTemp = Math.max(
    -15,
    Math.min(30, Math.round(currentTemperature))
  );

  return (
    <section id="hamowanie" aria-labelledby="braking-heading" className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h2
          id="braking-heading"
          className="text-lg font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-white"
        >
          Droga hamowania i zachowanie mieszanki gumowej
        </h2>
        <p className="max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Porównanie skuteczności hamowania opon zimowych i letnich oraz elastyczności gumy względem progu 7°C.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
        {/* Left: Braking distance interactive comparator */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-5">
            {/* Controls row: 2x2 grid on mobile, inline on sm+ */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                role="group"
                aria-label="Wybór warunków nawierzchni"
                className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap"
              >
                {BRAKING_SCENARIOS.map((item) => {
                  const active = item.id === selectedSurface;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedSurface(item.id)}
                      className={`min-h-[40px] rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap truncate transition-colors sm:min-h-0 sm:px-3 cursor-pointer ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.shortLabel}
                    </button>
                  );
                })}
              </div>

              <div
                role="group"
                aria-label="Wybór prędkości początkowej"
                className="grid w-full grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:inline-flex sm:w-auto shrink-0 dark:bg-slate-950"
              >
                {([50, 80] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSpeedKmh(spd)}
                    className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-mono font-medium tabular-nums whitespace-nowrap shrink-0 transition-colors sm:min-h-0 cursor-pointer ${
                      speedKmh === spd
                        ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {spd} km/h
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-950 sm:text-base dark:text-white">
                {scenario.label}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {scenario.surfaceDescription} · {speedKmh} km/h
              </p>
            </div>

            {/* Visual horizontal braking track comparison */}
            <div className="space-y-4 border-y border-slate-100 py-4 sm:py-5 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    Opony zimowe (3PMSF)
                    {winterIsBetter && (
                      <span className="ml-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
                        Krócej
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-slate-950 dark:text-white">
                    {distances.winter.toFixed(1)} m
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-md bg-sky-600 transition-all duration-300 dark:bg-sky-500"
                    style={{ width: `${winterPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    Opony letnie
                    {!winterIsBetter && (
                      <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Krócej
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-slate-950 dark:text-white">
                    {distances.summer.toFixed(1)} m
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${
                      winterIsBetter
                        ? 'bg-red-600 dark:bg-red-500'
                        : 'bg-emerald-600 dark:bg-emerald-500'
                    }`}
                    style={{ width: `${summerPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Key numeric comparison strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <div>
                <p className="text-[11px] text-slate-500 sm:text-xs dark:text-slate-400">
                  Różnica
                </p>
                <p className="mt-1 font-mono text-base font-bold tabular-nums text-slate-950 sm:text-lg dark:text-white">
                  +{diffMeters.toFixed(1)} m
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 sm:text-xs dark:text-slate-400">
                  Długości aut
                </p>
                <p className="mt-1 font-mono text-base font-bold tabular-nums text-slate-950 sm:text-lg dark:text-white">
                  ~{carLengths}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 sm:text-xs dark:text-slate-400">
                  Prędkość resztk.*
                </p>
                <p className="mt-1 font-mono text-base font-bold tabular-nums text-red-600 sm:text-lg dark:text-red-400">
                  ~{residualSpeed} km/h
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {scenario.physicsExplanation}
            </p>
          </div>

          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500 sm:text-xs dark:border-slate-800 dark:text-slate-400">
            *Szacowana prędkość auta na słabszych w danych warunkach oponach w miejscu, gdzie drugie auto już się zatrzymało. {scenario.sourceNote}.
          </p>
        </div>

        {/* Right: Rubber compound elasticity vs temperature curve */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950 sm:text-base dark:text-white">
                Elastyczność mieszanki vs. temperatura
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Względny indeks pracy mieszanki (0–100) z punktem przecięcia ok. 7°C.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 sm:text-xs dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 bg-sky-600 dark:bg-sky-400" />
                Zimowa
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 bg-emerald-600 dark:bg-emerald-400" />
                Letnia
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 border-t-2 border-dashed border-amber-500" />
                Próg 7°C
              </span>
            </div>

            <div className="h-[220px] w-full pt-1 sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={COMPOUND_CURVE_DATA}
                  margin={{ top: 14, right: 12, left: -16, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="temp"
                    type="number"
                    domain={[-15, 30]}
                    ticks={[-15, -5, 0, 7, 15, 25, 30]}
                    tickFormatter={(v) => `${v}°`}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: gridColor }}
                  />
                  <YAxis
                    width={36}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value ?? 0}/100`,
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Temperatura: ${label}°C`}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />

                  <ReferenceLine
                    x={7}
                    stroke="#d97706"
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                    label={{
                      value: '7°C',
                      position: 'top',
                      fill: '#d97706',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />

                  <ReferenceLine
                    x={clampedCurrentTemp}
                    stroke={isDark ? '#f8fafc' : '#0f172a'}
                    strokeWidth={1.5}
                    label={{
                      value: `Teraz ${currentTemperature.toFixed(0)}°`,
                      position: 'insideBottomRight',
                      fill: isDark ? '#e2e8f0' : '#0f172a',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="winterGrip"
                    name="Mieszanka zimowa"
                    stroke={isDark ? '#38bdf8' : '#0284c7'}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="summerGrip"
                    name="Mieszanka letnia"
                    stroke={isDark ? '#34d399' : '#16a34a'}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <p>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                Poniżej 7°C:
              </strong>{' '}
              mieszanka letnia sztywnieje, tracąc mikroprzyczepność na chłodnym i mokrym asfalcie.
            </p>
            <p>
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                Powyżej 15°C:
              </strong>{' '}
              mieszanka zimowa staje się nadmiernie miękka i szybciej się zużywa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
