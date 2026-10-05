import logoSena from '../assets/sena-cai.png'
import logoBio from '../assets/biometronica.png'

export default function Footer() {
  return (
    <footer className="no-imprimir border-t-4 border-sena bg-crema px-4 py-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
        <img src={logoSena} alt="SENA - Centro de Automatización Industrial" className="h-12" />
        <p className="text-xs leading-relaxed text-sena-oscuro md:text-center" style={{fontSize:"10px", fontStyle:"italic"}}>
          Project-APP es un software en desarrollo por el Semillero de Investigación BIOMETRONICA del Centro de Automatización Industrial.
          <br />Prohibida su difusión y utilización sin previa autorización · SENA - Caldas - {new Date().getFullYear()}
        </p>
        <img src={logoBio} alt="Semillero BIOMETRONICA" className="h-8" />
      </div>
    </footer>
  )
}
