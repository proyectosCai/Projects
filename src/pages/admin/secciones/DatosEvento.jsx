import { useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { subirImagen } from '../../../lib/imagenes'

export default function DatosEvento({ evento, recargar }) {
  const [f, setF] = useState({
    nombre: evento.nombre,
    fecha: evento.fecha ?? '',
    activo: evento.activo,
    resultados_publicos: evento.resultados_publicos,
    recibe_trabajos: evento.recibe_trabajos,
    certificados_disponibles: evento.certificados_disponibles,
    cert_horas: evento.cert_horas ?? '',
    cert_entidad: evento.cert_entidad ?? '',
    cert_firmante: evento.cert_firmante ?? '',
    cert_cargo: evento.cert_cargo ?? '',
    cert_firmante2: evento.cert_firmante2 ?? '',
    cert_cargo2: evento.cert_cargo2 ?? '',
    cert_color: evento.cert_color ?? '#39a900',
  })
  const [estado, setEstado] = useState('')
  const [subiendo, setSubiendo] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const guardar = async (ev) => {
    ev.preventDefault()
    setEstado('Guardando…')
    const { error } = await supabase.from('eventos').update({
      ...f,
      fecha: f.fecha || null,
      cert_horas: f.cert_horas === '' ? null : Number(f.cert_horas),
      cert_firmante: f.cert_firmante.trim() || null,
      cert_cargo: f.cert_cargo.trim() || null,
      cert_firmante2: f.cert_firmante2.trim() || null,
      cert_cargo2: f.cert_cargo2.trim() || null,
    }).eq('id', evento.id)
    setEstado(error ? mensajeError(error) : 'Cambios guardados ✓')
    recargar()
  }

  const cambiarImagen = (campo, opciones) => async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(campo); setEstado('')
    try {
      const url = await subirImagen(file, `${evento.id}/${campo}`, opciones)
      const { error } = await supabase.from('eventos').update({ [campo]: url }).eq('id', evento.id)
      if (error) throw error
      recargar()
    } catch (err) { setEstado(mensajeError(err)) }
    setSubiendo('')
  }
  const quitarImagen = (campo) => async () => {
    await supabase.from('eventos').update({ [campo]: null }).eq('id', evento.id)
    recargar()
  }

  const logos = evento.cert_logos ?? []
  const agregarLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo('logo'); setEstado('')
    try {
      const url = await subirImagen(file, `${evento.id}/logos`, { maxAncho: 600, png: true })
      const { error } = await supabase.from('eventos').update({ cert_logos: [...logos, url] }).eq('id', evento.id)
      if (error) throw error
      recargar()
    } catch (err) { setEstado(mensajeError(err)) }
    setSubiendo('')
  }
  const quitarLogo = (i) => async () => {
    await supabase.from('eventos').update({ cert_logos: logos.filter((_, j) => j !== i) }).eq('id', evento.id)
    recargar()
  }

  const Firma = ({ campo, n }) => (
    <div>
      {evento[campo] && <img src={evento[campo]} alt="Firma" className="mb-2 h-14 rounded bg-white object-contain p-1 ring-1 ring-gray-200" />}
      <div className="flex gap-2">
        <label className="btn-secundario cursor-pointer text-xs">
          {subiendo === campo ? 'Subiendo…' : evento[campo] ? `Cambiar firma ${n}` : `Subir firma ${n}`}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={cambiarImagen(campo, { maxAncho: 600, png: true })} />
        </label>
        {evento[campo] && <button type="button" className="btn-peligro text-xs" onClick={quitarImagen(campo)}>Quitar</button>}
      </div>
    </div>
  )

  const Casilla = ({ campo, color, children }) => (
    <label className={`flex items-center gap-3 rounded-lg p-3 ${color}`}>
      <input type="checkbox" className="h-5 w-5 shrink-0 accent-sena" checked={f[campo]} onChange={set(campo)} />
      <span className="text-sm">{children}</span>
    </label>
  )

  return (
    <form onSubmit={guardar} className="grid gap-5 lg:grid-cols-2">
      <div className="tarjeta space-y-4">
        <h2 className="font-bold text-sena-oscuro">Evento</h2>
        <div>
          <label className="etiqueta">Nombre del evento</label>
          <input className="input" value={f.nombre} onChange={set('nombre')} required />
        </div>
        <div>
          <label className="etiqueta">Fecha</label>
          <input className="input max-w-xs" type="date" value={f.fecha} onChange={set('fecha')} />
        </div>

        <div>
          <label className="etiqueta">Imagen del evento (afiche o foto)</label>
          {evento.imagen_url
            ? <img src={evento.imagen_url} alt="" className="mb-2 h-40 w-full rounded-xl object-cover shadow" />
            : <div className="mb-2 flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400">Sin imagen</div>}
          <div className="flex gap-2">
            <label className="btn-secundario cursor-pointer">
              {subiendo === 'imagen_url' ? 'Subiendo…' : evento.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={cambiarImagen('imagen_url')} />
            </label>
            {evento.imagen_url && <button type="button" className="btn-peligro" onClick={quitarImagen('imagen_url')}>Quitar</button>}
          </div>
        </div>

        <Casilla campo="activo" color="bg-sena-claro"><b>Evento activo.</b> Los jurados lo ven y pueden calificar. Desactívalo al terminar.</Casilla>
        <Casilla campo="recibe_trabajos" color="bg-sky-50"><b>Recibir trabajos.</b> Los aprendices suben su documento en <i>Subir trabajo</i> con el código del proyecto.</Casilla>
        <Casilla campo="resultados_publicos" color="bg-amber-50"><b>Publicar resultados.</b> Cualquiera ve el podio y el ranking por ficha (solo promedios).</Casilla>
      </div>

      <div className="tarjeta space-y-4">
        <h2 className="font-bold text-sena-oscuro">Certificados</h2>
        <Casilla campo="certificados_disponibles" color="bg-violet-50">
          <b>Certificados disponibles.</b> Aprendices y jurados descargan los suyos en <i>Certificados</i> con su número de documento.
          Actívalo cuando la evaluación haya terminado (el puesto de ganador queda fijo al descargarlo).
        </Casilla>
        <div>
          <label className="etiqueta">Entidad que certifica</label>
          <input className="input" value={f.cert_entidad} onChange={set('cert_entidad')} />
        </div>
        <div>
          <label className="etiqueta">Logos del certificado (hasta 4, en orden de izquierda a derecha)</label>
          <div className="flex flex-wrap items-center gap-2">
            {logos.map((u, i) => (
              <div key={u} className="relative">
                <img src={u} alt="" className="h-14 w-24 rounded bg-white object-contain p-1 ring-1 ring-gray-200" />
                <button type="button" onClick={quitarLogo(i)} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white">×</button>
              </div>
            ))}
            {logos.length < 4 && (
              <label className="btn-secundario cursor-pointer text-xs">
                {subiendo === 'logo' ? 'Subiendo…' : '+ Agregar logo'}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={agregarLogo} />
              </label>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">{logos.length === 0 ? 'Sin logos propios: se usan los de SENA CAI, SENNOVA y BIOMETRONICA.' : 'Se usan estos logos en lugar de los predeterminados.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="etiqueta mb-0">Color del certificado</label>
          <input type="color" value={f.cert_color} onChange={set('cert_color')} className="h-9 w-14 cursor-pointer rounded border border-gray-300" />
          <button type="button" className="text-xs text-sena-oscuro underline" onClick={() => setF((x) => ({ ...x, cert_color: '#39a900' }))}>Verde SENA</button>
        </div>
        <div>
          <label className="etiqueta">Intensidad horaria (opcional)</label>
          <input className="input w-32" type="number" min="1" value={f.cert_horas} onChange={set('cert_horas')} placeholder="horas" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-semibold">Firma 1</p>
            <input className="input" value={f.cert_firmante} onChange={set('cert_firmante')} placeholder="Nombre" />
            <input className="input" value={f.cert_cargo} onChange={set('cert_cargo')} placeholder="Cargo" />
            <Firma campo="cert_firma_url" n={1} />
          </div>
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-semibold">Firma 2 <span className="font-normal text-gray-500">(opcional)</span></p>
            <input className="input" value={f.cert_firmante2} onChange={set('cert_firmante2')} placeholder="Nombre" />
            <input className="input" value={f.cert_cargo2} onChange={set('cert_cargo2')} placeholder="Cargo" />
            <Firma campo="cert_firma2_url" n={2} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:col-span-2">
        <button className="btn-primario">Guardar cambios</button>
        <span className="text-sm text-gray-700">{estado}</span>
      </div>
    </form>
  )
}
