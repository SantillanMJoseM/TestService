"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Execution { id: string; status: string; executedBy: string; notes: string | null; createdAt: string; testCase?: { title: string } }

const statusColor: Record<string, string> = { Pending: "bg-gray-100 text-gray-700", Passed: "bg-green-100 text-green-700", Failed: "bg-red-100 text-red-700", Blocked: "bg-yellow-100 text-yellow-700", NotRun: "bg-gray-100 text-gray-500" };

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/executions").then(r => r.json()).then(setExecutions).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ejecuciones</h1>
        <Link href="/executions/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nueva ejecución</Link>
      </div>
      {executions.length === 0 ? <p className="text-gray-500">No hay ejecuciones registradas.</p> : (
        <div className="space-y-4">
          {executions.map(e => (
            <div key={e.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{e.testCase?.title || "Caso de prueba"}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${statusColor[e.status] || "bg-gray-100"}`}>{e.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Ejecutado por: {e.executedBy}</p>
                  {e.notes && <p className="text-sm text-gray-600 mt-2">{e.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}