"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditTestCasePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    preconditions: "",
    steps: "",
    expectedResult: "",
    priority: "Medium",
    type: "Functional",
    moduleId: "",
    versionId: "",
  });
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [versions, setVersions] = useState<{ id: string; name: string }[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchTestCase() {
      const { id } = await params;
      const res = await fetch(`/api/test-cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          title: data.title || "",
          description: data.description || "",
          preconditions: data.preconditions || "",
          steps: data.steps || "",
          expectedResult: data.expectedResult || "",
          priority: data.priority || "Medium",
          type: data.type || "Functional",
          moduleId: data.moduleId || "",
          versionId: data.versionId || "",
        });
        setProjectId(data.projectId);
        // Load modules and versions for the project
        const [modsRes, versRes] = await Promise.all([
          fetch(`/api/modules?projectId=${data.projectId}`),
          fetch(`/api/versions?projectId=${data.projectId}`),
        ]);
        if (modsRes.ok) setModules(await modsRes.json());
        if (versRes.ok) setVersions(await versRes.json());
      }
      if (!cancelled) setLoading(false);
    }
    fetchTestCase();
    return () => { cancelled = true; };
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { id } = await params;
      const res = await fetch(`/api/test-cases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          preconditions: form.preconditions || null,
          steps: form.steps,
          expectedResult: form.expectedResult,
          priority: form.priority,
          type: form.type,
          moduleId: form.moduleId || null,
          versionId: form.versionId || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar");
      }
      router.push(`/test-cases/${(await params).id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar caso de prueba</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precondiciones</label>
          <textarea value={form.preconditions} onChange={e => setForm(p => ({ ...p, preconditions: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pasos *</label>
          <textarea value={form.steps} onChange={e => setForm(p => ({ ...p, steps: e.target.value }))} required rows={5} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resultado esperado *</label>
          <textarea value={form.expectedResult} onChange={e => setForm(p => ({ ...p, expectedResult: e.target.value }))} required rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="Low">Baja</option>
              <option value="Medium">Media</option>
              <option value="High">Alta</option>
              <option value="Critical">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="Functional">Funcional</option>
              <option value="UAT">UAT</option>
              <option value="Regression">Regresión</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
            <select value={form.moduleId} onChange={e => setForm(p => ({ ...p, moduleId: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">Sin módulo</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
            <select value={form.versionId} onChange={e => setForm(p => ({ ...p, versionId: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">Sin versión</option>
              {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">{saving ? "Guardando..." : "Guardar cambios"}</button>
          <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
