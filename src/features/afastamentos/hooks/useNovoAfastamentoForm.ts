import { useMemo, useState, type SyntheticEvent } from "react";
import { useCreateAfastamento } from "./useAfastamentos";
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createAfastamento = useCreateAfastamento();

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
    const fileError = validateDocumentoFile(value);

    if (fileError) {
      setErrorMessage(fileError);
      return;
    }

    setForm((current) => ({ ...current, documentoArquivo: value }));
  };

  const resetAndClose = () => {
    setSearch("");
    setSelectedServidor(null);
    setForm(initialForm());
    setShowConfirmation(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    onClose();
  };

  const canSubmit =
    Boolean(
      selectedServidor &&
        form.tipo.trim() &&
        form.dataInicio &&
        form.dataFim &&
        form.motivo.trim(),
    ) && !createAfastamento.isPending;

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!selectedServidor || !canSubmit) return;
    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    if (!selectedServidor || !canSubmit) return;
    setShowConfirmation(false);

    createAfastamento.mutate(
      { servidorId: selectedServidor.id, ...form },
      {
        onSuccess: () => setSuccessMessage("Afastamento registrado com sucesso."),
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  };

  return {
    canSubmit,
    filteredServidores,
    form,
    errorMessage,
    isPending: createAfastamento.isPending,
    search,
    selectedServidor,
    showConfirmation,
    successMessage,
    closeFeedback: () => {
      setErrorMessage(null);
      setSuccessMessage(null);
    },
    confirmSubmit,
    handleSubmit,
    resetAndClose,
    setShowConfirmation,
    setSearch,
    setSelectedServidor,
    updateDocumento,
    updateField,
  };
}
