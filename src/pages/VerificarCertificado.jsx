import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, mensajeError } from '../lib/supabase'
import { NOMBRE_TIPO, fechaLarga } from '../lib/certificado'

export default function VerificarCertificado() {
  const { codigo } = useParams()
  const [cert, setCert] = useState(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('verificar_certificado_v2', { p_codigo: codigo }).then(({ data, error }) => {
      if (error) setError(mensajeError(error)); else setCert(data?.[0] ?? null)
    })
  }, [codigo])

  if (error) return <p className="tarjeta text-red-600">{error}</p>
  if (cert === undefined) return <p className="text-gray-600">Verificando…</p>

  return (
    <div className="mx-auto max-w-lg">
      {cert ? (
        <div className="overflow-hidden rounded-2xl bg-white text-center shadow-lg">
          <div className="bg-gradient-to-br from-sena to-sena-oscuro p-6 text-white">
            <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-sena shadow">✓</p>
            <p className="mt-3 text-2xl font-bold">Certificado válido</p>
            <p className="font-mono text-sm tracking-widest opacity-85">{codigo.toUpperCase()}</p>
          </div>
          <dl className="space-y-3 p-6 text-left text-sm">
            <Fila t="Otorgado a" v={cert.nombre} fuerte />
            <Fila t="Tipo" v={`${NOMBRE_TIPO[cert.tipo]}${cert.puesto ? ` · puesto ${cert.puesto}` : ''}`} />
            {cert.proyecto && <Fila t="Proyecto" v={cert.proyecto} />}
            {cert.ficha && <Fila t={cert.etiqueta_grupo} v={`${cert.ficha}${cert.programa ? ` · ${cert.programa}` : ''}`} />}
            {cert.institucion && <Fila t="Institución" v={cert.institucion} />}
            <Fila t="Evento" v={`${cert.evento}${cert.fecha ? ` (${fechaLarga(cert.fecha)})` : ''}`} />
            <Fila t="Entidad" v={cert.entidad} />
            <Fila t="Expedido" v={new Date(cert.emitido_at).toLocaleDateString('es-CO', { dateStyle: 'long' })} />
          </dl>
        </div>
      ) : (
        <div className="tarjeta py-10 text-center">
          <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">✕</p>
          <p className="mt-3 text-2xl font-bold text-red-700">Certificado no encontrado</p>
          <p className="mt-1 text-gray-600">El código <b className="font-mono">{codigo}</b> no corresponde a ningún certificado expedido por Project-APP.</p>
          <Link to="/" className="btn-secundario mt-5">Ir al inicio</Link>
        </div>
      )}
    </div>
  )
}

function Fila({ t, v, fuerte }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-gray-100 pb-2">
      <dt className="text-gray-500">{t}</dt>
      <dd className={fuerte ? 'text-base font-bold' : ''}>{v}</dd>
    </div>
  )
}
