import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

const enlace = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition ${isActive
    ? 'bg-white text-sena-oscuro shadow' : 'text-white/90 hover:bg-white/15 hover:text-white'}`

export default function Sidebar({ abierto, onCerrar }) {
  const { sesion, esAdmin, salir } = useAuth()

  return (
    <>
      {/* Velo en celular */}
      <div onClick={onCerrar}
        className={`no-imprimir fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${abierto ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

      <aside className={`no-imprimir fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col bg-gradient-to-b from-sena to-sena-oscuro p-4 text-white shadow-xl transition-transform
        lg:top-16 lg:z-30 lg:translate-x-0 ${abierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="font-bold">Menú</span>
          <button onClick={onCerrar} className="rounded-lg px-2 text-2xl hover:bg-white/15" aria-label="Cerrar menú">×</button>
        </div>

        <nav className="flex flex-col gap-1" onClick={onCerrar}>
          <NavLink to="/" end className={enlace}><span>🏠</span> Inicio</NavLink>
          <NavLink to="/calificar" className={enlace}><span>📝</span> Calificar proyectos</NavLink>
          <NavLink to="/subir" className={enlace}><span>📤</span> Subir trabajo</NavLink>
          <NavLink to="/resultados" className={enlace}><span>🏆</span> Resultados</NavLink>
          <NavLink to="/certificados" className={enlace}><span>🎓</span> Certificados</NavLink>

          <p className="mt-5 px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-white/60">Administración</p>
          {esAdmin ? (
            <>
              <NavLink to="/admin" end className={enlace}><span>📅</span> Eventos</NavLink>
              <NavLink to="/admin/resultados" className={enlace}><span>📊</span> Resultados (detalle)</NavLink>
            </>
          ) : (
            <NavLink to="/admin/login" className={enlace}><span>🔐</span> Ingresar</NavLink>
          )}
        </nav>

        {sesion && (
          <div className="mt-auto rounded-xl bg-black/15 p-3 text-sm">
            <p className="truncate text-white/80">{sesion.user.email}</p>
            <button onClick={salir} className="mt-2 w-full rounded-lg bg-white/15 py-2 font-medium hover:bg-white/25">Cerrar sesión</button>
          </div>
        )}
      </aside>
    </>
  )
}
