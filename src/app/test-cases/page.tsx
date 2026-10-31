"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TestCase { id: string; title: string; priority: string; type: string; projectId: string; module?: { name: string } | null; createdAt: string }

const priorityColor: Record<string, string> = { Low: "bg-gray-100 text-gray-700", Medium: "bg-yellow-100 text-yellow-700", High: "bg-orange-100 text-orange-700", Critical: "bg-red-100 text-red-700" };

export default function TestCasesPage() {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/test-cases").then(r => r.json()).then(data => setCases(data.data || [])).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Casos de prueba</h1>
        <Link href="/test-cases/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nuevo caso</Link>
      </div>
      {cases.length === 0 ? <p className="text-gray-500">No hay casos de prueba registrados.</p> : (
        <div className="space-y-4">
          {cases.map(tc => (
            <div key={tc.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tc.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${priorityColor[tc.priority] || "bg-gray-100"}`}>{tc.priority}</span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-700">{tc.type}</span>
                    {tc.module && <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-purple-100 text-purple-700">{tc.module.name}</span>}
                  </div>
                </div>
                <Link href={`/test-cases/${tc.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver detalle</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}