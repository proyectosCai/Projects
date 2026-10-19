import { supabase } from './supabase'

export const MAX_MB = 20
export const EXTENSIONES = ['pdf', 'doc', 'docx']
const TIPOS = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export function validarArchivo(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!EXTENSIONES.includes(ext)) return 'Solo se permiten archivos PDF o Word (.pdf, .doc, .docx).'
  if (file.size > MAX_MB * 1024 * 1024) return `El archivo pesa más de ${MAX_MB} MB.`
  return ''
}

/** Busca el proyecto por su código de subida */
export async function buscarPorCodigo(codigo) {
  const { data, error } = await supabase.rpc('proyecto_por_codigo', { p_codigo: codigo })
  if (error) throw error
  return data?.[0] ?? null
}

/** Sube el trabajo: pide permiso a la función, sube el archivo y lo registra en el proyecto */
export async function subirTrabajo(codigo, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const { data, error } = await supabase.functions.invoke('trabajo-subida', {
    body: { codigo, nombre_archivo: file.name },
  })
  if (error) {
    let msg = error.message
    try { msg = (await error.context.json()).error ?? msg } catch { /* sin cuerpo */ }
    throw new Error(msg)
  }
  const up = await supabase.storage.from('trabajos')
    .uploadToSignedUrl(data.path, data.token, file, { contentType: TIPOS[ext] })
  if (up.error) throw up.error
  const { error: e2 } = await supabase.rpc('confirmar_trabajo', { p_codigo: codigo, p_path: data.path, p_nombre: file.name })
  if (e2) throw e2
}

/** Abre (PDF) o descarga (Word) el trabajo de un proyecto */
export async function abrirTrabajo(proyecto) {
  const esPdf = proyecto.trabajo_path?.endsWith('.pdf')
  const { data, error } = await supabase.storage.from('trabajos')
    .createSignedUrl(proyecto.trabajo_path, 3600, esPdf ? undefined : { download: proyecto.trabajo_nombre })
  if (error) throw error
  window.open(data.signedUrl, '_blank', 'noopener')
}
