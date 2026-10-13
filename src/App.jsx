import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAdmin from './components/RequireAdmin'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import Inicio from './pages/Inicio'
import ElegirEvento from './pages/ElegirEvento'
import EventoJurado from './pages/jurado/EventoJurado'
import ResultadosPublicos from './pages/ResultadosPublicos'
import SubirTrabajo from './pages/SubirTrabajo'
import Certificados from './pages/Certificados'
import VerificarCertificado from './pages/VerificarCertificado'
import Login from './pages/admin/Login'
import Eventos from './pages/admin/Eventos'
import EventoConfig from './pages/admin/EventoConfig'

export default function App() {
  const [menu, setMenu] = useState(false)
  return (
    <div className="fondo-app flex min-h-screen flex-col">
      <Navbar onMenu={() => setMenu(true)} />
      <Sidebar abierto={menu} onCerrar={() => setMenu(false)} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/calificar" element={<ElegirEvento destino="jurado" />} />
            <Route path="/evento/:id" element={<EventoJurado />} />
            <Route path="/subir" element={<SubirTrabajo />} />
            <Route path="/certificados" element={<Certificados />} />
            <Route path="/verificar/:codigo" element={<VerificarCertificado />} />
            <Route path="/resultados" element={<ElegirEvento destino="publico" />} />
            <Route path="/resultados/:id" element={<ResultadosPublicos />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<RequireAdmin><Eventos /></RequireAdmin>} />
            <Route path="/admin/resultados" element={<RequireAdmin><ElegirEvento destino="resultados" /></RequireAdmin>} />
            <Route path="/admin/evento/:id" element={<RequireAdmin><EventoConfig /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}
