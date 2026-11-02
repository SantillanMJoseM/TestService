"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditTestCyclePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", versionId: "", startDate: "", endDate: "" });
  const [versions, setVersions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { id } = await params;
      const res = await fetch(`/api/test-cycles/${id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          name: data.name || "",
          description: data.description || "",
          versionId: data.versionId || data.version?.id || "",
          startDate: data.startDate ? data.startDate.substring(0, 10) : "",
          endDate: data.endDate ? data.endDate.substring(0, 10) : "",
        });
        if (data.projectId) {
          const vRes = await fetch(`/api/versions?projectId=${data.projectId}`);
          if (vRes.ok) setVersions(await vRes.json());
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { id } = await params;
      const res = await fetch(`/api/test-cycles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          versionId: form.versionId,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error al guardar"); }
      router.push(`/test-cycles/${(await params).id}`);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar ciclo de prueba</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Versión *</label>
          <select value={form.versionId} onChange={e => setForm(p => ({ ...p, versionId: e.target.value }))} required className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Seleccionar versión</option>
            {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2" />
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
