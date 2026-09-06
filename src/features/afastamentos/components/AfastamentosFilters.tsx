import { statusLabels } from "../utils/afastamentos.utils";
interface AfastamentosFiltersProps {
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}
export function AfastamentosFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: AfastamentosFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por servidor, matricula, protocolo ou unidade"
        className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
      <select
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm lg:w-64"
      >
        <option value="todos">Todos os status</option>
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
