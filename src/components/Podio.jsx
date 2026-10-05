const MEDALLAS = {
  1: { icono: '🥇', texto: 'Primer lugar', clase: 'bg-amber-50 border-amber-300' },
  2: { icono: '🥈', texto: 'Segundo lugar', clase: 'bg-gray-50 border-gray-300' },
  3: { icono: '🥉', texto: 'Tercer lugar', clase: 'bg-orange-50 border-orange-300' },
}

export default function Podio({ ranking, maxTotal }) {
  const podio = ranking.filter((p) => p.posicion && p.posicion <= 3)
  if (podio.length === 0) return null
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {podio.map((p) => (
        <div key={p.id} className={`rounded-xl border-2 p-4 text-center ${MEDALLAS[p.posicion].clase}`}>
          <p className="text-3xl">{MEDALLAS[p.posicion].icono}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{MEDALLAS[p.posicion].texto}</p>
          <p className="mt-1 font-bold leading-snug">{p.nombre}</p>
          <p className="mt-2 text-2xl font-bold text-sena-oscuro">{p.promedio}</p>
          <p className="text-xs text-gray-500">de {maxTotal} · {p.nEvaluaciones} jurado{p.nEvaluaciones !== 1 && 's'}</p>
        </div>
      ))}
    </div>
  )
}
