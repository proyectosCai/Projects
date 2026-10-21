import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { seccionesDe, leCorresponde, tieneAsignacion } from '../../../lib/rubrica'
import { etiquetaGrupo } from '../../../lib/grupos'

export default function Evaluadores({ evento }) {
  const [lista, setLista] = useState(null)
  const [fichas, setFichas] = useState([])
  const [abierto, setAbierto] = useState(null)
  const [nuevos, setNuevos] = useState('')
  const [error, setError] = useState('')
  const secs = seccionesDe(evento)

  const cargar = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      supabase.from('evaluadores').select('*').eq('evento_id', evento.id).order('nombre'),
      supabase.from('fichas').select('id, numero, tipo_grupo, programa, institucion, proyectos(id, nombre, orden)').eq('evento_id', evento.id).order('orden').order('numero'),
    ])
    if (r1.error || r2.error) setError(mensajeError(r1.error || r2.error))
    setLista(r1.data ?? [])
    setFichas((r2.data ?? []).map((f) => ({ ...f, proyectos: [...f.proyectos].sort((a, b) => a.orden - b.orden) })))
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
            <button onClick={() => setAbierto(abierto === ev.id ? null : ev.id)}
              className={`w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium transition ${tieneAsignacion(ev)
                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              📌 {resumen(ev, fichas)} <span className="float-right">{abierto === ev.id ? '▴' : 'Cambiar ▾'}</span>
            </button>
            {abierto === ev.id && (
              <Asignacion ev={ev} fichas={fichas} onGuardar={async (cambios) => {
                setLista((l) => l.map((x) => (x.id === ev.id ? { ...x, ...cambios } : x)))
                const { error } = await supabase.from('evaluadores').update(cambios).eq('id', ev.id)
                if (error) { setError(mensajeError(error)); cargar() } else setError('')
              }} />
            )}
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

function resumen(ev, fichas) {
  if (!tieneAsignacion(ev)) return 'Califica todo el evento'
  const nf = fichas.filter((f) => (ev.fichas ?? []).includes(f.id)).map(etiquetaGrupo)
  const np = fichas.flatMap((f) => f.proyectos).filter((p) => (ev.proyectos ?? []).includes(p.id)).map((p) => p.nombre)
  return 'Asignado a: ' + [...nf, ...np].join(' · ')
}

function Asignacion({ ev, fichas, onGuardar }) {
  const selF = ev.fichas ?? []
  const selP = ev.proyectos ?? []
  const guardar = (f, p) => onGuardar({ fichas: f.length ? f : null, proyectos: p.length ? p : null })

  const alternarFicha = (f) => {
    const on = selF.includes(f.id)
    // al marcar la ficha completa, se quitan sus proyectos sueltos (ya quedan incluidos)
    const p = on ? selP : selP.filter((id) => !f.proyectos.some((x) => x.id === id))
    guardar(on ? selF.filter((x) => x !== f.id) : [...selF, f.id], p)
  }
  const alternarProyecto = (id) => guardar(selF, selP.includes(id) ? selP.filter((x) => x !== id) : [...selP, id])

  return (
    <div className="w-full space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">Marca una ficha completa o solo algunos proyectos (ponencias). Sin nada marcado, el jurado califica todo.</p>
        {tieneAsignacion(ev) && <button className="text-xs font-semibold text-sena-oscuro underline" onClick={() => guardar([], [])}>Todo el evento</button>}
      </div>
      {fichas.length === 0 && <p className="text-xs text-gray-500">Primero crea las fichas y proyectos.</p>}
      {fichas.map((f) => {
        const fichaOn = selF.includes(f.id)
        return (
          <div key={f.id} className="rounded-lg bg-white p-2 ring-1 ring-gray-200">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-sena" checked={fichaOn} onChange={() => alternarFicha(f)} />
              {etiquetaGrupo(f)} <span className="font-normal text-gray-500">· ficha completa ({f.proyectos.length})</span>
            </label>
            {f.proyectos.length > 0 && (
              <div className="mt-1 grid gap-1 pl-6 sm:grid-cols-2">
                {f.proyectos.map((p) => (
                  <label key={p.id} className={`flex items-center gap-2 text-xs ${fichaOn ? 'text-gray-400' : 'cursor-pointer'}`}>
                    <input type="checkbox" className="h-3.5 w-3.5 accent-sena" disabled={fichaOn}
                      checked={fichaOn || selP.includes(p.id)} onChange={() => alternarProyecto(p.id)} />
                    {p.nombre}
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
