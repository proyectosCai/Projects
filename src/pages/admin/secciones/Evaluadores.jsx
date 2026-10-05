import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'

export default function Evaluadores({ evento }) {
  const [lista, setLista] = useState(null)
  const [nuevos, setNuevos] = useState('')
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('evaluadores').select('*').eq('evento_id', evento.id).order('nombre')
    if (error) setError(mensajeError(error))
    setLista(data ?? [])
  }, [evento.id])
  useEffect(() => { cargar() }, [cargar])

  const agregar = async () => {
    const nombres = nuevos.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!nombres.length) return
    const { error } = await supabase.from('evaluadores').insert(nombres.map((nombre) => ({ evento_id: evento.id, nombre })))
    if (error) return setError(mensajeError(error))
    setNuevos(''); cargar()
  }

  const eliminar = async (ev) => {
    if (!confirm(`¿Eliminar a ${ev.nombre}? También se borran sus calificaciones.`)) return
    const { error } = await supabase.from('evaluadores').delete().eq('id', ev.id)
    if (error) return setError(mensajeError(error))
    cargar()
  }

  return (
    <div className="tarjeta max-w-xl space-y-4">
      {lista === null && <p className="text-gray-500">Cargando…</p>}
      {lista?.length === 0 && <p className="text-gray-500">Aún no hay evaluadores.</p>}
      <ul className="divide-y divide-gray-100">
        {lista?.map((ev) => (
          <li key={ev.id} className="flex items-center justify-between py-2">
            <span>{ev.nombre}</span>
            <button className="btn-peligro px-2" onClick={() => eliminar(ev)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <label className="etiqueta">Agregar evaluadores (uno por línea)</label>
        <textarea className="input min-h-[80px]" value={nuevos} onChange={(e) => setNuevos(e.target.value)} />
        <button className="btn-secundario" onClick={agregar}>+ Agregar</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
