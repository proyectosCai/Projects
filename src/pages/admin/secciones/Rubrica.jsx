import { useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { RUBRICA_BASE } from '../../../lib/rubricaBase'
import { preguntasDe, seccionesDe } from '../../../lib/rubrica'
import { color, degradado } from '../../../lib/colores'

export default function Rubrica({ evento, nCalificaciones, recargar }) {
  const [secciones, setSecciones] = useState(seccionesDe(evento))
  const [preguntas, setPreguntas] = useState(preguntasDe(evento))
  const [nuevaSeccion, setNuevaSeccion] = useState('')
  const [min, setMin] = useState(evento.escala_min)
  const [max, setMax] = useState(evento.escala_max)
  const [estado, setEstado] = useState('')

  const cambiar = (i, k, v) => setPreguntas((p) => p.map((q, j) => (j === i ? { ...q, [k]: v } : q)))
  const quitar = (i) => setPreguntas((p) => p.filter((_, j) => j !== i))
  const agregar = (seccion) => setPreguntas((p) => [...p, { texto: '', seccion }])
  // Subir/bajar dentro de la misma sección
  const mover = (i, d) => setPreguntas((p) => {
    const mismas = p.map((q, j) => (q.seccion === p[i].seccion ? j : -1)).filter((j) => j >= 0)
    const pos = mismas.indexOf(i); const otro = mismas[pos + d]
    if (otro === undefined) return p
    const n = [...p]; [n[i], n[otro]] = [n[otro], n[i]]; return n
  })

  const agregarSeccion = () => {
    const s = nuevaSeccion.trim()
    if (!s || secciones.includes(s)) return
    setSecciones((x) => [...x, s]); setNuevaSeccion('')
  }
  const renombrarSeccion = (vieja) => {
    const nueva = prompt('Nuevo nombre de la sección:', vieja)?.trim()
    if (!nueva || nueva === vieja || secciones.includes(nueva)) return
    setSecciones((x) => x.map((s) => (s === vieja ? nueva : s)))
    setPreguntas((p) => p.map((q) => (q.seccion === vieja ? { ...q, seccion: nueva } : q)))
  }
  const quitarSeccion = (s) => {
    if (secciones.length === 1) return
    const n = preguntas.filter((q) => q.seccion === s).length
    if (n > 0 && !confirm(`La sección "${s}" tiene ${n} pregunta(s). ¿Eliminarla junto con sus preguntas?`)) return
    setSecciones((x) => x.filter((y) => y !== s))
    setPreguntas((p) => p.filter((q) => q.seccion !== s))
  }

  const guardar = async () => {
    const limpias = secciones.flatMap((s) => preguntas.filter((q) => q.seccion === s && q.texto.trim()))
      .map((q) => ({ texto: q.texto.trim(), seccion: q.seccion }))
    if (limpias.length === 0) return setEstado('Agrega al menos una pregunta.')
    if (Number(min) >= Number(max)) return setEstado('La escala mínima debe ser menor que la máxima.')
    const antes = preguntasDe(evento)
    const cambioEstructura = limpias.length !== antes.length ||
      limpias.some((q, i) => q.seccion !== antes[i]?.seccion || q.texto !== antes[i]?.texto)
    if (nCalificaciones > 0 && cambioEstructura &&
      !confirm('Ya hay calificaciones registradas. Cambiar, mover o borrar preguntas puede descuadrar los resultados. ¿Continuar?')) return
    setEstado('Guardando…')
    const { error } = await supabase.from('eventos')
      .update({ rubrica: limpias, secciones, escala_min: Number(min), escala_max: Number(max) }).eq('id', evento.id)
    setEstado(error ? mensajeError(error) : 'Rúbrica guardada ✓')
    if (!error) { setPreguntas(limpias); recargar() }
  }

  const totalMax = preguntas.filter((q) => q.texto.trim()).length * Number(max)
  let numero = 0

  return (
    <div className="space-y-4">
      <div className="tarjeta flex flex-wrap items-end gap-4">
        <div>
          <label className="etiqueta">Escala mínima</label>
          <input className="input w-24" type="number" value={min} onChange={(e) => setMin(e.target.value)} />
        </div>
        <div>
          <label className="etiqueta">Escala máxima</label>
          <input className="input w-24" type="number" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <p className="pb-2 text-sm text-gray-600">Puntaje máximo del proyecto: <b>{totalMax}</b></p>
        <div className="ml-auto flex items-end gap-2">
          <div>
            <label className="etiqueta">Nueva sección</label>
            <input className="input w-44" placeholder="Ej: Técnica" value={nuevaSeccion}
              onChange={(e) => setNuevaSeccion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregarSeccion()} />
          </div>
          <button className="btn-secundario" onClick={agregarSeccion}>+ Sección</button>
        </div>
      </div>

      {secciones.length > 1 && (
        <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
          Cada jurado califica solo las secciones que le asignes en la pestaña <b>Evaluadores</b>.
          El puntaje del proyecto es la suma de los promedios de cada pregunta.
        </p>
      )}

      {secciones.map((s, si) => {
        const c = color(si)
        const items = preguntas.map((q, i) => ({ ...q, i })).filter((q) => q.seccion === s)
        return (
          <div key={s} className="tarjeta overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 px-4 py-3 text-white" style={{ background: degradado(c) }}>
              <p className="font-bold">{s} <span className="font-normal opacity-85">· {items.length} pregunta{items.length !== 1 && 's'} · máx. {items.length * Number(max)}</span></p>
              <div className="flex gap-1">
                <button className="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30" onClick={() => renombrarSeccion(s)}>Renombrar</button>
                {secciones.length > 1 && <button className="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30" onClick={() => quitarSeccion(s)}>Eliminar</button>}
              </div>
            </div>
            <ol className="space-y-2 p-4">
              {items.map((q) => {
                numero += 1
                return (
                  <li key={q.i} className="flex items-start gap-2">
                    <span className="mt-2 w-6 text-right text-sm font-semibold text-gray-500">{numero}.</span>
                    <div className="flex-1 space-y-1">
                      <textarea className="input min-h-[56px]" value={q.texto} onChange={(e) => cambiar(q.i, 'texto', e.target.value)} />
                      {secciones.length > 1 && (
                        <select className="input w-auto py-1 text-xs" value={q.seccion} onChange={(e) => cambiar(q.i, 'seccion', e.target.value)}>
                          {secciones.map((x) => <option key={x} value={x}>Mover a: {x}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <button className="btn-secundario px-2 py-1" title="Subir" onClick={() => mover(q.i, -1)}>↑</button>
                      <button className="btn-secundario px-2 py-1" title="Bajar" onClick={() => mover(q.i, 1)}>↓</button>
                    </div>
                    <button className="btn-peligro px-2" title="Quitar" onClick={() => quitar(q.i)}>✕</button>
                  </li>
                )
              })}
              <li><button className="btn-secundario" onClick={() => agregar(s)}>+ Agregar pregunta en {s}</button></li>
            </ol>
          </div>
        )
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-secundario" onClick={() => {
          if (!confirm('¿Reemplazar todo por la rúbrica base de 10 preguntas (una sola sección)?')) return
          setSecciones(['General']); setPreguntas(RUBRICA_BASE.map((texto) => ({ texto, seccion: 'General' })))
        }}>Restaurar rúbrica base</button>
        <button className="btn-primario" onClick={guardar}>Guardar rúbrica</button>
        <span className="text-sm text-gray-700">{estado}</span>
      </div>
    </div>
  )
}
