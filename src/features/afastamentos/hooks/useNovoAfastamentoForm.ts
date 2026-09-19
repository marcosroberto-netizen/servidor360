import { useMemo, useState, type SyntheticEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAssinarDocumentoDigital,
  useConfirmarSenhaUsuario,
  useCreateAfastamento,
  useGerarDocumentoDigital,
} from "./useAfastamentos";
import {
  buildAtestadoEnviadoDocumentoInput,
} from "../services/afastamentosService";
import { afastamentosKeys } from "../services/afastamentosKeys";
import type {
  NovoAfastamentoFormFields,
  ServidorOption,
} from "../types/afastamentos.types";
import {
  getErrorMessage,
  normalize,
  today,
  validateDocumentoFile,
} from "../utils/afastamentos.utils";

const initialForm = (): NovoAfastamentoFormFields => ({
  tipo: "Atestado medico",
  dataInicio: today(),
  dataFim: today(),
  motivo: "",
  observacoes: "",
  documentoArquivo: null,
});

export function useNovoAfastamentoForm(
  servidores: ServidorOption[],
  onClose: () => void,
) {
  const [search, setSearch] = useState("");
  const [selectedServidor, setSelectedServidor] =
    useState<ServidorOption | null>(null);
  const [form, setForm] = useState<NovoAfastamentoFormFields>(initialForm);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assinaturaSenha, setAssinaturaSenha] = useState("");
  const [isDocumentoLoading, setIsDocumentoLoading] = useState(false);
  const [isSigningAtestado, setIsSigningAtestado] = useState(false);
  const queryClient = useQueryClient();
  const createAfastamento = useCreateAfastamento();
  const confirmarSenha = useConfirmarSenhaUsuario();
  const gerarDocumento = useGerarDocumentoDigital();
  const assinarDocumento = useAssinarDocumentoDigital(null);

  const filteredServidores = useMemo(() => {
    const term = normalize(search);

    return term
      ? servidores
          .filter((item) =>
            normalize(
              `${item.nome} ${item.matricula} ${item.cpf} ${item.unidadeNome}`,
            ).includes(term),
          )
          .slice(0, 30)
      : servidores.slice(0, 20);
  }, [search, servidores]);

  const updateField = (
    field: keyof NovoAfastamentoFormFields,
    value: string,
  ) => setForm((current) => ({ ...current, [field]: value }));

  const updateDocumento = (value: File | null) => {
    setErrorMessage(null);
    setIsDocumentoLoading(Boolean(value));
    const fileError = validateDocumentoFile(value);

    if (fileError) {
      setErrorMessage(fileError);
      setIsDocumentoLoading(false);
      return;
    }

    window.setTimeout(() => {
      setForm((current) => ({ ...current, documentoArquivo: value }));
      setIsDocumentoLoading(false);
    }, 450);
  };

  const resetAndClose = () => {
    setSearch("");
    setSelectedServidor(null);
    setForm(initialForm());
    setShowSignatureDialog(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setAssinaturaSenha("");
    setIsDocumentoLoading(false);
    setIsSigningAtestado(false);
    onClose();
  };

  const canSubmit =
    Boolean(
      selectedServidor &&
        form.tipo.trim() &&
        form.dataInicio &&
        form.dataFim &&
        form.motivo.trim(),
    ) && !createAfastamento.isPending && !isSigningAtestado;

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!selectedServidor || !canSubmit) return;
    setErrorMessage(null);
    setShowSignatureDialog(true);
  };

  const submitAfastamento = async () => {
    if (!selectedServidor || !canSubmit) return;
    if (!assinaturaSenha.trim()) return;
    setShowSignatureDialog(false);

    try {
      setIsSigningAtestado(true);

      await confirmarSenha.mutateAsync(assinaturaSenha);

      const afastamentoId = await createAfastamento.mutateAsync({
        servidorId: selectedServidor.id,
        vinculoId: selectedServidor.vinculoId,
        ...form,
      });
      const documentoId = await gerarDocumento.mutateAsync(
        await buildAtestadoEnviadoDocumentoInput(
          afastamentoId,
          selectedServidor,
          form,
        ),
      );

      await assinarDocumento.mutateAsync({
        documentoId,
        password: assinaturaSenha,
        perfilAssinante: "solicitante",
      });

      await queryClient.invalidateQueries({ queryKey: afastamentosKeys.listas() });
      await queryClient.invalidateQueries({
        queryKey: afastamentosKeys.detailBase(afastamentoId),
      });
      setSuccessMessage(
        "Afastamento registrado e atestado assinado com sucesso.",
      );
      setAssinaturaSenha("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSigningAtestado(false);
    }
  };

  return {
    canSubmit,
    filteredServidores,
    form,
    errorMessage,
    isDocumentoLoading,
    isPending:
      createAfastamento.isPending ||
      confirmarSenha.isPending ||
      gerarDocumento.isPending ||
      assinarDocumento.isPending ||
      isSigningAtestado,
    search,
    selectedServidor,
    showSignatureDialog,
    successMessage,
    assinaturaSenha,
    closeFeedback: () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    },
    submitAfastamento,
    handleSubmit,
    resetAndClose,
    setShowSignatureDialog,
    setSearch,
    setSelectedServidor,
    setAssinaturaSenha,
    updateDocumento,
    updateField,
  };
}
