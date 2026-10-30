"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TestCycle { id: string; name: string; description: string | null; projectId: string; version?: { name: string }; _count?: { executions: number }; createdAt: string }

export default function TestCyclesPage() {
  const [cycles, setCycles] = useState<TestCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/test-cycles").then(r => r.json()).then(setCycles).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ciclos de prueba</h1>
        <Link href="/test-cycles/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nuevo ciclo</Link>
      </div>
      {cycles.length === 0 ? <p className="text-gray-500">No hay ciclos de prueba registrados.</p> : (
        <div className="space-y-4">
          {cycles.map(c => (
            <div key={c.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                  {c.description && <p className="text-gray-600 text-sm mt-1">{c.description}</p>}
                  <div className="flex gap-4 text-xs text-gray-500 mt-3">
                    {c.version && <span>Versión: {c.version.name}</span>}
                    <span>Ejecuciones: {c._count?.executions ?? 0}</span>
                  </div>
                </div>
                <Link href={`/test-cycles/${c.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver detalle</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}