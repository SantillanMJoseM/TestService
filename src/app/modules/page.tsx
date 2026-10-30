"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Module { id: string; name: string; description: string | null; projectId: string; createdAt: string; _count?: { testCases: number } }

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/modules").then(r => r.json()).then(setModules).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Módulos</h1>
        <Link href="/modules/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nuevo módulo</Link>
      </div>
      {modules.length === 0 ? (
        <p className="text-gray-500">No hay módulos registrados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(m => (
            <div key={m.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900">{m.name}</h3>
              {m.description && <p className="text-gray-600 text-sm mt-2">{m.description}</p>}
              <p className="text-xs text-gray-500 mt-3">Casos de prueba: {m._count?.testCases ?? 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}