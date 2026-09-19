import type { AfastamentosSummaryProps } from "../types/afastamentos.types";

export function AfastamentosSummary({ counters }: AfastamentosSummaryProps) {
  return (
    <section className="grid shrink-0 gap-2 md:grid-cols-4">
      {[
        ["Total", counters.total],
        ["Aguardando análise", counters.analise],
        ["Complementação", counters.complementacao],
        ["Aguardando RH", counters.rh],
      ].map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{value}</p>
        </div>
      ))}
    </section>
  );
}
