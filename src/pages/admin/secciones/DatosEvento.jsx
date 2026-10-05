import { useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'

export default function DatosEvento({ evento, recargar }) {
  const [nombre, setNombre] = useState(evento.nombre)
  const [fecha, setFecha] = useState(evento.fecha ?? '')
  const [activo, setActivo] = useState(evento.activo)
  const [publicos, setPublicos] = useState(evento.resultados_publicos)
  const [estado, setEstado] = useState('')

  const guardar = async (ev) => {
    ev.preventDefault()
    setEstado('Guardando…')
    const r1 = await supabase.from('eventos').update({ nombre, fecha: fecha || null, activo, resultados_publicos: publicos }).eq('id', evento.id)
    const err = r1.error
    setEstado(err ? mensajeError(err) : 'Cambios guardados ✓')
    recargar()
  }

  return (
    <form onSubmit={guardar} className="tarjeta max-w-xl space-y-4">
      <div>
        <label className="etiqueta">Nombre del evento</label>
        <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div>
        <label className="etiqueta">Fecha</label>
        <input className="input max-w-xs" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <label className="flex items-center gap-3 rounded-lg bg-sena-claro p-3">
        <input type="checkbox" className="h-5 w-5 accent-sena" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        <span className="text-sm"><b>Evento activo.</b> Si está activo, los jurados lo ven y pueden calificar.
          Desactívalo cuando termine la evaluación.</span>
      </label>
      <label className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
        <input type="checkbox" className="h-5 w-5 accent-sena" checked={publicos} onChange={(e) => setPublicos(e.target.checked)} />
        <span className="text-sm"><b>Publicar resultados.</b> Cualquier persona podrá ver el podio y el ranking por ficha
          en <i>Resultados</i> (solo promedios, sin las notas individuales de cada jurado).</span>
      </label>
      <div className="flex items-center gap-3">
        <button className="btn-primario">Guardar</button>
        <span className="text-sm text-gray-600">{estado}</span>
      </div>
    </form>
  )
}
