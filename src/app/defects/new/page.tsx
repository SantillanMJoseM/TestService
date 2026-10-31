"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDefectPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", severity: "Medium", status: "Open", projectId: "", executionId: "", reportedBy: "" });
  const [projects, setProjects] = useState<{id: string; name: string}[]>([]);
  const [executions, setExecutions] = useState<{id: string; testCase?: {title: string}}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/projects").then(r => r.json()).then(data => setProjects(data.data || [])); }, []);
  useEffect(() => { if (form.projectId) fetch(`/api/executions?projectId=${form.projectId}`).then(r => r.json()).then(setExecutions); }, [form.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await fetch("/api/defects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title, description: form.description, severity: form.severity, status: form.status, projectId: form.projectId, executionId: form.executionId || null, reportedBy: form.reportedBy }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      router.push("/defects"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error desconocido"); } finally { setLoading(false); }
  };

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva incidencia</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto *</label>
          <select value={form.projectId} onChange={e => update("projectId", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Seleccionar proyecto</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" value={form.title} onChange={e => update("title", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={4} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
            <select value={form.severity} onChange={e => update("severity", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="Low">Baja</option>
              <option value="Medium">Media</option>
              <option value="High">Alta</option>
              <option value="Critical">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={form.status} onChange={e => update("status", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="Open">Abierta</option>
              <option value="InProgress">En progreso</option>
              <option value="Resolved">Resuelta</option>
              <option value="Closed">Cerrada</option>
              <option value="Reopened">Reabierta</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ejecución relacionada</label>
          <select value={form.executionId} onChange={e => update("executionId", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Sin ejecución</option>
            {executions.map(ex => <option key={ex.id} value={ex.id}>{ex.testCase?.title || ex.id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reportado por *</label>
          <input type="text" value={form.reportedBy} onChange={e => update("reportedBy", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">{loading ? "Guardando..." : "Crear incidencia"}</button>
          <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  );
}