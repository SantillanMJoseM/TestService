"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTestCasePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", preconditions: "", steps: "", expectedResult: "", priority: "Medium", type: "Functional", projectId: "", moduleId: "", versionId: "" });
  const [projects, setProjects] = useState<{id: string; name: string}[]>([]);
  const [modules, setModules] = useState<{id: string; name: string}[]>([]);
  const [versions, setVersions] = useState<{id: string; name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(setProjects);
  }, []);

  useEffect(() => {
    if (form.projectId) {
      fetch(`/api/modules?projectId=${form.projectId}`).then(r => r.json()).then(setModules);
      fetch(`/api/versions?projectId=${form.projectId}`).then(r => r.json()).then(setVersions);
    }
  }, [form.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          preconditions: form.preconditions || null,
          steps: form.steps,
          expectedResult: form.expectedResult,
          priority: form.priority,
          type: form.type,
          projectId: form.projectId,
          moduleId: form.moduleId || null,
          versionId: form.versionId || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      router.push("/test-cases"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error desconocido"); } finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo caso de prueba</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select value={form.priority} onChange={e => update("priority", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="Low">Baja</option>
              <option value="Medium">Media</option>
              <option value="High">Alta</option>
              <option value="Critical">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={form.type} onChange={e => update("type", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="Functional">Funcional</option>
              <option value="UAT">UAT</option>
              <option value="Regression">Regresión</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
            <select value={form.moduleId} onChange={e => update("moduleId", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">Sin módulo</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
            <select value={form.versionId} onChange={e => update("versionId", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">Sin versión</option>
              {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precondiciones</label>
          <textarea value={form.preconditions} onChange={e => update("preconditions", e.target.value)} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pasos *</label>
          <textarea value={form.steps} onChange={e => update("steps", e.target.value)} rows={4} required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="1. Paso uno&#10;2. Paso dos" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resultado esperado *</label>
          <textarea value={form.expectedResult} onChange={e => update("expectedResult", e.target.value)} rows={2} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">{loading ? "Guardando..." : "Crear caso"}</button>
          <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  );
}