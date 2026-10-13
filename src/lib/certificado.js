import logoSena from '../assets/sena-cai.png'
import logoSennova from '../assets/sennova.png'
import logoBio from '../assets/biometronica.png'
import logoApp from '../assets/logo-app.png'

const PUESTOS = { 1: 'PRIMER PUESTO', 2: 'SEGUNDO PUESTO', 3: 'TERCER PUESTO' }
const TITULOS = { participacion: 'CERTIFICADO DE PARTICIPACIÓN', ganador: 'CERTIFICADO DE RECONOCIMIENTO', jurado: 'CERTIFICADO DE JURADO EVALUADOR' }
export const NOMBRE_TIPO = { participacion: 'Participación', ganador: 'Ganador', jurado: 'Jurado evaluador' }

async function aDataUrl(url) {
  const blob = await (await fetch(url)).blob()
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob) })
}
async function medidas(dataUrl) {
  const img = new Image(); img.src = dataUrl; await img.decode()
  return { w: img.naturalWidth, h: img.naturalHeight }
}
async function aPng(dataUrl) {
  if (dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/jpeg')) return dataUrl
  const img = new Image(); img.src = dataUrl; await img.decode()
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight
  cv.getContext('2d').drawImage(img, 0, 0)
  return cv.toDataURL('image/png')
}
async function imagen(doc, url, x, y, alto, { centrada = false, derecha = false } = {}) {
  try {
    const data = await aPng(await aDataUrl(url))
    const tipo = data.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
    const { w, h } = await medidas(data)
    const ancho = (w / h) * alto
    const px = centrada ? x - ancho / 2 : derecha ? x - ancho : x
    doc.addImage(data, tipo, px, y, ancho, alto)
  } catch { /* si una imagen falla, el certificado sale sin ella */ }
}

export const fechaLarga = (f) => (f ? new Date(`${f}T12:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

const hexARgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '')
  if (!m) return [57, 169, 0]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const oscurecer = (rgb, f = 0.72) => rgb.map((v) => Math.round(v * f))
const aclarar = (rgb, f = 0.94) => rgb.map((v) => Math.round(v + (255 - v) * f))

function cuerpo(c) {
  const fecha = c.fecha ? `, realizado el ${fechaLarga(c.fecha)}` : ''
  const horas = c.horas ? `, con una intensidad de ${c.horas} horas` : ''
  const grupo = (c.etiqueta_grupo || 'Ficha').toLowerCase() === 'grupo' ? 'del grupo' : 'de la ficha'
  const inst = c.institucion ? `, ${c.institucion}` : ''
  const ficha = c.ficha ? ` ${grupo} ${c.ficha}${c.programa ? ` (${c.programa}${inst})` : inst}` : ''
  if (c.tipo === 'jurado') return `participó como jurado evaluador de los proyectos presentados en el evento «${c.evento}»${fecha}${horas}.`
  if (c.tipo === 'ganador') return `obtuvo el ${PUESTOS[c.puesto]?.toLowerCase() ?? `puesto ${c.puesto}`}${ficha} con el proyecto «${c.proyecto}», en el evento «${c.evento}»${fecha}.`
  return `participó como integrante del proyecto «${c.proyecto}»${ficha}, presentado en el evento «${c.evento}»${fecha}${horas}.`
}

/** Genera y descarga el PDF del certificado */
export async function descargarCertificado(c) {
  const [{ jsPDF }, QR] = await Promise.all([import('jspdf'), import('qrcode')])
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const verde = hexARgb(c.color)
  const verdeOsc = oscurecer(verde)
  const propios = Array.isArray(c.logos) && c.logos.length > 0
  const urlVerificar = `${window.location.origin}/verificar/${c.codigo}`

  // Marco y franjas
  doc.setFillColor(...aclarar(verde)); doc.rect(0, 0, W, H, 'F')
  doc.setFillColor(...verde); doc.rect(0, 0, W, 5, 'F'); doc.rect(0, H - 5, W, 5, 'F')
  doc.setDrawColor(...verde); doc.setLineWidth(1.2); doc.rect(9, 11, W - 18, H - 22)
  doc.setLineWidth(0.3); doc.rect(11.5, 13.5, W - 23, H - 27)

  // Marca de agua del logo
  try {
    const app = await aDataUrl(logoApp)
    doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.06 }))
    doc.addImage(app, 'PNG', W / 2 - 55, H / 2 - 50, 110, 110)
    doc.restoreGraphicsState()
  } catch { /* opcional */ }

  // Logos: los del evento (si se configuraron) o los predeterminados, + logo de la institución del proyecto
  const lista = propios ? [...c.logos] : [logoSena, logoSennova]
  if (c.institucion_logo_url && !lista.includes(c.institucion_logo_url)) lista.push(c.institucion_logo_url)
  if (lista.length === 2) {
    await imagen(doc, lista[0], 20, 20, 17)
    await imagen(doc, lista[1], W - 20, 21, 15, { derecha: true })
  } else {
    const paso = (W - 40) / lista.length
    for (const [i, u] of lista.entries()) await imagen(doc, u, 20 + paso * (i + 0.5), 20, 16, { centrada: true })
  }

  // Textos
  doc.setTextColor(60, 60, 60); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text(c.entidad || '', W / 2, 47, { align: 'center', maxWidth: W - 70 })
  doc.setTextColor(...verdeOsc); doc.setFontSize(21)
  doc.text(TITULOS[c.tipo], W / 2, 60, { align: 'center' })
  doc.setTextColor(90, 90, 90); doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
  doc.text('CERTIFICA QUE', W / 2, 71, { align: 'center', charSpace: 1.5 })

  doc.setTextColor(25, 25, 25); doc.setFont('helvetica', 'bold'); doc.setFontSize(26)
  doc.text(c.nombre.toUpperCase(), W / 2, 86, { align: 'center', maxWidth: W - 50 })
  doc.setDrawColor(...verde); doc.setLineWidth(0.6); doc.line(W / 2 - 75, 90, W / 2 + 75, 90)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(70, 70, 70)
  doc.text(`Identificado(a) con documento N° ${c.documento}`, W / 2, 97, { align: 'center' })

  let y = 110
  if (c.tipo === 'ganador') {
    const oro = { 1: [212, 160, 23], 2: [140, 140, 150], 3: [196, 110, 40] }[c.puesto] ?? verde
    doc.setFillColor(...oro); doc.roundedRect(W / 2 - 40, y - 7, 80, 11, 3, 3, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
    doc.text(PUESTOS[c.puesto] ?? `PUESTO ${c.puesto}`, W / 2, y + 0.8, { align: 'center' })
    y += 14
  }
  doc.setTextColor(40, 40, 40); doc.setFont('helvetica', 'normal'); doc.setFontSize(13)
  const lineas = doc.splitTextToSize(cuerpo(c), W - 80)
  doc.text(lineas, W / 2, y, { align: 'center', lineHeightFactor: 1.4 })

  // Firmas (una centrada o dos lado a lado)
  const yFirma = H - 52
  const firmas = [[c.firmante, c.cargo, c.firma_url], [c.firmante2, c.cargo2, c.firma2_url]].filter(([n]) => n)
  if (firmas.length === 0) firmas.push(['', '', null])
  const xs = firmas.length === 2 ? [W / 2 - 55, W / 2 + 35] : [W / 2]
  for (const [i, [nombre, cargo, firma]] of firmas.entries()) {
    const x = xs[i]
    if (firma) await imagen(doc, firma, x, yFirma - 20, 20, { centrada: true })
    doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.3); doc.line(x - 38, yFirma + 1, x + 38, yFirma + 1)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 30, 30)
    doc.text(nombre || ' ', x, yFirma + 6, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(90, 90, 90)
    doc.text(cargo || ' ', x, yFirma + 11, { align: 'center', maxWidth: 80 })
  }

  // Pie: semillero (solo con logos predeterminados), fecha de expedición y QR
  if (!propios) await imagen(doc, logoBio, 20, H - 30, 6)
  doc.setFontSize(8.5); doc.setTextColor(100, 100, 100)
  doc.text(`Expedido el ${new Date(c.emitido_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, H - 19)

  const qr = await QR.toDataURL(urlVerificar, { margin: 0, width: 300, color: { dark: '#' + verdeOsc.map((v) => v.toString(16).padStart(2, '0')).join('') } })
  doc.addImage(qr, 'PNG', W - 46, H - 52, 26, 26)
  doc.setFontSize(7.5)
  doc.text(`Código: ${c.codigo}`, W - 33, H - 22, { align: 'center' })
  doc.text('Verifique escaneando el QR', W - 33, H - 18.5, { align: 'center' })

  doc.save(`Certificado ${NOMBRE_TIPO[c.tipo]} - ${c.nombre}.pdf`.replace(/[\\/:*?"<>|]/g, ' '))
}
