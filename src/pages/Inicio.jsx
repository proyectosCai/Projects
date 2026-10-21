import ilustracion from '../assets/ilustracion.webp'
import ElegirEvento from './ElegirEvento'

export default function Inicio() {
  return (
    <div className="space-y-10">
      <section className="tarjeta flex flex-col items-center gap-6 overflow-hidden p-6 sm:p-8 md:flex-row">
        <div className="flex-1">
          <p className="mb-3 text-lg font-semibold text-sena sm:text-xl">¡La plataforma para impulsar y visibilizar la investigación!</p>
          <p className="text-justify text-gray-800">
            Project-APP es un espacio diseñado para transformar cómo se presentan y evalúan los proyectos en el ámbito
            investigativo y formativo. Los jurados califican cada exposición desde su celular, ficha por ficha,
            y los resultados se consolidan al instante.
          </p>
        </div>
        <img src={ilustracion} alt="" className="w-36 drop-shadow-xl sm:w-44" />
      </section>

      <section>
        <h2 className="mb-1 text-2xl font-bold text-sena-oscuro">Eventos activos</h2>
        <p className="mb-4 text-gray-700">Elige el evento para empezar a calificar.</p>
        <ElegirEvento destino="jurado" embebido />
      </section>

      <SeccionResultados />
    </div>
  )
}

function SeccionResultados() {
  return (
    <section>
      <h2 className="mb-1 text-2xl font-bold text-sena-oscuro">Resultados publicados</h2>
      <p className="mb-4 text-gray-700">Consulta el podio de cada ficha.</p>
      <ElegirEvento destino="publico" embebido />
    </section>
  )
}
