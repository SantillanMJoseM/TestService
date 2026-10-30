import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TestService</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Aplicación de gestión de testing funcional y UAT (User Acceptance
          Testing). Administra proyectos, módulos, versiones, casos de prueba,
          ejecuciones, incidencias y aprobaciones.
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Link
          href="/projects"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Ver proyectos
        </Link>
        <Link
          href="/projects/new"
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
        >
          Crear proyecto
        </Link>
      </div>
    </div>
  );
}