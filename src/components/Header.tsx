import { isShabbos } from '../utils/date'

export function Header() {
  const shabbos = isShabbos()

  return (
    <header className="border-b border-keva-navy/10 bg-white/60">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
        <div>
          <h1 className="text-2xl font-bold text-keva-navy">Keva</h1>
          <p className="text-sm text-keva-navy/60">Keva (consistency) with kavana (intention)</p>
        </div>
        {shabbos && (
          <span className="rounded-full bg-keva-gold/20 px-3 py-1 text-sm font-medium text-keva-navy">
            Gut Shabbos
          </span>
        )}
      </div>
    </header>
  )
}
