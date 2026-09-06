import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAfastamento,
  emitirDevolutiva,
  getAfastamentoDetalhe,
  listAfastamentos,
  listDevolutivaAlerts,
  listServidoresForAfastamento,
  registrarAnalise,
  registrarProvidencia,
  responderComplementacao,
} from './afastamentosService'
import { afastamentosKeys } from './afastamentosKeys'
import type {
  AfastamentoFormData,
  EmitirDevolutivaInput,
  RegistrarAnaliseInput,
  RegistrarProvidenciaInput,
  ResponderComplementacaoInput,
} from '../types/afastamentos.types'

export function useServidoresForAfastamento(unidades: string[], restrictedToAllowedUnidades: boolean) {
  return useQuery({
    queryKey: afastamentosKeys.servidores(unidades, restrictedToAllowedUnidades),
    queryFn: () =>
      listServidoresForAfastamento({
        allowedUnidades: unidades,
        restrictedToAllowedUnidades,
      }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useAfastamentos() {
  return useQuery({
    queryKey: afastamentosKeys.list(),
    queryFn: listAfastamentos,
    staleTime: 1000 * 30,
  })
}

export function useAfastamentoDetalhe(id: string | null) {
  return useQuery({
    queryKey: afastamentosKeys.detail(id ?? 'none'),
    queryFn: () => getAfastamentoDetalhe(id ?? ''),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  })
}

export function useCreateAfastamento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AfastamentoFormData) => createAfastamento(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.listas() })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.devolutivas() })
    },
  })
}

export function useRegistrarAnalise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegistrarAnaliseInput) => registrarAnalise(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.listas() })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.detail(variables.afastamentoId) })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.devolutivas() })
    },
  })
}

export function useResponderComplementacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ResponderComplementacaoInput) => responderComplementacao(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.listas() })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.detail(variables.afastamentoId) })
    },
  })
}

export function useEmitirDevolutiva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EmitirDevolutivaInput) => emitirDevolutiva(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.listas() })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.detail(variables.afastamentoId) })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.devolutivas() })
    },
  })
}

export function useRegistrarProvidencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegistrarProvidenciaInput) => registrarProvidencia(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.listas() })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.detail(variables.afastamentoId) })
      queryClient.invalidateQueries({ queryKey: afastamentosKeys.devolutivas() })
    },
  })
}

export function useDevolutivaAlerts(enabled: boolean) {
  return useQuery({
    queryKey: afastamentosKeys.devolutivas(),
    queryFn: listDevolutivaAlerts,
    enabled,
    staleTime: 1000 * 60 * 2,
  })
}
