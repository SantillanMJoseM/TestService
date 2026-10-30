"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  key: string;
  createdAt: string;
  updatedAt: string;
  modules: { id: string; name: string }[];
  versions: { id: string; name: string }[];
  _count: {
    testCases: number;
    executions: number;
    defects: number;
  };
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) throw new Error("Proyecto no encontrado");
        const data = await res.json();
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [params]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Cargando proyecto...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error: {error || "Proyecto no encontrado"}</p>
        <Link href="/projects" className="text-blue-600 hover:underline mt-4 inline-block">
          Volver a proyectos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Volver a proyectos
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded mt-2">
              {project.key}
            </span>
          </div>
          <Link
            href={`/projects/${project.id}/edit`}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Editar
          </Link>
        </div>

        {project.description && (
          <p className="text-gray-600 mb-4">{project.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500">Casos de prueba</p>
            <p className="text-xl font-bold text-gray-900">
              {project._count.testCases}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500">Módulos</p>
            <p className="text-xl font-bold text-gray-900">
              {project.modules.length}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500">Versiones</p>
            <p className="text-xl font-bold text-gray-900">
              {project.versions.length}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500">Ejecuciones</p>
            <p className="text-xl font-bold text-gray-900">
              {project._count.executions}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos</h2>
          {project.modules.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay módulos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {project.modules.map((mod) => (
                <li key={mod.id} className="text-sm text-gray-700">
                  {mod.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Versiones</h2>
          {project.versions.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay versiones registradas.</p>
          ) : (
            <ul className="space-y-2">
              {project.versions.map((ver) => (
                <li key={ver.id} className="text-sm text-gray-700">
                  {ver.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}