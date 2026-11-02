"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TestCycleDetail {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  version: { id: string; name: string } | null;
  project: { id: string; name: string; key: string } | null;
  startDate: string | null;
  endDate: string | null;
  executions: { id: string; status: string; executedBy: string }[];
}

export default function TestCycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [cycle, setCycle] = useState<TestCycleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchCycle() {
      const { id } = await params;
      const res = await fetch(`/api/test-cycles/${id}`);
      if (res.ok) setCycle(await res.json());
      else setCycle(null);
      if (!cancelled) setLoading(false);
    }
    fetchCycle();
    return () => { cancelled = true; };
  }, [params]);

  const handleDelete = async () => {
    if (!cycle || !confirm("¿Eliminar este ciclo de prueba?")) return;
    const res = await fetch(`/api/test-cycles/${cycle.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/test-cycles"); router.refresh(); }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;
  if (!cycle) return <div className="container mx-auto px-4 py-8"><p>Ciclo de prueba no encontrado.</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/test-cycles" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Volver</Link>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cycle.name}</h1>
            {cycle.description && <p className="text-gray-600 mt-2">{cycle.description}</p>}
            <div className="flex gap-2 mt-2 text-sm text-gray-500">
              {cycle.project && <span>Proyecto: {cycle.project.name}</span>}
              {cycle.version && <><span>•</span><span>Versión: {cycle.version.name}</span></>}
              {cycle.startDate && <><span>•</span><span>Inicio: {new Date(cycle.startDate).toLocaleDateString()}</span></>}
              {cycle.endDate && <><span>•</span><span>Fin: {new Date(cycle.endDate).toLocaleDateString()}</span></>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/test-cycles/${cycle.id}/edit`} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium">Editar</Link>
            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium">Eliminar</button>
          </div>
        </div>

        {cycle.executions.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Ejecuciones ({cycle.executions.length})</h2>
            <ul className="space-y-1 text-sm text-gray-600">
              {cycle.executions.map((e) => (
                <li key={e.id}>{e.status} — {e.executedBy}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
