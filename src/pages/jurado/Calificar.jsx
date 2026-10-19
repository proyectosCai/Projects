import { useState } from 'react'
import { supabase, mensajeError } from '../../lib/supabase'
import { color, degradado } from '../../lib/colores'
import { abrirTrabajo } from '../../lib/trabajos'
import { etiquetaGrupo } from '../../lib/grupos'
import { preguntasDe, indicesDe, agruparPorSeccion, seccionesDe } from '../../lib/rubrica'

export default function Calificar({ evento, ficha, proyecto, evaluador, previa, onVolver, onGuardado }) {
  const preguntas = preguntasDe(evento)
  const mias = indicesDe(evento, evaluador)          // índices que le tocan a este jurado
  const grupos = agruparPorSeccion(evento, mias)
  const variasSecciones = seccionesDe(evento).length > 1
  const escala = Array.from({ length: evento.escala_max - evento.escala_min + 1 }, (_, i) => evento.escala_min + i)
  const [puntajes, setPuntajes] = useState(() =>
    preguntas.map((_, i) => (mias.includes(i) && previa?.puntajes?.length === preguntas.length ? previa.puntajes[i] ?? null : null)))
  const [observacion, setObservacion] = useState(previa?.observacion ?? '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  const c = color(ficha.proyectos.findIndex((p) => p.id === proyecto.id))
  const faltantes = mias.filter((i) => puntajes[i] == null).length
  const total = puntajes.reduce((s, p) => s + (p ?? 0), 0)

  const marcar = (i, v) => setPuntajes((ps) => ps.map((p, j) => (j === i ? v : p)))

  const enviar = async () => {
    if (faltantes > 0) {
      setError(`Falta${faltantes > 1 ? 'n' : ''} ${faltantes} pregunta${faltantes > 1 ? 's' : ''} por calificar.`)
      document.querySelector('[data-pendiente="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setEnviando(true); setError('')
    const { error } = await supabase.rpc('registrar_calificacion', {
      p_evento: evento.id, p_proyecto: proyecto.id, p_evaluador: evaluador.id,
      p_puntajes: puntajes, p_observacion: observacion.trim() || null,
    })
    setEnviando(false)
    if (error) return setError(mensajeError(error))
    setListo(true)
    setTimeout(onGuardado, 1200)
  }

  if (listo) {
    return (
      <div className="tarjeta mx-auto my-10 max-w-md py-12 text-center">
        <p className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white shadow-lg" style={{ background: degradado(c) }}>✓</p>
        <p className="mt-3 text-2xl font-bold text-sena-oscuro">¡Gracias por su evaluación!</p>
        <p className="mt-1 text-gray-600">Puntaje: {total}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-28">
      <button className="mb-4 rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-sena-oscuro shadow-sm hover:bg-white" onClick={onVolver}>← Proyectos de {etiquetaGrupo(ficha)}</button>
      <div className="mb-4 rounded-2xl p-5 text-white shadow-lg" style={{ background: degradado(c) }}>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{etiquetaGrupo(ficha)}{ficha.institucion ? ` · ${ficha.institucion}` : ''}</p>
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">{proyecto.nombre}</h1>
        {proyecto.integrantes && <p className="mt-1 text-sm opacity-90">👥 {proyecto.integrantes}</p>}
        <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          Jurado: {evaluador.nombre}{variasSecciones && mias.length < preguntas.length ? ` · ${grupos.map((g) => g.seccion).join(', ')}` : ''}{previa && ' · corrigiendo tu calificación'}</p>
        {proyecto.trabajo_path && (
          <button type="button" onClick={() => abrirTrabajo(proyecto).catch((e) => setError(mensajeError(e)))}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold shadow hover:bg-white/90"
            style={{ color: c.texto }}>
            📄 Ver / descargar trabajo
          </button>
        )}
      </div>

      <p className="mb-3 text-sm text-gray-700">Seleccione una única opción por pregunta ({evento.escala_min} = más bajo, {evento.escala_max} = más alto).</p>

      {mias.length === 0 && <p className="tarjeta text-amber-800">No tienes preguntas asignadas en esta rúbrica. Avísale a la organizadora.</p>}
      {(() => { let n = 0; return grupos.map((g) => (
        <section key={g.seccion} className="mb-4">
          {variasSecciones && (
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: c.texto }}>
              <span className="h-1 w-6 rounded-full" style={{ background: degradado(c) }} />{g.seccion}
            </h2>
          )}
          <ol className="space-y-3">
            {g.preguntas.map(({ texto, i }) => { n += 1; return (
              <li key={i} data-pendiente={puntajes[i] == null && error ? 'true' : undefined}
                className={`tarjeta ${puntajes[i] == null && error ? 'border-amber-400 bg-amber-50' : ''}`}>
                <p className="mb-3 flex gap-2 font-medium">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: degradado(c) }}>{n}</span>
                  <span>{texto}</span></p>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {escala.map((v) => (
                    <button key={v} type="button" onClick={() => marcar(i, v)}
                      className={`h-11 rounded-lg border text-base font-semibold transition ${puntajes[i] === v
                        ? 'border-sena bg-sena text-white shadow'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-sena'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </li>
            ) })}
          </ol>
        </section>
      )) })()}

      <div className="tarjeta mt-3">
        <label className="etiqueta">Observaciones (opcional)</label>
        <textarea className="input min-h-[70px]" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex-1 text-sm">
            <span className="font-semibold">Total: {total}</span>
            <span className="text-gray-500"> / {mias.length * evento.escala_max}</span>
            {error
              ? <p className="text-red-600">{error}</p>
              : <p className="text-gray-500">{faltantes > 0 ? `Faltan ${faltantes}` : 'Todas calificadas ✓'}</p>}
          </div>
          <button className="btn-primario px-6 py-3" onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando…' : previa ? 'Guardar corrección' : 'Enviar evaluación'}
          </button>
        </div>
      </div>
    </div>
  )
}
