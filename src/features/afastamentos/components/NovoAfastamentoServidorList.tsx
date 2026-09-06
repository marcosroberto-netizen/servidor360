import type { NovoAfastamentoServidorListProps } from "../types/afastamentos.types";
import { EmptyState, FieldLabel } from "./AfastamentoFormPrimitives";

export function NovoAfastamentoServidorList({
  search,
  servidores,
  selectedServidor,
  isLoadingServidores,
  onSearchChange,
  onSelectServidor,
}: NovoAfastamentoServidorListProps) {
  return (
    <aside className="min-h-0 border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
      <FieldLabel>Funcionario</FieldLabel>
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Nome, matricula, CPF ou unidade"
        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
      <div className="mt-3 grid max-h-[42vh] gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-220px)]">
        {isLoadingServidores && (
          <p className="text-sm text-slate-600">Carregando funcionarios...</p>
        )}
        {!isLoadingServidores &&
          servidores.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectServidor(item)}
              className={`rounded-md border p-3 text-left transition-colors ${selectedServidor?.id === item.id ? "border-emerald-600 bg-white ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300"}`}
            >
              <p className="truncate text-sm font-semibold text-slate-950">
                {item.nome}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {item.matricula} - {item.unidadeNome}
              </p>
              <p className="mt-1 truncate text-xs text-slate-600">
                {item.cargo}
              </p>
            </button>
          ))}
        {!isLoadingServidores && servidores.length === 0 && (
          <EmptyState>Nenhum funcionario encontrado.</EmptyState>
        )}
      </div>
    </aside>
  );
}
