import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../../../lib/supabase'
import { color, degradado } from '../../../lib/colores'
import { abrirTrabajo } from '../../../lib/trabajos'
import { subirImagen } from '../../../lib/imagenes'
import { etiquetaGrupo, detalleGrupo } from '../../../lib/grupos'

export default function Fichas({ evento }) {
  const [fichas, setFichas] = useState(null)
  const [codigos, setCodigos] = useState({})
  const [integrantes, setIntegrantes] = useState({})
  const [nueva, setNueva] = useState({ tipo_grupo: 'Ficha', numero: '', programa: '', institucion: '' })
  const setN = (k) => (e) => setNueva((x) => ({ ...x, [k]: e.target.value }))
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('fichas')
      .select('*, proyectos(*)').eq('evento_id', evento.id)
      .order('orden').order('numero')
    if (error) setError(mensajeError(error))
    const ids = (data ?? []).flatMap((f) => f.proyectos.map((p) => p.id))
    if (ids.length) {
      const { data: cs } = await supabase.from('proyecto_codigo').select('*').in('proyecto_id', ids)
      setCodigos(Object.fromEntries((cs ?? []).map((c) => [c.proyecto_id, c.codigo])))
      const { data: is } = await supabase.from('integrantes').select('*').in('proyecto_id', ids).order('orden')
      const agrupados = {}
      for (const i of is ?? []) (agrupados[i.proyecto_id] ??= []).push(i)
      setIntegrantes(agrupados)
    }
    setFichas((data ?? []).map((f) => ({ ...f, proyectos: [...f.proyectos].sort((a, b) => a.orden - b.orden) })))
  }, [evento.id])
  useEffect(() => { cargar() }, [cargar])

  const agregarFicha = async (ev) => {
    ev.preventDefault()
    setError('')
    const { error } = await supabase.from('fichas')
      .insert({ evento_id: evento.id, tipo_grupo: nueva.tipo_grupo, numero: nueva.numero.trim(),
        programa: nueva.programa.trim() || null, institucion: nueva.institucion.trim() || null, orden: fichas.length })
    if (error) return setError(mensajeError(error))
    setNueva((x) => ({ ...x, numero: '', programa: '' })); cargar()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={agregarFicha} className="tarjeta grid gap-3 sm:grid-cols-2 lg:grid-cols-[120px_160px_1fr_1fr_auto] lg:items-end">
        <div>
          <label className="etiqueta">Tipo</label>
          <select className="input" value={nueva.tipo_grupo} onChange={setN('tipo_grupo')}>
            <option>Ficha</option><option>Grupo</option>
          </select>
        </div>
        <div>
          <label className="etiqueta">{nueva.tipo_grupo === 'Ficha' ? 'N° de ficha' : 'Nombre del grupo'}</label>
          <input className="input" placeholder={nueva.tipo_grupo === 'Ficha' ? 'Ej: 2758941' : 'Ej: Ingeniería 5A'} value={nueva.numero} onChange={setN('numero')} required />
        </div>
        <div>
          <label className="etiqueta">Programa (opcional)</label>
          <input className="input" placeholder="Ej: Técnico en Programación de Software" value={nueva.programa} onChange={setN('programa')} />
        </div>
        <div>
          <label className="etiqueta">Centro / institución (opcional)</label>
          <input className="input" placeholder="Ej: Centro de Automatización Industrial" value={nueva.institucion} onChange={setN('institucion')} />
        </div>
        <button className="btn-primario">Agregar</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {fichas === null && <p className="text-gray-500">Cargando…</p>}
      {fichas?.length === 0 && <p className="text-gray-500">Agrega la primera ficha o grupo.</p>}
      {fichas?.length > 0 && (
        <div className="flex justify-end">
          <button className="btn-secundario" onClick={() => imprimirCodigos(evento, fichas, codigos)}>🖨 Imprimir códigos de subida</button>
        </div>
      )}
      {fichas?.map((f, i) => <TarjetaFicha key={f.id} ficha={f} indice={i} codigos={codigos} integrantes={integrantes} recargar={cargar} />)}
    </div>
  )
}

function TarjetaFicha({ ficha, indice, codigos, integrantes, recargar }) {
  const [editando, setEditando] = useState(null)
  const [editandoFicha, setEditandoFicha] = useState(false)
  const c = color(indice)
  const [nuevos, setNuevos] = useState('')
  const [error, setError] = useState('')

  const agregarProyectos = async () => {
    const nombres = nuevos.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!nombres.length) return
    const base = ficha.proyectos.length
    const { error } = await supabase.from('proyectos')
      .insert(nombres.map((nombre, i) => ({ ficha_id: ficha.id, nombre, orden: base + i })))
    if (error) return setError(mensajeError(error))
    setNuevos(''); recargar()
  }

  const eliminarFicha = async () => {
    if (!confirm(`¿Eliminar ${etiquetaGrupo(ficha)} con sus proyectos y calificaciones?`)) return
    const { error } = await supabase.from('fichas').delete().eq('id', ficha.id)
    if (error) return setError(mensajeError(error))
    recargar()
  }

  const actualizarProyecto = async (p, cambios) => {
    const { error } = await supabase.from('proyectos').update(cambios).eq('id', p.id)
    if (error) setError(mensajeError(error))
  }

  const eliminarProyecto = async (p) => {
    if (!confirm(`¿Eliminar el proyecto "${p.nombre}" y sus calificaciones?`)) return
    const { error } = await supabase.from('proyectos').delete().eq('id', p.id)
    if (error) return setError(mensajeError(error))
    recargar()
  }

  const verTrabajo = async (p) => {
    try { await abrirTrabajo(p) } catch (e) { setError(mensajeError(e)) }
  }

  const quitarTrabajo = async (p) => {
    if (!confirm(`¿Quitar el trabajo "${p.trabajo_nombre}" del proyecto?`)) return
    await supabase.storage.from('trabajos').remove([p.trabajo_path])
    await actualizarProyecto(p, { trabajo_path: null, trabajo_nombre: null, trabajo_subido_at: null })
    recargar()
  }

  return (
    <div className="tarjeta space-y-3 overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 p-4 text-white" style={{ background: degradado(c) }}>
        <div className="flex items-center gap-3">
          {ficha.institucion_logo_url && <img src={ficha.institucion_logo_url} alt="" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />}
          <div>
            <p className="text-lg font-bold">{etiquetaGrupo(ficha)}</p>
            {detalleGrupo(ficha) && <p className="text-sm opacity-90">{detalleGrupo(ficha)}</p>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/30" onClick={() => setEditandoFicha((v) => !v)}>Editar</button>
          <button className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/30" onClick={eliminarFicha}>Eliminar</button>
        </div>
      </div>
      <div className="space-y-3 px-5 pb-5">
      {editandoFicha && <EditorFicha ficha={ficha} onGuardado={() => { setEditandoFicha(false); recargar() }} />}

      {ficha.proyectos.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {ficha.proyectos.map((p, i) => (
            <li key={p.id} className="grid gap-2 p-2 sm:grid-cols-[24px_1fr_auto_auto] sm:items-center">
              <span className="text-sm font-semibold text-gray-400">{i + 1}</span>
              <input className="input" defaultValue={p.nombre} title="Nombre del proyecto"
                onBlur={(e) => e.target.value.trim() && e.target.value !== p.nombre && actualizarProyecto(p, { nombre: e.target.value.trim() })} />
              <button className={`btn-secundario ${editando === p.id ? 'ring-2 ring-sena' : ''}`} onClick={() => setEditando(editando === p.id ? null : p.id)}>
                👥 Integrantes ({integrantes[p.id]?.length ?? 0})</button>
              <button className="btn-peligro px-2" title="Eliminar proyecto" onClick={() => eliminarProyecto(p)}>✕</button>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:col-start-2 sm:col-span-3">
                <span className="rounded-md bg-gray-100 px-2 py-1 font-mono font-semibold tracking-widest text-gray-700" title="Código para subir el trabajo">
                  🔑 {codigos[p.id] ?? '······'}</span>
                {p.trabajo_path ? (
                  <>
                    <button className="rounded-md bg-sena-claro px-2 py-1 font-medium text-sena-oscuro hover:underline" onClick={() => verTrabajo(p)}>
                      📄 {p.trabajo_nombre}</button>
                    <button className="text-red-600 hover:underline" onClick={() => quitarTrabajo(p)}>quitar</button>
                  </>
                ) : <span className="text-gray-400">Sin trabajo subido</span>}
              </div>
              {editando === p.id && (
                <EditorIntegrantes proyecto={p} lista={integrantes[p.id] ?? []}
                  onGuardado={() => { setEditando(null); recargar() }} />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <label className="etiqueta">Agregar proyectos (uno por línea)</label>
        <textarea className="input min-h-[70px]" value={nuevos} onChange={(e) => setNuevos(e.target.value)}
          placeholder={'Sistema de inventario para tienda de barrio\nApp de citas médicas'} />
        <button className="btn-secundario" onClick={agregarProyectos}>+ Agregar</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

function imprimirCodigos(evento, fichas, codigos) {
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]))
  const url = `${window.location.origin}/subir`
  const filas = fichas.map((f) => `
    <h2>${esc(etiquetaGrupo(f))}${detalleGrupo(f) ? ' · ' + esc(detalleGrupo(f)) : ''}</h2>
    <table><tr><th>Proyecto</th><th>Código</th></tr>
    ${f.proyectos.map((p) => `<tr><td>${esc(p.nombre)}</td><td class="c">${esc(codigos[p.id])}</td></tr>`).join('')}
    </table>`).join('')
  const w = window.open('', '_blank')
  if (!w) return alert('Permite las ventanas emergentes para imprimir.')
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Códigos - ${esc(evento.nombre)}</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;color:#222}h1{color:#2b7d00;margin:0}h2{color:#39a900;margin-top:24px}
    table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left}
    .c{font-family:monospace;font-size:20px;letter-spacing:4px;font-weight:bold;width:140px;text-align:center}</style></head>
    <body><h1>${esc(evento.nombre)}</h1><p>Sube tu trabajo en <b>${esc(url)}</b> con el código de tu proyecto.</p>${filas}
    <script>window.onload=()=>window.print()<\/script></body></html>`)
  w.document.close()
}

function EditorIntegrantes({ proyecto, lista, onGuardado }) {
  const [texto, setTexto] = useState(lista.map((i) => `${i.nombre} ; ${i.documento}`).join('\n'))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    const filas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
    const datos = []
    for (const [n, l] of filas.entries()) {
      const [nombre, documento] = l.split(/[;\t]/).map((x) => x?.trim())
      if (!nombre || !documento) return setError(`Línea ${n + 1}: usa el formato  Nombre completo ; documento`)
      datos.push({ proyecto_id: proyecto.id, nombre, documento: documento.replace(/[^0-9A-Za-z]/g, ''), orden: n })
    }
    setGuardando(true); setError('')
    const r1 = await supabase.from('integrantes').delete().eq('proyecto_id', proyecto.id)
    const r2 = datos.length ? await supabase.from('integrantes').insert(datos) : { error: null }
    const r3 = await supabase.from('proyectos').update({ integrantes: datos.map((d) => d.nombre).join(', ') || null }).eq('id', proyecto.id)
    setGuardando(false)
    const err = r1.error || r2.error || r3.error
    if (err) return setError(mensajeError(err))
    onGuardado()
  }

  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3 sm:col-span-4">
      <label className="etiqueta">Integrantes de «{proyecto.nombre}» — uno por línea: <code>Nombre completo ; documento</code></label>
      <textarea className="input min-h-[90px] font-mono text-xs" value={texto} onChange={(e) => setTexto(e.target.value)}
        placeholder={'Ana María Gómez ; 1053999111\nLuis Pérez ; 1002345678'} />
      <p className="text-xs text-gray-500">El documento es privado: solo se usa para que cada aprendiz descargue su certificado.</p>
      <div className="flex items-center gap-2">
        <button className="btn-primario" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar integrantes'}</button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}

function EditorFicha({ ficha, onGuardado }) {
  const [f, setF] = useState({ tipo_grupo: ficha.tipo_grupo || 'Ficha', numero: ficha.numero, programa: ficha.programa ?? '', institucion: ficha.institucion ?? '' })
  const [logo, setLogo] = useState(ficha.institucion_logo_url)
  const [estado, setEstado] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const cambiarLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEstado('Subiendo logo…')
    try { setLogo(await subirImagen(file, `fichas/${ficha.id}`, { maxAncho: 500, png: true })); setEstado('') }
    catch (err) { setEstado(mensajeError(err)) }
  }

  const guardar = async () => {
    setEstado('Guardando…')
    const { error } = await supabase.from('fichas').update({
      tipo_grupo: f.tipo_grupo, numero: f.numero.trim(), programa: f.programa.trim() || null,
      institucion: f.institucion.trim() || null, institucion_logo_url: logo || null,
    }).eq('id', ficha.id)
    if (error) return setEstado(mensajeError(error))
    onGuardado()
  }

  return (
    <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2">
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <select className="input" value={f.tipo_grupo} onChange={set('tipo_grupo')}><option>Ficha</option><option>Grupo</option></select>
        <input className="input" value={f.numero} onChange={set('numero')} placeholder="N° / nombre" />
      </div>
      <input className="input" value={f.programa} onChange={set('programa')} placeholder="Programa" />
      <input className="input" value={f.institucion} onChange={set('institucion')} placeholder="Centro / institución" />
      <div className="flex items-center gap-2">
        {logo && <img src={logo} alt="" className="h-10 w-10 rounded bg-white object-contain p-0.5 ring-1 ring-gray-200" />}
        <label className="btn-secundario cursor-pointer">{logo ? 'Cambiar logo' : 'Logo de la institución'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={cambiarLogo} /></label>
        {logo && <button className="btn-peligro px-2" onClick={() => setLogo(null)}>Quitar</button>}
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primario" onClick={guardar}>Guardar</button>
        <span className="text-sm text-gray-600">{estado}</span>
      </div>
    </div>
  )
}
