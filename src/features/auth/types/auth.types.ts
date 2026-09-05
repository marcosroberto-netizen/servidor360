export interface User {
  id: string
  email: string
  nome_completo?: string
  cpf?: string
  perfis?: string[]
  unidades?: string[]
  created_at: string
  updated_at: string
}

export interface Permission {
  resource: string
  action: string
}

export type PermissionString = `${string}:${string}`
