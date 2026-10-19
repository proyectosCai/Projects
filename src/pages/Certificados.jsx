import { useState } from 'react'
import { supabase, mensajeError } from '../lib/supabase'
import { descargarCertificado, NOMBRE_TIPO, fechaLarga } from '../lib/certificado'
import { color, degradado } from '../lib/colores'

const ICONO = { participacion: '🎓', ganador: '🏆', jurado: '⚖️' }
const COLOR = { participacion: 2, ganador: 4, jurado: 3 }
const PUESTO = { 1: '1er puesto', 2: '2º puesto', 3: '3er puesto' }

export default function Certificados() {
  const [documento, setDocumento] = useState('')
  const [lista, setLista] = useState(null)
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')

  const buscar = async (e) => {
    e.preventDefault()
    setEstado('buscando'); setError(''); setLista(null)
    const { data, error } = await supabase.rpc('mis_certificados_v2', { p_documento: documento })
    if (error) setError(mensajeError(error)); else setLista(data ?? [])
    setEstado('')
  }

  const descargar = async (c) => {
    setEstado(c.codigo)
    try { await descargarCertificado(c) } catch (err) { setError(mensajeError(err)) }
    setEstado('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sena-oscuro sm:text-3xl">Certificados</h1>
        <p className="text-gray-700">Escribe tu número de documento para descargar tus certificados de participación, reconocimiento o jurado.</p>
      </div>

      <form onSubmit={buscar} className="tarjeta flex gap-2">
        <input className="input text-lg" inputMode="numeric" placeholder="Número de documento" value={documento}
          onChange={(e) => setDocumento(e.target.value.replace(/[^0-9A-Za-z]/g, ''))} required minLength={5} />
        <button className="btn-primario" disabled={estado === 'buscando'}>{estado === 'buscando' ? 'Buscando…' : 'Buscar'}</button>
      </form>

      {error && <p className="tarjeta text-sm text-red-600">{error}</p>}
      {lista?.length === 0 && (
        <p className="tarjeta text-gray-700">No encontramos certificados disponibles para ese documento. Si participaste en un evento,
          confirma con tu instructor que tu documento esté registrado y que los certificados ya estén habilitados.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {lista?.map((c) => {
          const col = color(COLOR[c.tipo])
          return (
            <div key={c.codigo} className="overflow-hidden rounded-2xl bg-white shadow-md">
              <div className="flex items-center gap-3 p-4 text-white" style={{ background: degradado(col) }}>
                <span className="text-3xl">{ICONO[c.tipo]}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-85">{NOMBRE_TIPO[c.tipo]}{c.puesto ? ` · ${PUESTO[c.puesto]}` : ''}</p>
                  <p className="font-bold leading-snug">{c.evento}</p>
                </div>
              </div>
              <div className="space-y-1 p-4 text-sm">
                <p className="font-semibold">{c.nombre}</p>
                {c.proyecto && <p className="text-gray-600">Proyecto: {c.proyecto}</p>}
                {c.ficha && <p className="text-gray-600">{c.etiqueta_grupo} {c.ficha}{c.institucion ? ` · ${c.institucion}` : ''}</p>}
                {c.fecha && <p className="text-gray-500">{fechaLarga(c.fecha)}</p>}
                <button className="btn-primario mt-3 w-full" onClick={() => descargar(c)} disabled={estado === c.codigo}>
                  {estado === c.codigo ? 'Generando…' : '⬇ Descargar PDF'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
