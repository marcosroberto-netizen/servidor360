import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ModuleAction {
  label: string
  onClick?: () => void
  to?: string
  variant?: 'primary' | 'secondary'
}

interface ModuleNavItem {
  label: string
  to: string
  active?: boolean
}

interface ModuleLayoutProps {
  moduleName: string
  title: string
  description?: string
  backTo?: string
  backLabel?: string
  navItems?: ModuleNavItem[]
  actions?: ModuleAction[]
  children: ReactNode
}

export function ModuleLayout({
  moduleName,
  title,
  description,
  backTo = '/portal',
  backLabel = 'Voltar',
  navItems = [],
  actions = [],
  children,
}: ModuleLayoutProps) {
  const visibleNavItems = navItems.length > 1 ? navItems : []

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Servidor 360
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold text-slate-950">{moduleName}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={backTo}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              {backLabel}
            </Link>
            {actions.map((action) => {
              const classes =
                action.variant === 'secondary'
                  ? 'rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100'
                  : 'rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800'

              if (action.to) {
                return (
                  <Link key={action.label} to={action.to} className={classes}>
                    {action.label}
                  </Link>
                )
              }

              return (
                <button key={action.label} type="button" onClick={action.onClick} className={classes}>
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>}

          {visibleNavItems.length > 0 && (
            <nav className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {visibleNavItems.map((item) => (
              <Link
                key={item.to}
                  to={item.to}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  item.active
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {item.label}
              </Link>
              ))}
            </nav>
          )}
        </div>
        {children}
      </main>
    </div>
  )
}
