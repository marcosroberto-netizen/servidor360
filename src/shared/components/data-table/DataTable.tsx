import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type {
  DataTableColumnFilters,
  DataTableProps,
  DataTableSortDirection,
} from "./dataTable.types";
import {
  compareDataTableValues,
  exportDataTableToExcel,
  normalizeDataTableValue,
} from "./dataTable.utils";

const defaultPageSizeOptions = [10, 25, 50, 100];
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

function parameterName(prefix: string | undefined, name: string) {
  return prefix ? `${prefix}_${name}` : name;
}

export function DataTable<TItem, TKey extends string = string>({
  columns,
  defaultSortKey,
  emptyMessage = "Nenhum registro encontrado.",
  errorMessage,
  exportFileName,
  getRowId,
  isError,
  isLoading,
  items,
  pageSizeOptions = defaultPageSizeOptions,
  renderRowAction,
  searchPlaceholder = "Pesquisar na grade…",
  urlStateKeyPrefix,
}: DataTableProps<TItem, TKey>) {
  const tableId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const param = useCallback(
    (name: string) => parameterName(urlStateKeyPrefix, name),
    [urlStateKeyPrefix],
  );
  const defaultPageSize = pageSizeOptions[1] ?? pageSizeOptions[0] ?? 25;
  const [search, setSearch] = useState(() => searchParams.get(param("q")) ?? "");
  const [sort, setSort] = useState<{
    key: TKey;
    direction: DataTableSortDirection;
  }>(() => {
    const requestedKey = searchParams.get(param("sort")) as TKey | null;
    const key =
      requestedKey && columns.some((column) => column.key === requestedKey)
        ? requestedKey
        : defaultSortKey;
    const direction =
      searchParams.get(param("dir")) === "desc" ? "desc" : "asc";

    return { key, direction };
  });
  const [columnFilters, setColumnFilters] = useState<
    DataTableColumnFilters<TKey>
  >(() => {
    const filters: DataTableColumnFilters<TKey> = {};

    columns.forEach((column) => {
      const values = searchParams.getAll(param(`filter_${column.key}`));
      if (values.length > 0) filters[column.key] = values;
    });

    return filters;
  });
  const [openFilter, setOpenFilter] = useState<TKey | null>(null);
  const [filterSearch, setFilterSearch] = useState<Partial<Record<TKey, string>>>(
    {},
  );
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get(param("page")));
    return Number.isFinite(value) && value > 0 ? value : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const value = Number(searchParams.get(param("pageSize")));
    return pageSizeOptions.includes(value) ? value : defaultPageSize;
  });

  const filteredItems = useMemo(() => {
    const term = normalizeDataTableValue(search);

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        normalizeDataTableValue(
          columns.map((column) => column.getValue(item)).join(" "),
        ).includes(term);

      if (!matchesSearch) return false;

      return columns.every((column) => {
        if (column.filterable === false) return true;

        const selectedValues = columnFilters[column.key] ?? [];
        return (
          selectedValues.length === 0 ||
          selectedValues.includes(column.getValue(item))
        );
      });
    });
  }, [columnFilters, columns, items, search]);

  const sortedItems = useMemo(() => {
    const column = columns.find((item) => item.key === sort.key) ?? columns[0];

    if (!column || column.sortable === false) return filteredItems;

    return [...filteredItems].sort((left, right) => {
      const result = compareDataTableValues(
        column.getValue(left),
        column.getValue(right),
      );
      return sort.direction === "asc" ? result : -result;
    });
  }, [columns, filteredItems, sort]);

  const filterOptions = useMemo(() => {
    return columns.reduce<Partial<Record<TKey, string[]>>>((acc, column) => {
      if (column.filterable === false) return acc;

      acc[column.key] = Array.from(
        new Set(items.map((item) => column.getValue(item))),
      ).sort(compareDataTableValues);
      return acc;
    }, {});
  }, [columns, items]);

  const activeFilterCount = (
    Object.values(columnFilters) as Array<string[] | undefined>
  ).reduce(
    (total: number, values) => total + (values?.length ?? 0),
    0,
  );
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = sortedItems.length
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const pageEnd = Math.min(currentPage * pageSize, sortedItems.length);
  const paginatedItems = sortedItems.slice(pageStart - 1, pageEnd);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    [
      "q",
      "sort",
      "dir",
      "page",
      "pageSize",
      ...columns.map((column) => `filter_${column.key}`),
    ].forEach((name) => next.delete(param(name)));

    if (search.trim()) next.set(param("q"), search.trim());
    if (sort.key !== defaultSortKey) next.set(param("sort"), sort.key);
    if (sort.direction !== "asc") next.set(param("dir"), sort.direction);
    if (page !== 1) next.set(param("page"), String(page));
    if (pageSize !== defaultPageSize) next.set(param("pageSize"), String(pageSize));

    columns.forEach((column) => {
      (columnFilters[column.key] ?? []).forEach((value) => {
        next.append(param(`filter_${column.key}`), value);
      });
    });

    setSearchParams(next, { replace: true });
  }, [
    columnFilters,
    columns,
    defaultPageSize,
    defaultSortKey,
    page,
    pageSize,
    param,
    search,
    searchParams,
    setSearchParams,
    sort,
  ]);

  const toggleSort = (key: TKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const toggleFilterValue = (key: TKey, value: string) => {
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

  const clearColumnFilter = (key: TKey) => {
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
        <label htmlFor={`${tableId}-search`} className="sr-only">
          Pesquisar na grade
        </label>
        <input
          id={`${tableId}-search`}
          name="dataTableSearch"
          autoComplete="off"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
        />
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setColumnFilters({});
                setPage(1);
              }}
              className={`h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 ${focusRing}`}
            >
              Limpar filtros ({activeFilterCount})
            </button>
          )}
          {exportFileName && (
            <button
              type="button"
              onClick={() =>
                exportDataTableToExcel(sortedItems, columns, exportFileName)
              }
              disabled={sortedItems.length === 0}
              className={`inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Exportar Excel
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-20 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgb(226,232,240)]">
            <tr>
              {columns.map((column) => {
                const selectedCount = columnFilters[column.key]?.length ?? 0;
                const options = filterOptions[column.key] ?? [];
                const optionTerm = normalizeDataTableValue(
                  filterSearch[column.key] ?? "",
                );
                const visibleOptions = options.filter(
                  (option) =>
                    !optionTerm ||
                    normalizeDataTableValue(option).includes(optionTerm),
                );
                const isSortable = column.sortable !== false;
                const isFilterable = column.filterable !== false;

                return (
                  <th
                    key={column.key}
                    aria-sort={
                      sort.key === column.key
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={`relative whitespace-nowrap border-b border-slate-200 px-3 py-2 ${column.className ?? ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isSortable) toggleSort(column.key);
                        }}
                        disabled={!isSortable}
                        className={`rounded-sm font-semibold text-slate-600 hover:text-slate-950 disabled:cursor-default disabled:hover:text-slate-600 ${focusRing}`}
                      >
                        {column.label}
                        {sort.key === column.key && isSortable && (
                          <span className="ml-1">
                            {sort.direction === "asc" ? "A-Z" : "Z-A"}
                          </span>
                        )}
                      </button>
                      {isFilterable && (
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
                          } ${focusRing}`}
                          aria-controls={`${tableId}-filter-panel-${column.key}`}
                          aria-expanded={openFilter === column.key}
                          aria-label={`Filtrar ${column.label}`}
                          title={`Filtrar ${column.label}`}
                        >
                          <span className="flex items-center gap-1">
                            <Filter
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                              fill={selectedCount > 0 ? "currentColor" : "none"}
                            />
                            {selectedCount > 0 && <span>{selectedCount}</span>}
                          </span>
                        </button>
                      )}
                    </div>

                    {isFilterable && openFilter === column.key && (
                      <div
                        id={`${tableId}-filter-panel-${column.key}`}
                        className="absolute left-3 top-full z-30 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 text-slate-700 shadow-lg"
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setOpenFilter(null);
                        }}
                      >
                        <label
                          htmlFor={`${tableId}-filter-search-${column.key}`}
                          className="sr-only"
                        >
                          Pesquisar opções de {column.label}
                        </label>
                        <input
                          id={`${tableId}-filter-search-${column.key}`}
                          name={`filterSearch_${column.key}`}
                          autoComplete="off"
                          value={filterSearch[column.key] ?? ""}
                          onChange={(event) =>
                            setFilterSearch((current) => ({
                              ...current,
                              [column.key]: event.target.value,
                            }))
                          }
                          placeholder="Pesquisar opções…"
                          className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs font-normal normal-case tracking-normal focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
                        />
                        <div className="mt-2 max-h-52 overflow-y-auto pr-1">
                          {visibleOptions.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-2 rounded px-1.5 py-1 text-xs font-medium normal-case tracking-normal text-slate-700 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                name={`filter_${column.key}`}
                                checked={(columnFilters[column.key] ?? []).includes(option)}
                                onChange={() => toggleFilterValue(column.key, option)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                              />
                              <span className="min-w-0 truncate">{option}</span>
                            </label>
                          ))}
                          {visibleOptions.length === 0 && (
                            <p className="px-1.5 py-2 text-xs font-normal normal-case tracking-normal text-slate-500">
                              Nenhuma opção encontrada.
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            onClick={() => clearColumnFilter(column.key)}
                            className={`rounded-sm text-xs font-semibold normal-case tracking-normal text-slate-600 hover:text-slate-950 ${focusRing}`}
                          >
                            Limpar
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenFilter(null)}
                            className={`rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold normal-case tracking-normal text-white hover:bg-slate-800 ${focusRing}`}
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
              {renderRowAction && (
                <th className="sticky right-0 z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-right">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedItems.map((item) => (
              <tr key={getRowId(item)} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border-b border-slate-100 px-3 py-2 text-slate-700"
                  >
                    {column.render ? (
                      column.render(item)
                    ) : (
                      <span className="line-clamp-2">{column.getValue(item)}</span>
                    )}
                  </td>
                ))}
                {renderRowAction && (
                  <td className="sticky right-0 border-b border-slate-100 bg-white px-3 py-2 text-right">
                    {renderRowAction(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <p className="p-4 text-sm text-slate-600">Carregando registros…</p>
        )}
        {isError && (
          <p className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage ?? "Não foi possível carregar os registros."}
          </p>
        )}
        {!isLoading && sortedItems.length === 0 && (
          <div className="p-4">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {emptyMessage}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
        <p className="tabular-nums">
          Exibindo {pageStart}-{pageEnd} de {sortedItems.length} registros
          {items.length !== sortedItems.length && ` filtrados de ${items.length}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span>Linhas</span>
            <select
              name="linhasPorPagina"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <span className="tabular-nums">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className={`h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              Primeira
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              Próxima
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`h-8 rounded-md border border-slate-300 px-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              Última
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
