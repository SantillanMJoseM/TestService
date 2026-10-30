"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";

interface Project {
  id: string;
  name: string;
  description: string | null;
  key: string;
}

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Editar proyecto: {project.name}
      </h1>
      <ProjectForm initialData={project} mode="edit" />
    </div>
  );
}