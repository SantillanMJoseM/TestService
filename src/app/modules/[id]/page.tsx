"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [module, setModule] = useState<{ id: string; name: string; description: string | null; projectId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModule() {
      const { id } = await params;
      const res = await fetch(`/api/modules/${id}`);
      if (res.ok) setModule(await res.json());
      setLoading(false);
    }
    fetchModule();
  }, [params]);

  const handleDelete = async () => {
    if (!module || !confirm("¿Eliminar este módulo?")) return;
    const res = await fetch(`/api/modules/${module.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/modules"); router.refresh(); }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;
  if (!module) return <div className="container mx-auto px-4 py-8"><p>Módulo no encontrado.</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/modules" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Volver</Link>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module.name}</h1>
            {module.description && <p className="text-gray-600 mt-2">{module.description}</p>}
          </div>
          <div className="flex gap-2">
            <Link href={`/modules/${module.id}/edit`} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium">Editar</Link>
            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
}