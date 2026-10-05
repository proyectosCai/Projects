// Paleta para dar color a fichas y proyectos (tonos del logo: verdes, turquesas, azules)
export const PALETA = [
  { de: '#39a900', a: '#7ed321', suave: '#eef8e6', texto: '#2b7d00' },
  { de: '#0f9d8a', a: '#38d1b5', suave: '#e6f7f4', texto: '#0b6f62' },
  { de: '#1f7ae0', a: '#4fb3ff', suave: '#e8f2fd', texto: '#155bab' },
  { de: '#7b4fe0', a: '#b18cff', suave: '#f1ecfd', texto: '#5a35b3' },
  { de: '#e0861f', a: '#ffc04d', suave: '#fdf3e6', texto: '#a85f0e' },
  { de: '#d6336c', a: '#ff7aa2', suave: '#fdebf1', texto: '#a3214f' },
]
export const color = (i) => PALETA[((i % PALETA.length) + PALETA.length) % PALETA.length]
export const degradado = (c) => `linear-gradient(135deg, ${c.de}, ${c.a})`
