import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TestService",
  description: "Gestión de testing funcional y UAT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="text-xl font-bold text-blue-600">
                TestService
              </Link>
              <div className="flex gap-2 text-sm">
                <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                  Iniciar sesión
                </Link>
                <Link href="/register" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                  Registrarse
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/projects" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Proyectos
              </Link>
              <Link href="/modules" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Módulos
              </Link>
              <Link href="/versions" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Versiones
              </Link>
              <Link href="/test-cases" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Casos de prueba
              </Link>
              <Link href="/test-cycles" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Ciclos
              </Link>
              <Link href="/executions" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Ejecuciones
              </Link>
              <Link href="/defects" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                Incidencias
              </Link>
              <Link href="/uat" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
                UAT
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}