import { useState } from 'react'
import { mensajeError } from '../lib/supabase'
import { buscarPorCodigo, subirTrabajo, validarArchivo, MAX_MB } from '../lib/trabajos'
import { color, degradado } from '../lib/colores'

export default function SubirTrabajo() {
  const [codigo, setCodigo] = useState('')
  const [proyecto, setProyecto] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [estado, setEstado] = useState('') // '', 'buscando', 'subiendo', 'listo'
  const [error, setError] = useState('')
  const c = color(1)

  const buscar = async (ev) => {
    ev.preventDefault()
    setError(''); setEstado('buscando'); setProyecto(null)
    try {
      const p = await buscarPorCodigo(codigo.trim().toUpperCase())
      if (!p) setError('No encontramos un proyecto con ese código. Revísalo con tu instructor.')
      else setProyecto(p)
    } catch (e) { setError(mensajeError(e)) }
    setEstado('')
  }

  const elegir = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const msg = validarArchivo(f)
    setError(msg); setArchivo(msg ? null : f)
  }

  const subir = async () => {
    setError(''); setEstado('subiendo')
    try {
      await subirTrabajo(codigo.trim().toUpperCase(), archivo)
      setEstado('listo')
    } catch (e) { setError(mensajeError(e)); setEstado('') }
  }

  const reiniciar = () => { setCodigo(''); setProyecto(null); setArchivo(null); setEstado(''); setError('') }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sena-oscuro sm:text-3xl">Subir trabajo</h1>
        <p className="text-gray-700">Ingresa el código de tu proyecto (te lo da tu instructor) y sube el documento en PDF o Word.</p>
      </div>

      {estado === 'listo' ? (
        <div className="tarjeta py-10 text-center">
          <p className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white shadow-lg" style={{ background: degradado(c) }}>✓</p>
          <p className="mt-3 text-2xl font-bold text-sena-oscuro">¡Trabajo recibido!</p>
          <p className="mt-1 text-gray-600">{archivo?.name}</p>
          <p className="text-sm text-gray-500">{proyecto?.proyecto}</p>
          <button className="btn-secundario mt-5" onClick={reiniciar}>Subir otro trabajo</button>
        </div>
      ) : (
        <>
          <form onSubmit={buscar} className="tarjeta flex gap-2">
            <input className="input text-center font-mono text-xl uppercase tracking-[0.3em]" maxLength={6} placeholder="CÓDIGO"
              value={codigo} onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setProyecto(null) }} required />
            <button className="btn-primario" disabled={estado === 'buscando' || codigo.trim().length < 6}>
              {estado === 'buscando' ? 'Buscando…' : 'Buscar'}</button>
          </form>

          {proyecto && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-md">
              <div className="p-5 text-white" style={{ background: degradado(c) }}>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{proyecto.evento} · Ficha {proyecto.ficha}</p>
                <p className="text-xl font-bold leading-snug">{proyecto.proyecto}</p>
                {proyecto.integrantes && <p className="mt-1 text-sm opacity-90">👥 {proyecto.integrantes}</p>}
              </div>
              <div className="space-y-4 p-5">
                {!proyecto.recibe_trabajos ? (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">La recepción de trabajos para este evento está cerrada.</p>
                ) : (
                  <>
                    {proyecto.trabajo_nombre && (
                      <p className="rounded-lg bg-sena-claro p-3 text-sm">
                        Ya hay un trabajo subido: <b>{proyecto.trabajo_nombre}</b>
                        {proyecto.trabajo_subido_at && ` (${new Date(proyecto.trabajo_subido_at).toLocaleString('es-CO')})`}.
                        Si subes otro, reemplaza al anterior.
                      </p>
                    )}
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-sena/50 bg-sena-claro/40 p-6 text-center hover:bg-sena-claro">
                      <span className="text-4xl">📄</span>
                      <span className="font-semibold text-sena-oscuro">{archivo ? archivo.name : 'Toca para elegir el archivo'}</span>
                      <span className="text-xs text-gray-500">PDF o Word · máximo {MAX_MB} MB</span>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={elegir} />
                    </label>
                    <button className="btn-primario w-full py-3" onClick={subir} disabled={!archivo || estado === 'subiendo'}>
                      {estado === 'subiendo' ? 'Subiendo… no cierres la página' : 'Subir trabajo'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {error && <p className="tarjeta text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
