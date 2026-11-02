"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TestCaseDetail {
  id: string;
  title: string;
  description: string | null;
  preconditions: string | null;
  steps: string;
  expectedResult: string;
  priority: string;
  type: string;
  project: { id: string; name: string; key: string } | null;
  module: { id: string; name: string } | null;
  version: { id: string; name: string } | null;
  executions: { id: string; status: string; executedBy: string; executedAt: string | null }[];
}

export default function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [testCase, setTestCase] = useState<TestCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchTestCase() {
      const { id } = await params;
      const res = await fetch(`/api/test-cases/${id}`);
      if (res.ok) {
        setTestCase(await res.json());
      } else {
        setTestCase(null);
      }
      if (!cancelled) setLoading(false);
    }
    fetchTestCase();
    return () => { cancelled = true; };
  }, [params]);

  const handleDelete = async () => {
    if (!testCase || !confirm("¿Eliminar este caso de prueba?")) return;
    const res = await fetch(`/api/test-cases/${testCase.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/test-cases");
      router.refresh();
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;
  }

  if (!testCase) {
    return <div className="container mx-auto px-4 py-8"><p>Caso de prueba no encontrado.</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/test-cases" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Volver</Link>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{testCase.title}</h1>
            <div className="flex gap-2 mt-2 text-sm text-gray-500">
              <span>Prioridad: {testCase.priority}</span>
              <span>•</span>
              <span>Tipo: {testCase.type}</span>
              {testCase.project && <><span>•</span><span>Proyecto: {testCase.project.name}</span></>}
              {testCase.module && <><span>•</span><span>Módulo: {testCase.module.name}</span></>}
              {testCase.version && <><span>•</span><span>Versión: {testCase.version.name}</span></>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/test-cases/${testCase.id}/edit`} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium">Editar</Link>
            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium">Eliminar</button>
          </div>
        </div>

        {testCase.description && (
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800">Descripción</h2>
            <p className="text-gray-600 mt-1">{testCase.description}</p>
          </div>
        )}

        {testCase.preconditions && (
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800">Precondiciones</h2>
            <p className="text-gray-600 mt-1 whitespace-pre-wrap">{testCase.preconditions}</p>
          </div>
        )}

        <div className="mb-4">
          <h2 className="font-semibold text-gray-800">Pasos</h2>
          <p className="text-gray-600 mt-1 whitespace-pre-wrap">{testCase.steps}</p>
        </div>

        <div className="mb-4">
          <h2 className="font-semibold text-gray-800">Resultado esperado</h2>
          <p className="text-gray-600 mt-1 whitespace-pre-wrap">{testCase.expectedResult}</p>
        </div>

        {testCase.executions.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Ejecuciones</h2>
            <ul className="space-y-1 text-sm text-gray-600">
              {testCase.executions.map((e) => (
                <li key={e.id}>
                  {e.status} — {e.executedBy} {e.executedAt ? `(${new Date(e.executedAt).toLocaleString()})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
