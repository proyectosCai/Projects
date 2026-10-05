import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from './supabase'

const claveEvaluador = (eventoId) => `evaluador:${eventoId}`

export function leerEvaluador(eventoId) {
  try { return localStorage.getItem(claveEvaluador(eventoId)) } catch { return null }
}
export function guardarEvaluador(eventoId, evaluadorId) {
  try {
    if (evaluadorId) localStorage.setItem(claveEvaluador(eventoId), evaluadorId)
    else localStorage.removeItem(claveEvaluador(eventoId))
  } catch { /* navegador sin almacenamiento */ }
}

/** Carga evento activo, evaluadores, fichas+proyectos y las calificaciones del jurado elegido */
export function useEventoJurado(eventoId, evaluadorId) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const [ev, evs, fs] = await Promise.all([
      supabase.from('eventos').select('*').eq('id', eventoId).maybeSingle(),
      supabase.from('evaluadores').select('id, nombre').eq('evento_id', eventoId).order('nombre'),
      supabase.from('fichas').select('*, proyectos(*)').eq('evento_id', eventoId).order('orden').order('numero'),
    ])
    const err = ev.error || evs.error || fs.error
    if (err) return setError(mensajeError(err))
    if (!ev.data) return setError('Este evento no existe o ya no está activo.')

    let mias = {}
    if (evaluadorId) {
      const { data, error } = await supabase.rpc('mis_calificaciones', { p_evento: eventoId, p_evaluador: evaluadorId })
      if (error) return setError(mensajeError(error))
      mias = Object.fromEntries((data ?? []).map((c) => [c.proyecto_id, c]))
    }

    setError('')
    setDatos({
      evento: ev.data,
      evaluadores: evs.data,
      fichas: fs.data.map((f) => ({ ...f, proyectos: [...f.proyectos].sort((a, b) => a.orden - b.orden) })),
      mias,
    })
  }, [eventoId, evaluadorId])

  useEffect(() => { cargar() }, [cargar])

  return { datos, error, recargar: cargar }
}
