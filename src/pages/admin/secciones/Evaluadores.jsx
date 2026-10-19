import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { seccionesDe, leCorresponde } from '../../../lib/rubrica'

export default function Evaluadores({ evento }) {
  const [lista, setLista] = useState(null)
  const [nuevos, setNuevos] = useState('')
  const [error, setError] = useState('')
  const secs = seccionesDe(evento)

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('evaluadores').select('*').eq('evento_id', evento.id).order('nombre')
    if (error) setError(mensajeError(error))
    setLista(data ?? [])
  }, [evento.id])
  useEffect(() => { cargar() }, [cargar])

  const agregar = async () => {
    const nombres = nuevos.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!nombres.length) return
    const { error } = await supabase.from('evaluadores').insert(nombres.map((l) => {
      const [nombre, documento] = l.split(/[;\t]/).map((x) => x?.trim())
      return { evento_id: evento.id, nombre, documento: documento?.replace(/[^0-9A-Za-z]/g, '') || null }
    }))
    if (error) return setError(mensajeError(error))
    setNuevos(''); cargar()
  }

  const eliminar = async (ev) => {
    if (!confirm(`¿Eliminar a ${ev.nombre}? También se borran sus calificaciones.`)) return
    const { error } = await supabase.from('evaluadores').delete().eq('id', ev.id)
    if (error) return setError(mensajeError(error))
    cargar()
  }

  const alternarSeccion = async (ev, sec) => {
    const actuales = ev.secciones?.length ? ev.secciones : secs
    let nuevas = actuales.includes(sec) ? actuales.filter((x) => x !== sec) : [...actuales, sec]
    if (nuevas.length === 0) return setError('Cada evaluador debe tener al menos una sección.')
    nuevas = secs.filter((x) => nuevas.includes(x))
    const valor = nuevas.length === secs.length ? null : nuevas  // todas = null
    setLista((l) => l.map((x) => (x.id === ev.id ? { ...x, secciones: valor } : x)))
    const { error } = await supabase.from('evaluadores').update({ secciones: valor }).eq('id', ev.id)
    if (error) { setError(mensajeError(error)); cargar() } else setError('')
  }

  return (
    <div className="tarjeta max-w-3xl space-y-4">
      {secs.length > 1 && (
        <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
          Marca qué secciones de la rúbrica califica cada jurado. Por ejemplo, un jurado técnico solo con <b>{secs[1]}</b>.
        </p>
      )}
      {lista === null && <p className="text-gray-500">Cargando…</p>}
      {lista?.length === 0 && <p className="text-gray-500">Aún no hay evaluadores.</p>}
      <ul className="divide-y divide-gray-100">
        {lista?.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-center gap-2 py-2">
            <span className="min-w-40 flex-1 font-medium">{ev.nombre}</span>
            {secs.length > 1 && (
              <span className="flex flex-wrap gap-1">
                {secs.map((sec) => {
                  const on = leCorresponde(ev, sec)
                  return (
                    <button key={sec} onClick={() => alternarSeccion(ev, sec)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${on
                        ? 'border-sena bg-sena text-white' : 'border-gray-300 bg-white text-gray-500 hover:border-sena'}`}>
                      {on ? '✓ ' : ''}{sec}
                    </button>
                  )
                })}
              </span>
            )}
            <input className="input mr-2 w-40 text-xs" placeholder="Documento (certificado)" defaultValue={ev.documento ?? ''}
              onBlur={(e) => e.target.value !== (ev.documento ?? '') &&
                supabase.from('evaluadores').update({ documento: e.target.value.replace(/[^0-9A-Za-z]/g, '') || null }).eq('id', ev.id)
                  .then(({ error }) => error && setError(mensajeError(error)))} />
            <button className="btn-peligro px-2" onClick={() => eliminar(ev)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <label className="etiqueta">Agregar evaluadores (uno por línea; opcional: Nombre ; documento)</label>
        <textarea className="input min-h-[80px]" value={nuevos} onChange={(e) => setNuevos(e.target.value)} />
        <button className="btn-secundario" onClick={agregar}>+ Agregar</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
