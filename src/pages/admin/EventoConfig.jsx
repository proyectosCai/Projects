import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase, mensajeError } from '../../lib/supabase'
import DatosEvento from './secciones/DatosEvento'
import Rubrica from './secciones/Rubrica'
import Fichas from './secciones/Fichas'
import Evaluadores from './secciones/Evaluadores'
import Compartir from './secciones/Compartir'
import Resultados from './secciones/Resultados'

const PESTANAS = ['Datos', 'Rúbrica', 'Fichas y proyectos', 'Evaluadores', 'Compartir', 'Resultados']

export default function EventoConfig() {
  const { id } = useParams()
  const [evento, setEvento] = useState(null)
  const [nCalificaciones, setNCalificaciones] = useState(0)
  const [params] = useSearchParams()
  const [pestana, setPestana] = useState(PESTANAS.includes(params.get('tab')) ? params.get('tab') : PESTANAS[0])
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const [ev, c] = await Promise.all([
      supabase.from('eventos').select('*').eq('id', id).single(),
      supabase.from('calificaciones').select('id', { count: 'exact', head: true }).eq('evento_id', id),
    ])
    if (ev.error) return setError(mensajeError(ev.error))
    setEvento(ev.data)
    setNCalificaciones(c.count ?? 0)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  if (error) return <p className="text-red-600">{error}</p>
  if (!evento) return <p className="text-gray-500">Cargando…</p>

  const props = { evento, nCalificaciones, recargar: cargar }

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin" className="text-sm text-sena-oscuro hover:underline">← Eventos</Link>
        <h1 className="text-2xl font-bold text-sena-oscuro sm:text-3xl">{evento.nombre}</h1>
        <p className="text-sm text-gray-700">
          {evento.activo ? 'Activo: los jurados pueden calificar' : 'Inactivo: los jurados no lo ven'}
          {' · '}{nCalificaciones} calificaciones registradas
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl bg-white/80 p-1 shadow-sm backdrop-blur-sm">
        {PESTANAS.map((p) => (
          <button key={p} onClick={() => setPestana(p)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${pestana === p
              ? 'bg-sena text-white shadow' : 'text-gray-600 hover:bg-sena-claro hover:text-sena-oscuro'}`}>
            {p}
          </button>
        ))}
      </div>

      {pestana === 'Datos' && <DatosEvento {...props} />}
      {pestana === 'Rúbrica' && <Rubrica {...props} />}
      {pestana === 'Fichas y proyectos' && <Fichas {...props} />}
      {pestana === 'Evaluadores' && <Evaluadores {...props} />}
      {pestana === 'Compartir' && <Compartir {...props} />}
      {pestana === 'Resultados' && <Resultados {...props} />}
    </div>
  )
}
