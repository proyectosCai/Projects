import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function Compartir({ evento }) {
  const enlace = `${window.location.origin}/evento/${evento.id}`
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try { await navigator.clipboard.writeText(enlace); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* sin portapapeles */ }
  }

  return (
    <div className="tarjeta flex flex-col items-center gap-4 text-center">
      {!evento.activo && (
        <p className="w-full rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          El evento está <b>inactivo</b>. Actívalo en la pestaña <i>Datos</i> para que los jurados puedan calificar.
        </p>
      )}
      <p className="text-lg font-semibold">{evento.nombre}</p>
      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
        <QRCodeSVG value={enlace} size={220} />
      </div>
      <div className="flex w-full max-w-lg gap-2">
        <input className="input font-mono text-xs" value={enlace} readOnly />
        <button className="btn-secundario" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar'}</button>
      </div>
      <p className="text-sm text-gray-600">Los jurados abren el enlace, eligen su nombre y califican.</p>
      <button className="btn-secundario" onClick={() => window.print()}>Imprimir</button>
    </div>
  )
}
