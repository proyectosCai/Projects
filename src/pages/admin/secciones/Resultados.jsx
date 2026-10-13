import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { calcularResultados } from '../../../lib/resultados'
import { exportarExcel } from '../../../lib/exportarExcel'
import { color, degradado } from '../../../lib/colores'
import Podio from '../../../components/Podio'
import { etiquetaGrupo, detalleGrupo } from '../../../lib/grupos'


export default function Resultados({ evento }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [fichaSel, setFichaSel] = useState(null)
  const [abierto, setAbierto] = useState(null)
  const [actualizado, setActualizado] = useState(null)
  const [exportando, setExportando] = useState(false)

  const cargar = useCallback(async () => {
    const [fs, evs, cs] = await Promise.all([
      supabase.from('fichas').select('*, proyectos(*)').eq('evento_id', evento.id).order('orden').order('numero'),
      supabase.from('evaluadores').select('id, nombre').eq('evento_id', evento.id).order('nombre'),
      supabase.from('calificaciones').select('*').eq('evento_id', evento.id),
    ])
    const err = fs.error || evs.error || cs.error
    if (err) return setError(mensajeError(err))
    setError('')
    setDatos({ fichas: fs.data, evaluadores: evs.data, calificaciones: cs.data })
    setActualizado(new Date())
  }, [evento.id])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 20000) // se actualiza solo cada 20 s
    return () => clearInterval(t)
  }, [cargar])

  const resultados = useMemo(() => (datos ? calcularResultados({ evento, ...datos }) : []), [datos, evento])
  const ficha = resultados.find((f) => f.id === fichaSel) ?? resultados[0]
  const maxTotal = (evento.rubrica ?? []).length * evento.escala_max

  const exportar = async () => {
    setExportando(true)
    try { await exportarExcel(evento, resultados) } catch (e) { setError(mensajeError(e)) }
    setExportando(false)
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!datos) return <p className="text-gray-500">Cargando…</p>
  if (resultados.length === 0) return <p className="text-gray-500">Aún no hay fichas en este evento.</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {datos.calificaciones.length} calificaciones · actualizado {actualizado?.toLocaleTimeString('es-CO')}
        </p>
        <div className="flex gap-2">
          <button className="btn-secundario" onClick={cargar}>↻ Actualizar</button>
          <button className="btn-primario" onClick={exportar} disabled={exportando}>
            {exportando ? 'Generando…' : 'Exportar a Excel'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {resultados.map((f, i) => {
          const hechas = f.ranking.filter((p) => p.nEvaluaciones > 0).length
          const sel = f.id === ficha.id
          return (
            <button key={f.id} onClick={() => { setFichaSel(f.id); setAbierto(null) }}
              style={sel ? { background: degradado(color(i)) } : { borderColor: color(i).de }}
              className={`rounded-xl border-2 px-3 py-2 text-left text-sm shadow-sm transition ${sel
                ? 'border-transparent text-white' : 'bg-white hover:-translate-y-0.5'}`}>
              <span className="block font-semibold">{etiquetaGrupo(f)}</span>
              <span className={`block text-xs ${sel ? 'text-white/80' : 'text-gray-500'}`}>{hechas}/{f.ranking.length} proyectos con nota</span>
            </button>
          )
        })}
      </div>

      <div className="tarjeta">
        <h2 className="text-xl font-bold text-sena-oscuro">{etiquetaGrupo(ficha)}</h2>
        {detalleGrupo(ficha) && <p className="text-sm text-gray-600">{detalleGrupo(ficha)}</p>}

        <Podio ranking={ficha.ranking} maxTotal={maxTotal} />

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-2">Puesto</th>
                <th className="py-2 pr-2">Proyecto</th>
                <th className="py-2 pr-2 text-center">Jurados</th>
                <th className="py-2 pr-2 text-right">Promedio</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {ficha.ranking.map((p) => (
                <FilaProyecto key={p.id} p={p} evento={evento} totalJurados={datos.evaluadores.length}
                  abierto={abierto === p.id} onToggle={() => setAbierto(abierto === p.id ? null : p.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FilaProyecto({ p, evento, totalJurados, abierto, onToggle }) {
  const preguntas = evento.rubrica ?? []
  return (
    <>
      <tr className="cursor-pointer border-b border-gray-100 hover:bg-gray-50" onClick={onToggle}>
        <td className="py-2 pr-2 font-bold text-gray-600">{p.posicion ?? '—'}</td>
        <td className="py-2 pr-2">
          <span className="font-medium">{p.nombre}</span>
          {p.integrantes && <span className="block text-xs text-gray-500">{p.integrantes}</span>}
        </td>
        <td className={`py-2 pr-2 text-center ${p.nEvaluaciones < totalJurados ? 'text-amber-600' : 'text-gray-600'}`}>
          {p.nEvaluaciones}/{totalJurados}
        </td>
        <td className="py-2 pr-2 text-right font-bold">{p.promedio ?? <span className="font-normal text-gray-400">Sin calificar</span>}</td>
        <td className="py-2 text-right text-gray-400">{abierto ? '▴' : '▾'}</td>
      </tr>
      {abierto && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="p-3">
            {p.pendientes.length > 0 && (
              <p className="mb-2 text-xs text-amber-700">Falta calificar: {p.pendientes.join(', ')}</p>
            )}
            {p.detalle.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-2">Jurado</th>
                      {preguntas.map((q, i) => <th key={i} title={q} className="px-1 py-1 text-center">P{i + 1}</th>)}
                      <th className="py-1 pl-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.detalle.map((c) => (
                      <tr key={c.id} className="border-t border-gray-200">
                        <td className="py-1 pr-2">
                          {c.evaluador}
                          {c.observacion && <span className="block italic text-gray-500">“{c.observacion}”</span>}
                        </td>
                        {preguntas.map((_, i) => <td key={i} className="px-1 py-1 text-center">{c.puntajes?.[i] ?? ''}</td>)}
                        <td className="py-1 pl-2 text-right font-semibold">{c.total}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="py-1 pr-2">Promedio</td>
                      {p.porPregunta.map((v, i) => <td key={i} className="px-1 py-1 text-center">{v ?? ''}</td>)}
                      <td className="py-1 pl-2 text-right">{p.promedio}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-gray-500">Nadie ha calificado este proyecto todavía.</p>}
          </td>
        </tr>
      )}
    </>
  )
}
