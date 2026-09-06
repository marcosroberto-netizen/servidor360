import { useNovoAfastamentoForm } from "../hooks/useNovoAfastamentoForm";
import type { NovoAfastamentoModalProps } from "../types/afastamentos.types";
import { FeedbackDialog } from "@/shared/components/ui/FeedbackDialog";
import { AssinaturaAtestadoDialog } from "./AssinaturaAtestadoDialog";
import { NovoAfastamentoForm } from "./NovoAfastamentoForm";
import { NovoAfastamentoServidorList } from "./NovoAfastamentoServidorList";

export function NovoAfastamentoModal({
  open,
  onClose,
  servidores,
  isLoadingServidores,
}: NovoAfastamentoModalProps) {
  const {
    canSubmit,
    filteredServidores,
    form,
    errorMessage,
    isDocumentoLoading,
    isPending,
    search,
    selectedServidor,
    showSignatureDialog,
    successMessage,
    assinaturaSenha,
    closeFeedback,
    handleSubmit,
    resetAndClose,
    setAssinaturaSenha,
    setShowSignatureDialog,
    setSearch,
    setSelectedServidor,
    submitAfastamento,
    updateDocumento,
    updateField,
  } = useNovoAfastamentoForm(servidores, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-strong">
        <AssinaturaAtestadoDialog
          open={showSignatureDialog}
          servidor={selectedServidor}
          senha={assinaturaSenha}
          isLoading={isPending}
          onSenhaChange={setAssinaturaSenha}
          onCancel={() => setShowSignatureDialog(false)}
          onSubmitSigned={() => submitAfastamento(true)}
          onSubmitUnsigned={() => submitAfastamento(false)}
        />
        <FeedbackDialog
          open={isPending}
          title="Enviando atestado"
          description="Registrando o afastamento e enviando o documento."
          variant="loading"
        />
        <FeedbackDialog
          open={Boolean(successMessage)}
          title="Afastamento registrado"
          description={successMessage}
          variant="success"
          actionLabel="Concluir"
          onClose={resetAndClose}
        />
        <FeedbackDialog
          open={Boolean(errorMessage)}
          title="Nao foi possivel enviar"
          description={errorMessage}
          variant="error"
          onClose={closeFeedback}
        />
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Novo afastamento
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedServidor
                ? selectedServidor.nome
                : "Selecione o funcionario para abrir o formulario."}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
            aria-label="Fechar"
          >
            X
          </button>
        </header>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[400px_minmax(0,1fr)]">
          <NovoAfastamentoServidorList
            search={search}
            servidores={filteredServidores}
            selectedServidor={selectedServidor}
            isLoadingServidores={isLoadingServidores}
            onSearchChange={setSearch}
            onSelectServidor={setSelectedServidor}
          />
          <NovoAfastamentoForm
            form={form}
            selectedServidor={selectedServidor}
            canSubmit={canSubmit}
            isPending={isPending}
            isDocumentoLoading={isDocumentoLoading}
            errorMessage={errorMessage}
            onClose={resetAndClose}
            onFieldChange={updateField}
            onDocumentoChange={updateDocumento}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
