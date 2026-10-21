import { supabase } from './supabase'

/** Reduce la imagen en el navegador (ancho máx.) para que cargue rápido */
async function reducir(file, maxAncho, tipo) {
  const bmp = await createImageBitmap(file)
  const escala = Math.min(1, maxAncho / bmp.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * escala)
  canvas.height = Math.round(bmp.height * escala)
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((res) => canvas.toBlob(res, tipo, 0.85))
}

/** Sube una imagen al bucket público "imagenes" y devuelve su URL */
export async function subirImagen(file, carpeta, { maxAncho = 1400, png = false } = {}) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Usa una imagen PNG, JPG o WEBP.')
  const tipo = png ? 'image/png' : 'image/webp'
  const blob = await reducir(file, maxAncho, tipo)
  const ruta = `${carpeta}/${Date.now()}.${png ? 'png' : 'webp'}`
  const { error } = await supabase.storage.from('imagenes').upload(ruta, blob, { contentType: tipo, upsert: true })
  if (error) throw error
  return supabase.storage.from('imagenes').getPublicUrl(ruta).data.publicUrl
}
