import { Moon, Sun } from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Navbar({ theme, onToggleTheme }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:gap-8 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element wordmark */}
        <a
          href="#werdykt"
          className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 sm:text-lg dark:text-slate-50"
        >
          Kiedy Opony
        </a>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav
          aria-label="Nawigacja główna"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#werdykt"
            className="whitespace-nowrap shrink-0 py-1 underline-offset-4 transition-colors hover:text-slate-950 hover:underline dark:hover:text-white"
          >
            Werdykt
          </a>
          <a
            href="#wykresy"
            className="whitespace-nowrap shrink-0 py-1 underline-offset-4 transition-colors hover:text-slate-950 hover:underline dark:hover:text-white"
          >
            Wykresy
          </a>
          <a
            href="#hamowanie"
            className="whitespace-nowrap shrink-0 py-1 underline-offset-4 transition-colors hover:text-slate-950 hover:underline dark:hover:text-white"
          >
            Hamowanie
          </a>
          <a
            href="#zalecenia"
            className="whitespace-nowrap shrink-0 py-1 underline-offset-4 transition-colors hover:text-slate-950 hover:underline dark:hover:text-white"
          >
            Zalecenia
          </a>
        </nav>

        {/* Zone 3: 1 primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
            className="inline-flex h-10 min-w-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:px-3.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">Tryb jasny</span>
                <span className="sm:hidden text-xs">Jasny</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
                <span className="hidden sm:inline">Tryb ciemny</span>
                <span className="sm:hidden text-xs">Ciemny</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
