import { useState } from "react";
import { ModuleLayout } from "@/shared/components/ModuleLayout";
import { FeedbackDialog } from "@/shared/components/ui/FeedbackDialog";
import { AtendimentosMedicoTable } from "../components/AtendimentosMedicoTable";
import { AtendimentoMedicoDialog } from "../components/AtendimentoMedicoDialog";
import { useMinhasAvaliacoesAfastamento } from "../hooks/useAfastamentos";
import { getErrorMessage } from "../utils/afastamentos.utils";

export default function AfastamentosMedicoPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queue = useMinhasAvaliacoesAfastamento();

  return (
    <ModuleLayout moduleName="Atendimento Médico" title="Minha Fila">
      <div className="flex h-[calc(100dvh-190px)] min-h-0 flex-col overflow-hidden">
        <p className="shrink-0 text-sm text-slate-600">
          {queue.data?.length ?? 0}{" "}
          {(queue.data?.length ?? 0) === 1
            ? "avaliação pendente"
            : "avaliações pendentes"}
        </p>
        <AtendimentosMedicoTable
          items={queue.data ?? []}
          isLoading={queue.isLoading}
          isError={queue.isError}
          errorMessage={getErrorMessage(queue.error)}
          onSelect={setSelectedId}
        />
      </div>
      {selectedId && (
        <AtendimentoMedicoDialog
          key={selectedId}
          afastamentoId={selectedId}
          onClose={() => setSelectedId(null)}
          onComplete={(message) => {
            setSelectedId(null);
            setSuccessMessage(message);
          }}
        />
      )}
      <FeedbackDialog
        open={Boolean(successMessage)}
        title={successMessage ?? ""}
        variant="success"
        onClose={() => setSuccessMessage(null)}
      />
    </ModuleLayout>
  );
}
