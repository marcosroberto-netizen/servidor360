import { useMemo, useState } from "react";
import type { AfastamentoResumo } from "../types/afastamentos.types";
import { formatDate, normalize, statusLabels } from "../utils/afastamentos.utils";

interface AfastamentosTableProps {
  items: AfastamentoResumo[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onSelect: (id: string) => void;
}

type ColumnKey =
  | "servidorNome"
  | "servidorMatricula"
  | "unidadeNome"
  | "protocolo"
  | "tipo"
  | "periodo"
  | "status";

type SortDirection = "asc" | "desc";

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  className?: string;
  getValue: (item: AfastamentoResumo) => string;
}

type ColumnFilters = Partial<Record<ColumnKey, string[]>>;

const pageSizeOptions = [10, 25, 50, 100];

const columns: ColumnDefinition[] = [
  {
    key: "servidorNome",
    label: "Servidor",
    className: "min-w-[220px]",
    getValue: (item) => item.servidorNome,
  },
  {
    key: "servidorMatricula",
    label: "Matricula",
    getValue: (item) => item.servidorMatricula,
  },
  {
    key: "unidadeNome",
    label: "Unidade",
    className: "min-w-[180px]",
    getValue: (item) => item.unidadeNome,
  },
  {
    key: "protocolo",
    label: "Protocolo",
    getValue: (item) => item.protocolo ?? "-",
  },
  {
    key: "tipo",
    label: "Tipo",
    getValue: (item) => item.tipo ?? "-",
  },
  {
    key: "periodo",
    label: "Periodo",
    className: "min-w-[160px]",
    getValue: (item) =>
      `${formatDate(item.dataInicio)} ate ${formatDate(item.dataFim)}`,
  },
  {
    key: "status",
    label: "Status",
    className: "min-w-[190px]",
    getValue: (item) => statusLabels[item.status],
  },
];

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
      {children}
    </div>
  );
}

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d={
          active
            ? "M4 5h16l-6 7v5l-4 2v-7L4 5z"
            : "M4 5h16l-6 7v6l-4 1v-7L4 5z"
        }
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function escapeSpreadsheetValue(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exportToExcel(items: AfastamentoResumo[]) {
  const rows = items.map((item) =>
    columns.map((column) => escapeSpreadsheetValue(column.getValue(item))),
  );
  const table = `
    <table>
      <thead>
        <tr>${columns
          .map((column) => `<th>${escapeSpreadsheetValue(column.label)}</th>`)
          .join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
  const blob = new Blob([`\uFEFF${table}`], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `afastamentos-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function compareValues(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

export function AfastamentosTable({
  items,
  isLoading,
  isError,
  errorMessage,
  onSelect,
}: AfastamentosTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    key: ColumnKey;
    direction: SortDirection;
  }>({ key: "servidorNome", direction: "asc" });
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [openFilter, setOpenFilter] = useState<ColumnKey | null>(null);
  const [filterSearch, setFilterSearch] = useState<
    Partial<Record<ColumnKey, string>>
  >({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredItems = useMemo(() => {
    const term = normalize(search);

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        normalize(columns.map((column) => column.getValue(item)).join(" ")).includes(
          term,
        );

      if (!matchesSearch) return false;

      return columns.every((column) => {
        const selectedValues = columnFilters[column.key] ?? [];
        return (
          selectedValues.length === 0 ||
          selectedValues.includes(column.getValue(item))
        );
      });
    });
  }, [columnFilters, items, search]);

  const sortedItems = useMemo(() => {
    const column = columns.find((item) => item.key === sort.key) ?? columns[0];

    return [...filteredItems].sort((left, right) => {
      const result = compareValues(
        column.getValue(left),
        column.getValue(right),
      );
      return sort.direction === "asc" ? result : -result;
    });
  }, [filteredItems, sort]);

  const filterOptions = useMemo(() => {
    return columns.reduce<Partial<Record<ColumnKey, string[]>>>((acc, column) => {
      acc[column.key] = Array.from(
        new Set(items.map((item) => column.getValue(item))),
      ).sort(compareValues);
      return acc;
    }, {});
  }, [items]);

  const activeFilterCount = Object.values(columnFilters).reduce(
    (total, values) => total + (values?.length ?? 0),
    0,
  );
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = sortedItems.length
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const pageEnd = Math.min(currentPage * pageSize, sortedItems.length);
  const paginatedItems = sortedItems.slice(pageStart - 1, pageEnd);

  const toggleSort = (key: ColumnKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const toggleFilterValue = (key: ColumnKey, value: string) => {
    setColumnFilters((current) => {
      const selectedValues = current[key] ?? [];
      const nextValues = selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      const next = { ...current };

      if (nextValues.length > 0) {
        next[key] = nextValues;
      } else {
        delete next[key];
      }

      return next;
    });
    setPage(1);
  };

  const clearColumnFilter = (key: ColumnKey) => {
    setColumnFilters((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setPage(1);
  };

  return (
    <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 p-3 lg:flex-row lg:items-center">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Pesquisar na grade"
          className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setColumnFilters({});
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Limpar filtros ({activeFilterCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => exportToExcel(sortedItems)}
            disabled={sortedItems.length === 0}
            className="h-9 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-20 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgb(226,232,240)]">
            <tr>
              {columns.map((column) => {
                const selectedCount = columnFilters[column.key]?.length ?? 0;
                const options = filterOptions[column.key] ?? [];
                const optionTerm = normalize(filterSearch[column.key] ?? "");
                const visibleOptions = options.filter(
                  (option) => !optionTerm || normalize(option).includes(optionTerm),
                );

                return (
                  <th
                    key={column.key}
                    className={`relative whitespace-nowrap border-b border-slate-200 px-3 py-2 ${column.className ?? ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="font-semibold text-slate-600 hover:text-slate-950"
                      >
                        {column.label}
                        {sort.key === column.key && (
                          <span className="ml-1">
                            {sort.direction === "asc" ? "A-Z" : "Z-A"}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFilter((current) =>
                            current === column.key ? null : column.key,
                          )
                        }
                        className={`rounded border px-1.5 py-0.5 text-[11px] ${
                          selectedCount > 0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                        aria-label={`Filtrar ${column.label}`}
                        title={`Filtrar ${column.label}`}
                      >
                        <span className="flex items-center gap-1">
                          <FilterIcon active={selectedCount > 0} />
                          {selectedCount > 0 && <span>{selectedCount}</span>}
                        </span>
                      </button>
                    </div>

                    {openFilter === column.key && (
                      <div className="absolute left-3 top-full z-30 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 text-slate-700 shadow-lg">
                        <input
                          value={filterSearch[column.key] ?? ""}
                          onChange={(event) =>
                            setFilterSearch((current) => ({
                              ...current,
                              [column.key]: event.target.value,
                            }))
                          }
                          placeholder="Pesquisar opcoes"
                          className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs font-normal normal-case tracking-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        />
                        <div className="mt-2 max-h-52 overflow-y-auto pr-1">
                          {visibleOptions.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-2 rounded px-1.5 py-1 text-xs font-medium normal-case tracking-normal text-slate-700 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={(columnFilters[column.key] ?? []).includes(option)}
                                onChange={() => toggleFilterValue(column.key, option)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                              />
                              <span className="min-w-0 truncate">{option}</span>
                            </label>
                          ))}
                          {visibleOptions.length === 0 && (
                            <p className="px-1.5 py-2 text-xs font-normal normal-case tracking-normal text-slate-500">
                              Nenhuma opcao encontrada.
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            onClick={() => clearColumnFilter(column.key)}
                            className="text-xs font-semibold normal-case tracking-normal text-slate-600 hover:text-slate-950"
                          >
                            Limpar
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenFilter(null)}
                            className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold normal-case tracking-normal text-white hover:bg-slate-800"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="sticky right-0 z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-right">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border-b border-slate-100 px-3 py-2 text-slate-700"
                  >
                    {column.key === "status" ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                        {column.getValue(item)}
                      </span>
                    ) : (
                      <span className="line-clamp-2">{column.getValue(item)}</span>
                    )}
                  </td>
                ))}
                <td className="sticky right-0 border-b border-slate-100 bg-white px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <p className="p-4 text-sm text-slate-600">Carregando processos...</p>
        )}
        {isError && (
          <p className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage ?? "Nao foi possivel carregar a fila de afastamentos."}
          </p>
        )}
        {!isLoading && sortedItems.length === 0 && (
          <div className="p-4">
            <EmptyState>Nenhum processo encontrado.</EmptyState>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>
          Exibindo {pageStart}-{pageEnd} de {sortedItems.length} registros
          {items.length !== sortedItems.length && ` filtrados de ${items.length}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span>Linhas</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <span>
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className="h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Primeira
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proxima
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ultima
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
