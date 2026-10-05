import { useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { RUBRICA_BASE } from '../../../lib/rubricaBase'

export default function Rubrica({ evento, nCalificaciones, recargar }) {
  const [preguntas, setPreguntas] = useState(evento.rubrica ?? [])
  const [min, setMin] = useState(evento.escala_min)
  const [max, setMax] = useState(evento.escala_max)
  const [estado, setEstado] = useState('')

  const cambiar = (i, v) => setPreguntas((p) => p.map((q, j) => (j === i ? v : q)))
  const quitar = (i) => setPreguntas((p) => p.filter((_, j) => j !== i))
  const mover = (i, d) => setPreguntas((p) => {
    const n = [...p]; const j = i + d
    if (j < 0 || j >= n.length) return p
    ;[n[i], n[j]] = [n[j], n[i]]; return n
  })

  const guardar = async () => {
    const limpias = preguntas.map((q) => q.trim()).filter(Boolean)
    if (limpias.length === 0) return setEstado('Agrega al menos una pregunta.')
    if (Number(min) >= Number(max)) return setEstado('La escala mínima debe ser menor que la máxima.')
    if (nCalificaciones > 0 && limpias.length !== (evento.rubrica ?? []).length &&
      !confirm('Ya hay calificaciones con la rúbrica anterior. Cambiar el número de preguntas puede descuadrar los resultados. ¿Continuar?')) return
    setEstado('Guardando…')
    const { error } = await supabase.from('eventos')
      .update({ rubrica: limpias, escala_min: Number(min), escala_max: Number(max) }).eq('id', evento.id)
    setEstado(error ? mensajeError(error) : 'Rúbrica guardada ✓')
    setPreguntas(limpias)
    recargar()
  }

  const totalMax = preguntas.filter((q) => q.trim()).length * Number(max)

  return (
    <div className="tarjeta space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="etiqueta">Escala mínima</label>
          <input className="input w-24" type="number" value={min} onChange={(e) => setMin(e.target.value)} />
        </div>
        <div>
          <label className="etiqueta">Escala máxima</label>
          <input className="input w-24" type="number" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <p className="pb-2 text-sm text-gray-600">Puntaje máximo por jurado: <b>{totalMax}</b></p>
      </div>

      <ol className="space-y-2">
        {preguntas.map((q, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2 w-6 text-right text-sm font-semibold text-gray-500">{i + 1}.</span>
            <textarea className="input min-h-[60px] flex-1" value={q} onChange={(e) => cambiar(i, e.target.value)} />
            <div className="flex flex-col">
              <button className="btn-secundario px-2 py-1" title="Subir" onClick={() => mover(i, -1)}>↑</button>
              <button className="btn-secundario px-2 py-1" title="Bajar" onClick={() => mover(i, 1)}>↓</button>
            </div>
            <button className="btn-peligro px-2" title="Quitar" onClick={() => quitar(i)}>✕</button>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-secundario" onClick={() => setPreguntas((p) => [...p, ''])}>+ Agregar pregunta</button>
        <button className="btn-secundario" onClick={() => confirm('¿Reemplazar por la rúbrica base de 10 preguntas?') && setPreguntas(RUBRICA_BASE)}>
          Restaurar rúbrica base</button>
        <button className="btn-primario" onClick={guardar}>Guardar rúbrica</button>
        <span className="text-sm text-gray-600">{estado}</span>
      </div>
    </div>
  )
}
