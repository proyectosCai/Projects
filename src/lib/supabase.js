import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

/** Mensaje de error legible en español */
export function mensajeError(error) {
  if (!error) return ''
  const m = error.message || String(error)
  if (m.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('Failed to fetch')) return 'No hay conexión con el servidor. Revisa tu internet.'
  return m
}
