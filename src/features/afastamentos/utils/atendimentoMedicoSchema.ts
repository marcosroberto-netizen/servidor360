import { z } from "zod";
import type { AtendimentoMedicoFormValues } from "../types/afastamentos.types";

export const atendimentoSchema = z
  .object({
    resultado: z
      .enum(["", "apto", "afastado", "apto_com_restricoes", "complementacao"], {
        message: "Selecione uma devolutiva.",
      })
      .refine((value) => value !== "", "Selecione uma devolutiva."),
    observacoes: z
      .string()
      .trim()
      .min(8, "Informe as observações do atendimento."),
    afastamentoInicio: z.string(),
    afastamentoFim: z.string(),
    restricoes: z.string(),
    restricaoInicio: z.string(),
    restricaoFim: z.string(),
    complementacao: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.resultado === "afastado") {
      if (!values.afastamentoInicio) {
        ctx.addIssue({
          code: "custom",
          path: ["afastamentoInicio"],
          message: "Informe o início do afastamento.",
        });
      }
      if (!values.afastamentoFim) {
        ctx.addIssue({
          code: "custom",
          path: ["afastamentoFim"],
          message: "Informe o fim do afastamento.",
        });
      }
      if (
        values.afastamentoInicio &&
        values.afastamentoFim &&
        values.afastamentoFim < values.afastamentoInicio
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["afastamentoFim"],
          message: "A data final deve ser posterior à inicial.",
        });
      }
    }

    if (values.resultado === "apto_com_restricoes") {
      if (values.restricoes.trim().length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["restricoes"],
          message: "Descreva as restrições aplicáveis.",
        });
      }
      if (!values.restricaoInicio) {
        ctx.addIssue({
          code: "custom",
          path: ["restricaoInicio"],
          message: "Informe o início da restrição.",
        });
      }
      if (!values.restricaoFim) {
        ctx.addIssue({
          code: "custom",
          path: ["restricaoFim"],
          message: "Informe o fim da restrição.",
        });
      }
      if (
        values.restricaoInicio &&
        values.restricaoFim &&
        values.restricaoFim < values.restricaoInicio
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["restricaoFim"],
          message: "A data final deve ser posterior à inicial.",
        });
      }
    }

    if (
      values.resultado === "complementacao" &&
      values.complementacao.trim().length < 8
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["complementacao"],
        message: "Informe a complementação necessária.",
      });
    }
  });

export const atendimentoDefaultValues: AtendimentoMedicoFormValues = {
  resultado: "",
  observacoes: "",
  afastamentoInicio: "",
  afastamentoFim: "",
  restricoes: "",
  restricaoInicio: "",
  restricaoFim: "",
  complementacao: "",
};
