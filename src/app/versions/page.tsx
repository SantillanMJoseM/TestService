"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Version { id: string; name: string; description: string | null; projectId: string; createdAt: string; _count?: { testCycles: number; testCases: number } }

export default function VersionsPage() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/versions").then(r => r.json()).then(setVersions).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Versiones</h1>
        <Link href="/versions/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nueva versión</Link>
      </div>
      {versions.length === 0 ? <p className="text-gray-500">No hay versiones registradas.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {versions.map(v => (
            <div key={v.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900">{v.name}</h3>
              {v.description && <p className="text-gray-600 text-sm mt-2">{v.description}</p>}
              <div className="flex gap-4 text-xs text-gray-500 mt-3">
                <span>Ciclos: {v._count?.testCycles ?? 0}</span>
                <span>Casos: {v._count?.testCases ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}