import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { guardarEvaluador, leerEvaluador, useEventoJurado } from '../../lib/useEventoJurado'
import Calificar from './Calificar'
import { color, degradado } from '../../lib/colores'
import { etiquetaGrupo, detalleGrupo, tipoGrupo } from '../../lib/grupos'
import { etiquetaSecciones, asignado, tieneAsignacion } from '../../lib/rubrica'

export default function EventoJurado() {
  const { id } = useParams()
  const [evaluadorId, setEvaluadorId] = useState(() => leerEvaluador(id))
  const [fichaId, setFichaId] = useState(null)
  const [proyectoId, setProyectoId] = useState(null)
  const { datos, error, recargar } = useEventoJurado(id, evaluadorId)

  const elegirEvaluador = (evId) => { guardarEvaluador(id, evId); setEvaluadorId(evId); setFichaId(null) }

  if (error) return <Aviso>{error} <Link className="text-sena-oscuro underline" to="/">Volver</Link></Aviso>
  if (!datos) return <p className="text-center text-gray-500">Cargando…</p>

  const { evento, evaluadores, mias } = datos
  const evaluador = evaluadores.find((e) => e.id === evaluadorId)
  // Solo las fichas y proyectos asignados a este jurado
  const fichas = datos.fichas
    .map((f) => ({ ...f, proyectos: f.proyectos.filter((p) => asignado(evaluador, { ...p, ficha_id: f.id })) }))
    .filter((f) => f.proyectos.length > 0)

  // 1. Elegir nombre
  if (!evaluador) {
    return (
      <Contenedor titulo={evento.nombre} subtitulo="¿Quién eres? Elige tu nombre para empezar a calificar." imagen={evento.imagen_url}>
        {evaluadores.length === 0 && <Aviso>Aún no hay evaluadores registrados en este evento.</Aviso>}
        <div className="grid gap-3 sm:grid-cols-2">
          {evaluadores.map((e, i) => {
            const c = color(i)
            const iniciales = e.nombre.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()
            return (
              <button key={e.id} onClick={() => elegirEvaluador(e.id)}
                className="flex items-center gap-3 rounded-2xl bg-white/95 p-4 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow"
                  style={{ background: degradado(c) }}>{iniciales}</span>
                <span>
                  <span className="block text-lg font-semibold">{e.nombre}</span>
                  {etiquetaSecciones(e, evento) && <span className="block text-xs font-medium text-gray-500">Evalúa: {etiquetaSecciones(e, evento)}</span>}
                  {tieneAsignacion(e) && <span className="block text-xs font-medium text-gray-500">📌 {resumenAsignacion(e, datos.fichas)}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </Contenedor>
    )
  }

  const ficha = fichas.find((f) => f.id === fichaId)
  const proyecto = ficha?.proyectos.find((p) => p.id === proyectoId)

  // 4. Calificar proyecto
  if (ficha && proyecto) {
    return (
      <Calificar evento={evento} ficha={ficha} proyecto={proyecto} evaluador={evaluador}
        previa={mias[proyecto.id]}
        onVolver={() => setProyectoId(null)}
        onGuardado={async () => { await recargar(); setProyectoId(null) }} />
    )
  }

  const barraJurado = (
    <div className="mb-4 flex items-center justify-between rounded-xl bg-white/90 px-4 py-2 text-sm shadow-sm">
      <span>Jurado: <b>{evaluador.nombre}</b></span>
      <button className="text-sena-oscuro underline" onClick={() => elegirEvaluador(null)}>Cambiar</button>
    </div>
  )

  // 3. Proyectos de la ficha
  if (ficha) {
    return (
      <Contenedor titulo={etiquetaGrupo(ficha)} subtitulo={detalleGrupo(ficha)}>
        {barraJurado}
        <button className="mb-4 rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-sena-oscuro shadow-sm hover:bg-white" onClick={() => setFichaId(null)}>← Todas las fichas y grupos</button>
        {ficha.proyectos.length === 0 && <Aviso>Esta ficha aún no tiene proyectos.</Aviso>}
        <div className="grid gap-4 sm:grid-cols-2">
          {ficha.proyectos.map((p, i) => {
            const hecha = mias[p.id]
            const c = color(i)
            return (
              <button key={p.id} onClick={() => setProyectoId(p.id)}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: degradado(c) }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-base font-bold">{i + 1}</span>
                  {hecha
                    ? <span className="rounded-full bg-white px-3 py-1 text-sm font-bold" style={{ color: c.texto }}>✓ {hecha.total} pts</span>
                    : <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold">Pendiente</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="font-semibold leading-snug text-gray-900">{p.nombre}</span>
                  {p.integrantes && <span className="mt-1 text-sm text-gray-500">👥 {p.integrantes}</span>}
                  {p.trabajo_path && <span className="mt-1 text-xs font-medium text-gray-500">📄 Trabajo disponible</span>}
                  <span className="mt-auto pt-3 text-sm font-semibold" style={{ color: c.texto }}>
                    {hecha ? 'Corregir calificación →' : 'Calificar →'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </Contenedor>
    )
  }

  // 2. Elegir ficha
  return (
    <Contenedor titulo={evento.nombre} subtitulo="Elige la ficha que vas a evaluar." imagen={evento.imagen_url}>
      {barraJurado}
      {fichas.length === 0 && <Aviso>{tieneAsignacion(evaluador) ? 'No tienes proyectos asignados en este evento.' : 'Aún no hay fichas en este evento.'}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-2">
        {fichas.map((f, i) => {
          const hechas = f.proyectos.filter((p) => mias[p.id]).length
          const total = f.proyectos.length
          const completa = total > 0 && hechas === total
          const c = color(i)
          const pct = total ? Math.round((hechas / total) * 100) : 0
          return (
            <button key={f.id} onClick={() => setFichaId(f.id)}
              className="overflow-hidden rounded-2xl bg-white text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <div className="p-4 text-white" style={{ background: degradado(c) }}>
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{tipoGrupo(f)}</span>
                <span className="block text-2xl font-extrabold">{f.numero}</span>
                {detalleGrupo(f) && <span className="block text-sm opacity-90">{detalleGrupo(f)}</span>}
              </div>
              <div className="p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">{hechas} de {total} proyectos</span>
                  <span className="font-semibold" style={{ color: c.texto }}>{completa ? '✓ Completa' : `${pct}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: c.suave }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: degradado(c) }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Contenedor>
  )
}

function Contenedor({ titulo, subtitulo, imagen, children }) {
  return (
    <div className="mx-auto max-w-3xl">
      {imagen && <img src={imagen} alt="" className="mb-4 h-40 w-full rounded-2xl object-cover shadow-md sm:h-52" />}
      <h1 className="text-2xl font-bold text-sena-oscuro sm:text-3xl">{titulo}</h1>
      {subtitulo && <p className="mb-5 text-gray-700">{subtitulo}</p>}
      {children}
    </div>
  )
}

function Aviso({ children }) {
  return <p className="tarjeta mx-auto max-w-2xl text-center text-gray-600">{children}</p>
}

function resumenAsignacion(ev, fichas) {
  const nf = fichas.filter((f) => (ev.fichas ?? []).includes(f.id)).map((f) => etiquetaGrupo(f))
  const np = (ev.proyectos ?? []).length
  return [nf.length ? nf.join(', ') : null, np ? `${np} proyecto${np > 1 ? 's' : ''}` : null].filter(Boolean).join(' + ')
}
