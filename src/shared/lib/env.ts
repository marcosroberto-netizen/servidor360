import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('URL do Supabase inválida'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Chave anônima do Supabase é obrigatória'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_SENTRY_DSN: z.string().optional(),
})

export const env = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
})
