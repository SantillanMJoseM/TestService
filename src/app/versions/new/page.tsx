"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewVersionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<{id: string; name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/projects").then(r => r.json()).then(setProjects); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/versions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: description || null, projectId }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      router.push("/versions"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error desconocido"); } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva versión</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto *</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Seleccionar proyecto</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Ej: 1.0.0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">{loading ? "Guardando..." : "Crear versión"}</button>
          <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  );
}