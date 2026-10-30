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
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              TestService
            </Link>
            <div className="flex gap-4">
              <Link
                href="/projects"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Proyectos
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}