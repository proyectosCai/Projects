import { redondear } from './resultados'
import { etiquetaGrupo, detalleGrupo } from './grupos'

const VERDE = 'FF39A900'

function nombreHoja(base, usados) {
  let n = base.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
  let k = 2
  while (usados.has(n)) n = `${base.slice(0, 27)} (${k++})`
  usados.add(n)
  return n
}

function estilizarEncabezado(fila) {
  fila.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  fila.alignment = { vertical: 'middle', wrapText: true }
  fila.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } } })
}

export async function exportarExcel(evento, resultados) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const preguntas = evento.rubrica ?? []
  const maxTotal = preguntas.length * evento.escala_max
  const usados = new Set()

  // Una hoja por ficha
  for (const f of resultados) {
    const ws = wb.addWorksheet(nombreHoja(etiquetaGrupo(f), usados))
    ws.addRow([`${evento.nombre} — ${etiquetaGrupo(f)}${detalleGrupo(f) ? ` · ${detalleGrupo(f)}` : ''}`]).font = { bold: true, size: 13 }
    ws.addRow([`Puntaje = promedio de los totales de los jurados (máximo ${maxTotal})`]).font = { italic: true, color: { argb: 'FF666666' } }
    ws.addRow([])
    const enc = ws.addRow(['Puesto', 'Proyecto', 'Integrantes', 'N° jurados', 'Puntaje promedio', ...preguntas.map((_, i) => `P${i + 1}`)])
    estilizarEncabezado(enc)
    for (const p of f.ranking) {
      ws.addRow([p.posicion ?? '—', p.nombre, p.integrantes ?? '', p.nEvaluaciones, p.promedio ?? 'Sin calificar', ...p.porPregunta.map((v) => v ?? '')])
    }
    ws.getColumn(1).width = 8
    ws.getColumn(2).width = 45
    ws.getColumn(3).width = 28
    ws.getColumn(4).width = 11
    ws.getColumn(5).width = 16
    preguntas.forEach((_, i) => { ws.getColumn(6 + i).width = 6 })
    ws.getColumn(2).alignment = { wrapText: true, vertical: 'top' }
    ws.views = [{ state: 'frozen', ySplit: 4 }]

    ws.addRow([])
    preguntas.forEach((q, i) => ws.addRow([`P${i + 1}`, q]))
  }

  // Detalle de todas las calificaciones
  const det = wb.addWorksheet(nombreHoja('Detalle', usados))
  estilizarEncabezado(det.addRow(['Ficha / grupo', 'Institución', 'Proyecto', 'Jurado', ...preguntas.map((_, i) => `P${i + 1}`), 'Total', 'Observación', 'Fecha']))
  for (const f of resultados) {
    for (const p of f.ranking) {
      for (const c of p.detalle) {
        det.addRow([etiquetaGrupo(f), f.institucion ?? '', p.nombre, c.evaluador, ...preguntas.map((_, i) => c.puntajes?.[i] ?? ''), c.total,
          c.observacion ?? '', new Date(c.updated_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })])
      }
    }
  }
  det.getColumn(1).width = 18; det.getColumn(2).width = 28; det.getColumn(3).width = 40; det.getColumn(4).width = 26
  det.getColumn(preguntas.length + 6).width = 40; det.getColumn(preguntas.length + 7).width = 20
  det.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Resultados - ${evento.nombre}.xlsx`.replace(/[\\/:*?"<>|]/g, ' ')
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return redondear(blob.size / 1024, 0)
}
