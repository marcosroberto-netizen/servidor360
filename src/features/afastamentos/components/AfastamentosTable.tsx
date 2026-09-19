import {
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileClock,
  SearchCheck,
  Send,
  TriangleAlert,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "../constants/afastamentos.constants";
import type {
  AfastamentosColumnKey,
  AfastamentoResumo,
  AfastamentoStatus,
  AfastamentoStatusBadgeProps,
  AfastamentosTableProps,
} from "../types/afastamentos.types";
import { formatDate } from "../utils/afastamentos.utils";

const columns: DataTableColumn<AfastamentoResumo, AfastamentosColumnKey>[] = [
  {
    key: "servidorNome",
    label: "Servidor",
    className: "min-w-[220px]",
    getValue: (item) => item.servidorNome,
  },
  {
    key: "servidorMatricula",
    label: "Matrícula",
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
    label: "Período",
    className: "min-w-[160px]",
    getValue: (item) =>
      `${formatDate(item.dataInicio)} até ${formatDate(item.dataFim)}`,
  },
  {
    key: "status",
    label: "Status",
    className: "min-w-[190px]",
    getValue: (item) => STATUS_LABELS[item.status],
    render: (item) => <StatusBadge status={item.status} />,
  },
];

const statusIcons: Record<AfastamentoStatus, typeof CircleDashed> = {
  rascunho: CircleDashed,
  registrado: ClipboardCheck,
  encaminhado: Send,
  aguardando_analise: Clock3,
  em_analise: SearchCheck,
  aguardando_complementacao: TriangleAlert,
  aguardando_avaliacao: ClipboardList,
  avaliado: BadgeCheck,
  aguardando_rh: FileClock,
  concluido: CheckCircle2,
};

export function AfastamentosTable({
  items,
  isLoading,
  isError,
  errorMessage,
  onSelect,
}: AfastamentosTableProps) {
  return (
    <DataTable
      columns={columns}
      defaultSortKey="servidorNome"
      emptyMessage="Nenhum processo encontrado."
      errorMessage={
        errorMessage ?? "Não foi possível carregar a fila de afastamentos."
      }
      exportFileName={`afastamentos-${new Date().toISOString().slice(0, 10)}.xls`}
      getRowId={(item) => item.id}
      isError={isError}
      isLoading={isLoading}
      items={items}
      renderRowAction={(item) => (
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          Abrir
        </button>
      )}
    />
  );
}

function StatusBadge({ status }: AfastamentoStatusBadgeProps) {
  const Icon = statusIcons[status];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${STATUS_BADGE_CLASSES[status]}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
