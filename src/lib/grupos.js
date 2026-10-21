/** "Ficha 2758941" o "Grupo Universidad X" según el tipo de grupo */
export const etiquetaGrupo = (f) => `${f?.tipo_grupo || 'Ficha'} ${f?.numero ?? ''}`.trim()
export const tipoGrupo = (f) => f?.tipo_grupo || 'Ficha'
/** Línea secundaria: programa · institución */
export const detalleGrupo = (f) => [f?.programa, f?.institucion].filter(Boolean).join(' · ')
