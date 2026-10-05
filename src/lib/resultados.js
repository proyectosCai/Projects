const promedio = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
export const redondear = (n, d = 2) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d)

/**
 * Calcula resultados por ficha.
 * - Puntaje del proyecto = promedio de los totales de los jurados que lo calificaron.
 * - Posición dentro de la ficha (empates comparten puesto). Sin calificar: al final, sin puesto.
 */
export function calcularResultados({ evento, fichas, evaluadores, calificaciones }) {
  const nPreg = (evento.rubrica ?? []).length
  const nombreEval = Object.fromEntries(evaluadores.map((e) => [e.id, e.nombre]))
  const porProyecto = {}
  for (const c of calificaciones) (porProyecto[c.proyecto_id] ??= []).push(c)

  return fichas.map((f) => {
    const proyectos = f.proyectos.map((p) => {
      const cs = porProyecto[p.id] ?? []
      const porPregunta = Array.from({ length: nPreg }, (_, i) =>
        redondear(promedio(cs.map((c) => c.puntajes?.[i]).filter((v) => v != null))))
      const calificadoPor = new Set(cs.map((c) => c.evaluador_id))
      return {
        ...p,
        nEvaluaciones: cs.length,
        promedio: redondear(promedio(cs.map((c) => c.total))),
        porPregunta,
        detalle: cs
          .map((c) => ({ ...c, evaluador: nombreEval[c.evaluador_id] ?? '—' }))
          .sort((a, b) => a.evaluador.localeCompare(b.evaluador)),
        pendientes: evaluadores.filter((e) => !calificadoPor.has(e.id)).map((e) => e.nombre),
      }
    })

    const calificados = proyectos.filter((p) => p.promedio != null).sort((a, b) => b.promedio - a.promedio)
    calificados.forEach((p, i) => {
      p.posicion = i > 0 && p.promedio === calificados[i - 1].promedio ? calificados[i - 1].posicion : i + 1
    })
    const sinCalificar = proyectos.filter((p) => p.promedio == null).map((p) => ({ ...p, posicion: null }))

    return { ...f, ranking: [...calificados, ...sinCalificar] }
  })
}

/** Ranking por ficha a partir de los resultados agregados públicos (rpc resultados_publicos) */
export function rankingPublico(fichas, agregados) {
  const porProyecto = Object.fromEntries(agregados.map((a) => [a.proyecto_id, a]))
  return fichas.map((f) => {
    const proyectos = f.proyectos.map((p) => {
      const a = porProyecto[p.id]
      return { ...p, nEvaluaciones: a?.n_jurados ?? 0, promedio: a ? Number(a.promedio) : null,
        porPregunta: (a?.por_pregunta ?? []).map(Number) }
    })
    const calificados = proyectos.filter((p) => p.promedio != null).sort((a, b) => b.promedio - a.promedio)
    calificados.forEach((p, i) => {
      p.posicion = i > 0 && p.promedio === calificados[i - 1].promedio ? calificados[i - 1].posicion : i + 1
    })
    const sin = proyectos.filter((p) => p.promedio == null).map((p) => ({ ...p, posicion: null }))
    return { ...f, ranking: [...calificados, ...sin] }
  })
}
