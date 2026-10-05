import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, mensajeError } from '../lib/supabase'
import { rankingPublico } from '../lib/resultados'
import { color, degradado } from '../lib/colores'
import Podio from '../components/Podio'

export default function ResultadosPublicos() {
  const { id } = useParams()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [fichaSel, setFichaSel] = useState(null)

  const cargar = useCallback(async () => {
    const [ev, fs, ag] = await Promise.all([
      supabase.from('eventos').select('*').eq('id', id).eq('resultados_publicos', true).maybeSingle(),
      supabase.from('fichas').select('*, proyectos(*)').eq('evento_id', id).order('orden').order('numero'),
      supabase.rpc('resultados_publicos', { p_evento: id }),
    ])
    const err = ev.error || fs.error || ag.error
    if (err) return setError(mensajeError(err))
    if (!ev.data) return setError('Los resultados de este evento aún no están publicados.')
    setError('')
    setDatos({ evento: ev.data, fichas: fs.data, agregados: ag.data ?? [] })
  }, [id])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 30000)
    return () => clearInterval(t)
  }, [cargar])

  const resultados = useMemo(() => (datos ? rankingPublico(datos.fichas, datos.agregados) : []), [datos])

  if (error) return <p className="tarjeta text-center text-gray-700">{error} <Link to="/resultados" className="text-sena-oscuro underline">Ver otros eventos</Link></p>
  if (!datos) return <p className="text-gray-600">Cargando…</p>

  const { evento } = datos
  const maxTotal = (evento.rubrica ?? []).length * evento.escala_max
  const indice = Math.max(0, resultados.findIndex((f) => f.id === fichaSel))
  const ficha = resultados[indice]

  return (
    <div className="space-y-5">
      <div>
        <Link to="/resultados" className="text-sm font-medium text-sena-oscuro hover:underline">← Resultados</Link>
        <h1 className="text-2xl font-bold text-sena-oscuro sm:text-3xl">{evento.nombre}</h1>
        <p className="text-sm text-gray-700">
          Puntaje = promedio de las calificaciones de los jurados (máximo {maxTotal}).
          {evento.activo && <span className="ml-1 font-medium text-amber-700">La evaluación sigue en curso: los resultados pueden cambiar.</span>}
        </p>
      </div>

      {resultados.length === 0 ? <p className="tarjeta text-gray-600">Este evento no tiene fichas.</p> : (
        <>
          <div className="flex flex-wrap gap-2">
            {resultados.map((f, i) => {
              const sel = i === indice
              return (
                <button key={f.id} onClick={() => setFichaSel(f.id)}
                  style={sel ? { background: degradado(color(i)) } : { borderColor: color(i).de }}
                  className={`rounded-xl border-2 px-4 py-2 text-left text-sm shadow-sm transition ${sel ? 'border-transparent text-white' : 'bg-white hover:-translate-y-0.5'}`}>
                  <span className="block font-semibold">Ficha {f.numero}</span>
                  {f.programa && <span className={`block text-xs ${sel ? 'text-white/85' : 'text-gray-500'}`}>{f.programa}</span>}
                </button>
              )
            })}
          </div>

          <div className="tarjeta overflow-hidden p-0">
            <div className="p-5 text-white" style={{ background: degradado(color(indice)) }}>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Ficha</p>
              <h2 className="text-2xl font-extrabold">{ficha.numero}</h2>
              {ficha.programa && <p className="text-sm opacity-90">{ficha.programa}</p>}
            </div>
            <div className="p-5">
              <Podio ranking={ficha.ranking} maxTotal={maxTotal} />
              {ficha.ranking.length === 0 && <p className="text-gray-600">Esta ficha no tiene proyectos.</p>}
              <ol className="mt-5 space-y-2">
                {ficha.ranking.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: p.posicion ? degradado(color(indice)) : '#9ca3af' }}>{p.posicion ?? '—'}</span>
                    <span className="flex-1">
                      <span className="block font-medium leading-snug">{p.nombre}</span>
                      {p.integrantes && <span className="block text-xs text-gray-500">👥 {p.integrantes}</span>}
                      {p.promedio != null && maxTotal > 0 && (
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-gray-200">
                          <span className="block h-full rounded-full" style={{ width: `${(p.promedio / maxTotal) * 100}%`, background: degradado(color(indice)) }} />
                        </span>
                      )}
                    </span>
                    <span className="text-right">
                      {p.promedio != null
                        ? <><span className="block text-lg font-bold text-sena-oscuro">{p.promedio}</span>
                            <span className="block text-xs text-gray-500">{p.nEvaluaciones} jurado{p.nEvaluaciones !== 1 && 's'}</span></>
                        : <span className="text-sm text-gray-400">Sin calificar</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
