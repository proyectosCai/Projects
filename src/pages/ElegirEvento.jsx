import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { color, degradado } from '../lib/colores'

/** Lista de eventos con tarjetas de color.
 *  destino="jurado": eventos activos → pantalla del jurado
 *  destino="resultados": todos los eventos (admin) → pestaña Resultados */
const TEXTOS = {
  jurado: { titulo: 'Calificar proyectos', sub: 'Elige el evento en el que vas a calificar.', vacio: 'No hay eventos activos en este momento.', accion: 'Entrar a calificar →', icono: '📝' },
  resultados: { titulo: 'Resultados (detalle)', sub: 'Elige el evento para ver sus resultados.', vacio: 'Aún no hay eventos.', accion: 'Ver resultados →', icono: '🏆' },
  publico: { titulo: 'Resultados', sub: 'Podio y ranking de los proyectos por ficha.', vacio: 'Todavía no hay resultados publicados.', accion: 'Ver resultados →', icono: '🏆' },
}

export default function ElegirEvento({ destino = 'jurado', titulo, embebido = false, ocultarVacio = false }) {
  const [eventos, setEventos] = useState(null)
  const admin = destino === 'resultados'
  const t = TEXTOS[destino]

  useEffect(() => {
    let q = supabase.from('eventos').select('id, nombre, fecha, activo, imagen_url').order('fecha', { ascending: false })
    if (destino === 'jurado') q = q.eq('activo', true)
    if (destino === 'publico') q = q.eq('resultados_publicos', true)
    q.then(({ data }) => setEventos(data ?? []))
  }, [destino])

  const ruta = (e) => (admin ? `/admin/evento/${e.id}?tab=Resultados`
    : destino === 'publico' ? `/resultados/${e.id}` : `/evento/${e.id}`)

  if (ocultarVacio && !eventos?.length) return null

  return (
    <div>
      {!embebido && (
        <>
          <h1 className="text-2xl font-bold text-sena-oscuro sm:text-3xl">{titulo ?? t.titulo}</h1>
          <p className="mb-5 text-gray-700">{t.sub}</p>
        </>
      )}
      {eventos === null && <p className="text-gray-600">Cargando…</p>}
      {eventos?.length === 0 && <p className="tarjeta text-gray-600">{t.vacio}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {eventos?.map((e, i) => {
          const c = color(destino === 'jurado' ? i : i + 3)
          return (
            <Link key={e.id} to={ruta(e)}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-40 p-4 text-white" style={{ background: degradado(c) }}>
                {e.imagen_url
                  ? <img src={e.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  : <span className="text-4xl opacity-90">{t.icono}</span>}
                {admin && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-xs font-semibold backdrop-blur">
                    {e.activo ? 'Activo' : 'Cerrado'}
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-lg font-bold leading-snug text-gray-900">{e.nombre}</p>
                {e.fecha && <p className="text-sm text-gray-500">{new Date(e.fecha + 'T12:00').toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>}
                <p className="mt-3 text-sm font-semibold" style={{ color: c.texto }}>
                  {t.accion}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
