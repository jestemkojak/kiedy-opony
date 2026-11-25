import { EXPERT_GUIDELINES } from '../data/expertData';

export function ExpertGuidelinesSection() {
  return (
    <section id="zalecenia" aria-labelledby="guidelines-heading" className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h2
          id="guidelines-heading"
          className="text-lg font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-white"
        >
          Zalecenia ekspertów dotyczące bezpiecznej wymiany opon
        </h2>
        <p className="max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Zasady stosowane w algorytmie Kiedy Opony na podstawie rekomendacji Polskiego Związku Przemysłu Oponiarskiego (PZPO), niemieckiego automobilklubu ADAC oraz badań instytutu TÜV SÜD.
        </p>
      </div>

      {/* 2x2 clean editorial grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        {EXPERT_GUIDELINES.map((item) => (
          <article
            key={item.number}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{item.source}</span>
                <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                  {item.keyMetric}
                </span>
              </div>

              <h3 className="text-sm font-bold leading-snug text-slate-950 sm:text-base dark:text-white">
                {item.number}. {item.title}
              </h3>

              <p className="text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
                {item.summary}
              </p>

              <ul className="space-y-2 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                {item.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
                    />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* Quantitative Reference Strip: Tread Depth Scale */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-sm font-bold text-slate-950 dark:text-white">
            Skala bezpiecznej głębokości bieżnika (weryfikacja przed montażem)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Źródło: Kodeks drogowy RP · Zalecenia ADAC i PZPO
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-base font-bold tabular-nums text-red-600 dark:text-red-400">
                1,6 mm
              </span>
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Minimum prawne
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-[20%] rounded-full bg-red-600 dark:bg-red-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Granica dopuszczenia do ruchu (wskaźnik TWI). W deszczu i na śniegu opona jest już skrajnie niebezpieczna.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-base font-bold tabular-nums text-amber-700 dark:text-amber-400">
                3,0 mm
              </span>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Min. letnie
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-[38%] rounded-full bg-amber-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bezpieczna granica dla opon letnich zapewniająca sprawne odprowadzanie wody i ochronę przed aquaplaningiem.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-base font-bold tabular-nums text-sky-700 dark:text-sky-400">
                4,0 mm
              </span>
              <span className="text-xs font-medium text-sky-700 dark:text-sky-400">
                Min. zimowe
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-[50%] rounded-full bg-sky-600 dark:bg-sky-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zalecany przez ADAC i PZPO próg wymiany opon zimowych — poniżej 4 mm lamele tracą skuteczność na śniegu.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                7,5–8,5 mm
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Nowa opona
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-full rounded-full bg-emerald-600 dark:bg-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pełna głębokość fabryczna nowego ogumienia. Dodatkowo sprawdź wiek opony (kod DOT — zalecane do 6–8 lat).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
