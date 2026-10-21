import { Link } from 'react-router-dom'
import logoApp from '../assets/logo-app.png'
import logoSennova from '../assets/sennova.png'

export default function Navbar({ onMenu }) {
  return (
    <header className="no-imprimir sticky top-0 z-40 h-16 border-b-4 border-sena bg-crema shadow-md">
      <div className="flex h-full items-center gap-3 px-3 sm:px-5">
        <button onClick={onMenu} aria-label="Abrir menú"
          className="rounded-lg p-2 text-2xl leading-none text-sena hover:bg-sena-claro lg:hidden">☰</button>
        <Link to="/" className="flex items-center gap-2">
          <img src={logoApp} alt="Project-APP" className="h-11 w-11" />
        </Link>
        <h1 className="flex-1 text-center text-xl font-extrabold tracking-wide text-sena sm:text-3xl">PROJECT-APP</h1>
        <img src={logoSennova} alt="SENNOVA" className="hidden h-10 sm:block" />
      </div>
    </header>
  )
}
