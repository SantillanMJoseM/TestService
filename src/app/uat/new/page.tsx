"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUatPage() {
  const router = useRouter();
  const [form, setForm] = useState({ projectId: "", versionId: "", approvedBy: "", approvedAt: "", comments: "", status: "Pending" });
  const [projects, setProjects] = useState<{id: string; name: string}[]>([]);
  const [versions, setVersions] = useState<{id: string; name: string}[]>([]);
  const [users, setUsers] = useState<{id: string; fullName: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/projects").then(r => r.json()).then(setProjects); }, []);
  useEffect(() => { if (form.projectId) fetch(`/api/versions?projectId=${form.projectId}`).then(r => r.json()).then(setVersions); }, [form.projectId]);
  useEffect(() => { fetch("/api/users").then(r => r.json()).then(setUsers).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await fetch("/api/uat-approvals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: form.projectId, versionId: form.versionId, approvedBy: form.approvedBy, approvedAt: form.approvedAt, comments: form.comments || null, status: form.status }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      router.push("/uat"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error desconocido"); } finally { setLoading(false); }
  };

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva aprobación UAT</h1>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Versión *</label>
          <select value={form.versionId} onChange={e => update("versionId", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Seleccionar versión</option>
            {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aprobado por *</label>
          <select value={form.approvedBy} onChange={e => update("approvedBy", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Seleccionar usuario</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de aprobación *</label>
          <input type="datetime-local" value={form.approvedAt} onChange={e => update("approvedAt", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select value={form.status} onChange={e => update("status", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="Pending">Pendiente</option>
            <option value="Approved">Aprobado</option>
            <option value="Rejected">Rechazado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
          <textarea value={form.comments} onChange={e => update("comments", e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">{loading ? "Guardando..." : "Crear aprobación"}</button>
          <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  );
}