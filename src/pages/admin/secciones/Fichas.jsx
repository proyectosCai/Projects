import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { color, degradado } from '../../../lib/colores'

export default function Fichas({ evento }) {
  const [fichas, setFichas] = useState(null)
  const [numero, setNumero] = useState('')
  const [programa, setPrograma] = useState('')
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('fichas')
      .select('*, proyectos(*)').eq('evento_id', evento.id)
      .order('orden').order('numero')
    if (error) setError(mensajeError(error))
    setFichas((data ?? []).map((f) => ({ ...f, proyectos: [...f.proyectos].sort((a, b) => a.orden - b.orden) })))
  }, [evento.id])
  useEffect(() => { cargar() }, [cargar])

  const agregarFicha = async (ev) => {
    ev.preventDefault()
    setError('')
    const { error } = await supabase.from('fichas')
      .insert({ evento_id: evento.id, numero: numero.trim(), programa: programa.trim() || null, orden: fichas.length })
    if (error) return setError(mensajeError(error))
    setNumero(''); setPrograma(''); cargar()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={agregarFicha} className="tarjeta grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
        <div>
          <label className="etiqueta">N° de ficha</label>
          <input className="input" placeholder="Ej: 2758941" value={numero} onChange={(e) => setNumero(e.target.value)} required />
        </div>
        <div>
          <label className="etiqueta">Programa (opcional)</label>
          <input className="input" placeholder="Ej: Técnico en Programación de Software" value={programa} onChange={(e) => setPrograma(e.target.value)} />
        </div>
        <button className="btn-primario">Agregar ficha</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {fichas === null && <p className="text-gray-500">Cargando…</p>}
      {fichas?.length === 0 && <p className="text-gray-500">Agrega la primera ficha.</p>}
      {fichas?.map((f, i) => <TarjetaFicha key={f.id} ficha={f} indice={i} recargar={cargar} />)}
    </div>
  )
}

function TarjetaFicha({ ficha, indice, recargar }) {
  const c = color(indice)
  const [nuevos, setNuevos] = useState('')
  const [error, setError] = useState('')

  const agregarProyectos = async () => {
    const nombres = nuevos.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!nombres.length) return
    const base = ficha.proyectos.length
    const { error } = await supabase.from('proyectos')
      .insert(nombres.map((nombre, i) => ({ ficha_id: ficha.id, nombre, orden: base + i })))
    if (error) return setError(mensajeError(error))
    setNuevos(''); recargar()
  }

  const eliminarFicha = async () => {
    if (!confirm(`¿Eliminar la ficha ${ficha.numero} con sus proyectos y calificaciones?`)) return
    const { error } = await supabase.from('fichas').delete().eq('id', ficha.id)
    if (error) return setError(mensajeError(error))
    recargar()
  }

  const actualizarProyecto = async (p, cambios) => {
    const { error } = await supabase.from('proyectos').update(cambios).eq('id', p.id)
    if (error) setError(mensajeError(error))
  }

  const eliminarProyecto = async (p) => {
    if (!confirm(`¿Eliminar el proyecto "${p.nombre}" y sus calificaciones?`)) return
    const { error } = await supabase.from('proyectos').delete().eq('id', p.id)
    if (error) return setError(mensajeError(error))
    recargar()
  }

  return (
    <div className="tarjeta space-y-3 overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 p-4 text-white" style={{ background: degradado(c) }}>
        <div>
          <p className="text-lg font-bold">Ficha {ficha.numero}</p>
          {ficha.programa && <p className="text-sm opacity-90">{ficha.programa}</p>}
        </div>
        <button className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/30" onClick={eliminarFicha}>Eliminar ficha</button>
      </div>
      <div className="space-y-3 px-5 pb-5">

      {ficha.proyectos.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {ficha.proyectos.map((p, i) => (
            <li key={p.id} className="grid gap-2 p-2 sm:grid-cols-[24px_1fr_1fr_auto] sm:items-center">
              <span className="text-sm font-semibold text-gray-400">{i + 1}</span>
              <input className="input" defaultValue={p.nombre} title="Nombre del proyecto"
                onBlur={(e) => e.target.value.trim() && e.target.value !== p.nombre && actualizarProyecto(p, { nombre: e.target.value.trim() })} />
              <input className="input" defaultValue={p.integrantes ?? ''} placeholder="Integrantes (opcional)"
                onBlur={(e) => e.target.value !== (p.integrantes ?? '') && actualizarProyecto(p, { integrantes: e.target.value.trim() || null })} />
              <button className="btn-peligro px-2" title="Eliminar proyecto" onClick={() => eliminarProyecto(p)}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <label className="etiqueta">Agregar proyectos (uno por línea)</label>
        <textarea className="input min-h-[70px]" value={nuevos} onChange={(e) => setNuevos(e.target.value)}
          placeholder={'Sistema de inventario para tienda de barrio\nApp de citas médicas'} />
        <button className="btn-secundario" onClick={agregarProyectos}>+ Agregar</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
