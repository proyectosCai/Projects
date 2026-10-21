/** Utilidades para rúbricas con secciones.
 *  La rúbrica puede tener textos sueltos (formato anterior) u objetos { texto, seccion }. */

export const seccionesDe = (evento) => {
  const s = Array.isArray(evento?.secciones) && evento.secciones.length ? evento.secciones : ['General']
  return s
}

export const preguntasDe = (evento) => {
  const secs = seccionesDe(evento)
  return (evento?.rubrica ?? []).map((q) =>
    typeof q === 'string' ? { texto: q, seccion: secs[0] } : { texto: q.texto ?? '', seccion: q.seccion || secs[0] })
}

/** ¿El evaluador califica esta sección? (secciones null/vacío = todas) */
export const leCorresponde = (evaluador, seccion) =>
  !evaluador?.secciones || evaluador.secciones.length === 0 || evaluador.secciones.includes(seccion)

/** Índices de las preguntas que le tocan a un evaluador */
export const indicesDe = (evento, evaluador) =>
  preguntasDe(evento).map((q, i) => (leCorresponde(evaluador, q.seccion) ? i : -1)).filter((i) => i >= 0)

/** Agrupa las preguntas (con su índice original) por sección, en el orden de las secciones */
export const agruparPorSeccion = (evento, indices = null) => {
  const preguntas = preguntasDe(evento)
  return seccionesDe(evento)
    .map((s) => ({
      seccion: s,
      preguntas: preguntas.map((q, i) => ({ ...q, i })).filter((q) => q.seccion === s && (!indices || indices.includes(q.i))),
    }))
    .filter((g) => g.preguntas.length > 0)
}

export const etiquetaSecciones = (evaluador, evento) => {
  const secs = seccionesDe(evento)
  if (secs.length <= 1 || !evaluador?.secciones?.length || evaluador.secciones.length >= secs.length) return null
  return evaluador.secciones.join(' · ')
}
<<<<<<< HEAD

/** ¿El jurado tiene asignación específica (fichas o proyectos)? */
export const tieneAsignacion = (ev) => (ev?.fichas?.length ?? 0) > 0 || (ev?.proyectos?.length ?? 0) > 0

/** ¿Este proyecto (con su ficha_id) le corresponde al jurado? */
export const asignado = (ev, proyecto) =>
  !tieneAsignacion(ev) || (ev.fichas ?? []).includes(proyecto.ficha_id) || (ev.proyectos ?? []).includes(proyecto.id)
=======
>>>>>>> e0d2edc72d6f67ab0e4b6b53dc4c3dc2287fe20e
