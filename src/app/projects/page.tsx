"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";

interface Project {
  id: string;
  name: string;
  description: string | null;
  key: string;
  createdAt: string;
  _count?: { modules: number; testCases: number; executions: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error("Error al cargar proyectos");
      const data = await res.json();
      setProjects(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(1, "");
  }, [fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(1, search);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Cargando proyectos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
        <Link href="/projects/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
          Nuevo proyecto
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, clave o descripción..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium">
          Buscar
        </button>
      </form>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hay proyectos registrados.</p>
          <Link href="/projects/new" className="text-blue-600 hover:text-blue-800 font-medium">
            Crear el primer proyecto
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => fetchProjects(pagination.page - 1, search)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => fetchProjects(pagination.page + 1, search)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}