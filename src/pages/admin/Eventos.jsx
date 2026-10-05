import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, mensajeError } from '../../lib/supabase'
import { RUBRICA_BASE } from '../../lib/rubricaBase'
import { color } from '../../lib/colores'

export default function Eventos() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState(null)
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  const cargar = async () => {
    const { data, error } = await supabase.from('eventos').select('*').order('created_at', { ascending: false })
    if (error) setError(mensajeError(error))
    setEventos(data ?? [])
  }
  useEffect(() => { cargar() }, [])

  const crear = async (ev) => {
    ev.preventDefault()
    setError('')
    const { data, error } = await supabase.from('eventos')
      .insert({ nombre, fecha, rubrica: RUBRICA_BASE }).select().single()
    if (error) return setError(mensajeError(error))
    navigate(`/admin/evento/${data.id}`)
  }

  const eliminar = async (e) => {
    if (!confirm(`¿Eliminar "${e.nombre}" con todas sus fichas, proyectos y calificaciones?`)) return
    const { error } = await supabase.from('eventos').delete().eq('id', e.id)
    if (error) return setError(mensajeError(error))
    cargar()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-sena-oscuro sm:text-3xl">Eventos</h1>

      <form onSubmit={crear} className="tarjeta grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label className="etiqueta">Nombre del evento</label>
          <input className="input" placeholder="Ej: Socialización de proyectos IV-2026" value={nombre}
            onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className="etiqueta">Fecha</label>
          <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <button className="btn-primario">Crear evento</button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {eventos === null && <p className="text-gray-500">Cargando…</p>}
      {eventos?.length === 0 && <p className="text-gray-500">Aún no hay eventos.</p>}

      <div className="space-y-3">
        {eventos?.map((e, i) => (
          <div key={e.id} className="tarjeta flex items-center justify-between gap-3 border-l-8" style={{ borderLeftColor: color(i).de }}>
            <div>
              <p className="font-semibold">{e.nombre}</p>
              <p className="text-sm text-gray-500">
                {e.fecha || 'Sin fecha'} ·{' '}
                {e.activo
                  ? <span className="font-medium text-sena-oscuro">Activo</span>
                  : <span>Inactivo</span>}
                {e.resultados_publicos && <> · <span className="font-medium text-amber-700">Resultados publicados</span></>}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/evento/${e.id}`} className="btn-secundario">Abrir</Link>
              <button className="btn-peligro" onClick={() => eliminar(e)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
