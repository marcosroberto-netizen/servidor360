import { useMemo, useState } from "react";
import {
  Check,
  ClipboardList,
  MapPin,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import type { AvaliadorSelectionDrawerProps } from "../types/afastamentos.types";

const avaliadorTipoLabels = {
  medico: "Médico",
  perito: "Perito",
  profissional_autorizado: "Profissional autorizado",
} as const;

export function AvaliadorSelectionDrawer({
  avaliadores,
  selectedAvaliadorId,
  currentAvaliadorId,
  isLoading,
  onClose,
  onConfirm,
}: AvaliadorSelectionDrawerProps) {
  const [search, setSearch] = useState("");
  const [draftAvaliadorId, setDraftAvaliadorId] = useState(selectedAvaliadorId);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const visibleAvaliadores = useMemo(() => {
    if (!normalizedSearch) return avaliadores;

    return avaliadores.filter((avaliador) =>
      [
        avaliador.nome,
        avaliador.registroProfissional,
        avaliador.especialidade,
        avaliador.unidade,
      ].some((value) =>
        value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
      ),
    );
  }, [avaliadores, normalizedSearch]);

  return (
    <div
      className="fixed inset-0 z-60 flex justify-end bg-slate-950/35"
      role="dialog"
      aria-modal="true"
      aria-labelledby="medico-drawer-title"
    >
      <div className="flex h-full w-full max-w-lg flex-col overflow-hidden overscroll-contain bg-white shadow-strong">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-violet-700">
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
              <h3 id="medico-drawer-title" className="text-base font-bold text-slate-950">
                Selecionar profissional avaliador
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Ordenado automaticamente pela menor fila de avaliações.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
            aria-label="Fechar seleção de médico"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="shrink-0 border-b border-slate-200 p-4">
          <label htmlFor="buscar-avaliador" className="sr-only">
            Buscar avaliador
          </label>
          <div className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-100">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="buscar-avaliador"
              name="buscarAvaliador"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, registro, especialidade ou unidade…"
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              Carregando médicos…
            </div>
          ) : visibleAvaliadores.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center">
              <Stethoscope className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Nenhum avaliador encontrado
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Revise a busca ou o cadastro de profissionais disponíveis.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {visibleAvaliadores.map((avaliador, index) => {
                const selected = draftAvaliadorId === avaliador.avaliadorId;
                const isCurrent = currentAvaliadorId === avaliador.avaliadorId;

                return (
                  <button
                    key={avaliador.avaliadorId}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => setDraftAvaliadorId(avaliador.avaliadorId)}
                    className={`touch-manipulation rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${
                      isCurrent
                        ? "cursor-not-allowed border-amber-200 bg-amber-50 opacity-75"
                        : selected
                        ? "border-violet-400 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                          selected
                            ? "bg-violet-700 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selected ? (
                          <Check className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Stethoscope className="h-5 w-5" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="wrap-break-word text-sm font-semibold text-slate-950">
                            {avaliador.nome}
                          </span>
                          {isCurrent ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                              Responsável atual
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold tabular-nums text-slate-700">
                            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                            {avaliador.pacientesPendentes} na fila
                          </span>
                        </span>
                        <span className="mt-1 block text-xs font-medium text-slate-600">
                          {avaliadorTipoLabels[avaliador.tipo]} · {avaliador.registroProfissional ?? "Registro não informado"}
                          {avaliador.especialidade ? ` · ${avaliador.especialidade}` : ""}
                        </span>
                        {avaliador.unidade ? (
                          <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{avaliador.unidade}</span>
                          </span>
                        ) : null}
                        {index === 0 ? (
                          <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Menor fila
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!draftAvaliadorId}
            onClick={() => draftAvaliadorId && onConfirm(draftAvaliadorId)}
            className="h-10 rounded-md bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Confirmar avaliador
          </button>
        </footer>
      </div>
    </div>
  );
}
