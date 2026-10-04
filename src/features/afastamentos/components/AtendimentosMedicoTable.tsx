import {
  DataTable,
  type DataTableColumn,
} from "@/shared/components/data-table";
import type {
  AfastamentoAvaliacaoResumo,
  AfastamentosTableProps,
} from "../types/afastamentos.types";
import { formatDate } from "../utils/afastamentos.utils";

const columns: DataTableColumn<
  AfastamentoAvaliacaoResumo,
  "servidorNome" | "servidorMatricula" | "periodo" | "encaminhadoEm"
>[] = [
  {
    key: "servidorNome",
    label: "Servidor",
    getValue: (item) => item.servidorNome,
  },
  {
    key: "servidorMatricula",
    label: "Matrícula",
    getValue: (item) => item.servidorMatricula,
  },
  {
    key: "periodo",
    label: "Período do afastamento",
    getValue: (item) =>
      `${formatDate(item.dataInicio)} até ${formatDate(item.dataFim)}`,
  },
  {
    key: "encaminhadoEm",
    label: "Encaminhado em",
    getValue: (item) => formatDate(item.encaminhadoEm),
  },
];

type AtendimentosMedicoTableProps = Omit<AfastamentosTableProps, "items"> & {
  items: AfastamentoAvaliacaoResumo[];
};

export function AtendimentosMedicoTable({
  items,
  isLoading,
  isError,
  errorMessage,
  onSelect,
}: AtendimentosMedicoTableProps) {
  return (
    <DataTable
      columns={columns}
      defaultSortKey="servidorNome"
      emptyMessage="Nenhuma avaliação pendente."
      errorMessage={errorMessage}
      getRowId={(item) => item.id}
      isError={isError}
      isLoading={isLoading}
      items={items}
      searchPlaceholder="Buscar servidor ou matrícula…"
      urlStateKeyPrefix="atendimentos"
      renderRowAction={(item) => (
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="rounded-md border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:border-emerald-800 hover:bg-emerald-800 active:border-emerald-900 active:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Avaliar
        </button>
      )}
    />
  );
}
