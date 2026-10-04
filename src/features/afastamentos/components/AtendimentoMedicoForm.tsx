import { CalendarClock, Clock3, PenLine, ShieldCheck } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { AtendimentoMedicoFormValues } from "../types/afastamentos.types";
import { RestricoesAtendimentoDialog } from "./RestricoesAtendimentoDialog";

const resultados = [
  { value: "apto", label: "Apto" },
  { value: "afastado", label: "Afastado" },
  { value: "apto_com_restricoes", label: "Apto com restrição" },
  { value: "complementacao", label: "Aguardando complementação" },
] as const;

export function AtendimentoMedicoForm({
  form,
  isProcessing,
  onSubmit,
}: {
  form: UseFormReturn<AtendimentoMedicoFormValues>;
  isProcessing: boolean;
  onSubmit: ComponentProps<"form">["onSubmit"];
}) {
  const resultado = useWatch({ control: form.control, name: "resultado" });
  const restricoes = useWatch({ control: form.control, name: "restricoes" });
  const [restricaoInicio, restricaoFim] = useWatch({
    control: form.control,
    name: ["restricaoInicio", "restricaoFim"],
  });
  const restrictionError =
    form.formState.errors.restricoes?.message ??
    form.formState.errors.restricaoInicio?.message ??
    form.formState.errors.restricaoFim?.message;
  const [editingRestrictions, setEditingRestrictions] = useState(false);
  return (
    <>
      <form
        id="atendimento-medico-form"
        className="space-y-4"
        onSubmit={onSubmit}
      >
        <fieldset disabled={isProcessing} className="space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              Devolutiva
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {resultados.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                    resultado === item.value
                      ? "border-cyan-600 bg-cyan-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    value={item.value}
                    className="mt-1 h-4 w-4 border-slate-300 text-cyan-700 focus-visible:ring-cyan-600"
                    {...form.register("resultado")}
                    onChange={(event) => {
                      void form.register("resultado").onChange(event);
                      if (item.value === "apto_com_restricoes")
                        setEditingRestrictions(true);
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950">
                      {item.label}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {form.formState.errors.resultado && (
              <p className="mt-2 text-sm text-red-700" aria-live="polite">
                {form.formState.errors.resultado.message}
              </p>
            )}
          </fieldset>

          <label className="block text-sm font-semibold text-slate-700">
            Observações do Atendimento
            <textarea
              rows={3}
              autoComplete="off"
              placeholder="Registre achados funcionais, conduta e justificativa…"
              className="mt-2 block w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-950 transition-colors focus-visible:border-cyan-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
              {...form.register("observacoes")}
            />
            {form.formState.errors.observacoes && (
              <span
                className="mt-2 block text-sm text-red-700"
                aria-live="polite"
              >
                {form.formState.errors.observacoes.message}
              </span>
            )}
          </label>

          {resultado === "afastado" && (
            <ConditionalPanel
              icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
              title="Período do Afastamento"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <DateField
                  label="Início"
                  name="afastamentoInicio"
                  register={form.register}
                  error={form.formState.errors.afastamentoInicio?.message}
                />
                <DateField
                  label="Fim"
                  name="afastamentoFim"
                  register={form.register}
                  error={form.formState.errors.afastamentoFim?.message}
                />
              </div>
            </ConditionalPanel>
          )}

          {resultado === "apto_com_restricoes" && (
            <ConditionalPanel
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              title="Restrições"
            >
              <div>
                {restricoes && (
                  <p className="mb-3 line-clamp-2 whitespace-pre-line break-words text-sm text-slate-700">
                    {restricoes}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setEditingRestrictions(true)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-md border border-cyan-300 bg-white px-3 text-sm font-semibold text-cyan-900 hover:bg-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                >
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                  {restricoes ? "Editar restrições" : "Descrever restrições"}
                </button>
                {restrictionError && (
                  <span
                    className="mt-2 block text-sm text-red-700"
                    aria-live="polite"
                  >
                    {restrictionError}
                  </span>
                )}
              </div>
            </ConditionalPanel>
          )}

          {resultado === "complementacao" && (
            <ConditionalPanel
              icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
              title="Complementação Necessária"
            >
              <label className="block text-sm font-semibold text-slate-700">
                Solicitação
                <textarea
                  rows={3}
                  autoComplete="off"
                  placeholder="Informe os documentos, exames ou informações necessárias…"
                  className="mt-2 block w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-950 focus-visible:border-cyan-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
                  {...form.register("complementacao")}
                />
                {form.formState.errors.complementacao && (
                  <span
                    className="mt-2 block text-sm text-red-700"
                    aria-live="polite"
                  >
                    {form.formState.errors.complementacao.message}
                  </span>
                )}
              </label>
            </ConditionalPanel>
          )}
        </fieldset>
      </form>
      {editingRestrictions && (
        <RestricoesAtendimentoDialog
          description={restricoes}
          startDate={restricaoInicio}
          endDate={restricaoFim}
          onClose={() => setEditingRestrictions(false)}
          onSave={({ description, startDate, endDate }) => {
            form.setValue("restricaoInicio", startDate, { shouldDirty: true });
            form.setValue("restricaoFim", endDate, { shouldDirty: true });
            form.setValue("restricoes", description, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setEditingRestrictions(false);
          }}
        />
      )}
    </>
  );
}

function ConditionalPanel({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-cyan-200 bg-cyan-50 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-950">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function DateField({
  label,
  name,
  register,
  error,
}: {
  label: string;
  name: "afastamentoInicio" | "afastamentoFim";
  register: UseFormReturn<AtendimentoMedicoFormValues>["register"];
  error?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type="date"
        autoComplete="off"
        className="mt-2 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 focus-visible:border-cyan-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
        {...register(name)}
      />
      {error && (
        <span className="mt-2 block text-sm text-red-700" aria-live="polite">
          {error}
        </span>
      )}
    </label>
  );
}
