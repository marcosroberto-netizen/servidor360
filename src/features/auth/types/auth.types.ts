export interface User {
  id: string
  email: string
  nome_completo?: string
  cpf?: string
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface AuthzPayload {
  usuario: User | null
  perfis: string[]
  permissoes: PermissionString[]
  unidades: string[]
}

export type PermissionString = '*' | `${string}:${string}`
