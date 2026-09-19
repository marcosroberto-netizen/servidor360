import { STATUS_LABELS } from "../constants/afastamentos.constants";
import type { AfastamentosFiltersProps } from "../types/afastamentos.types";

export function AfastamentosFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: AfastamentosFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
      <label htmlFor="afastamentos-search" className="sr-only">
        Buscar afastamentos
      </label>
      <input
        id="afastamentos-search"
        name="afastamentosSearch"
        autoComplete="off"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por servidor, matrícula, protocolo ou unidade…"
        className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
      />
      <label htmlFor="afastamentos-status" className="sr-only">
        Filtrar por status
      </label>
      <select
        id="afastamentos-status"
        name="afastamentosStatus"
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(
            event.target.value as AfastamentosFiltersProps["statusFilter"],
          )
        }
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100 lg:w-64"
      >
        <option value="todos">Todos os status</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
