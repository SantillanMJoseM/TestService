"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewExecutionPage() {
  const router = useRouter();
  const [form, setForm] = useState({ status: "Pending", evidence: "", notes: "", executedBy: "", testCaseId: "", testCycleId: "", projectId: "" });
  const [projects, setProjects] = useState<{id: string; name: string}[]>([]);
  const [testCases, setTestCases] = useState<{id: string; title: string}[]>([]);
  const [testCycles, setTestCycles] = useState<{id: string; name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/projects").then(r => r.json()).then(setProjects); }, []);
  useEffect(() => { if (form.projectId) { fetch(`/api/test-cases?projectId=${form.projectId}`).then(r => r.json()).then(setTestCases); fetch(`/api/test-cycles?projectId=${form.projectId}`).then(r => r.json()).then(setTestCycles); } }, [form.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const res = await fetch("/api/executions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: form.status, evidence: form.evidence || null, notes: form.notes || null, executedBy: form.executedBy, testCaseId: form.testCaseId, testCycleId: form.testCycleId || null, projectId: form.projectId }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      router.push("/executions"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error desconocido"); } finally { setLoading(false); }
  };

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva ejecución</h1>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Caso de prueba *</label>
          <select value={form.testCaseId} onChange={e => update("testCaseId", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Seleccionar caso</option>
            {testCases.map(tc => <option key={tc.id} value={tc.id}>{tc.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo de prueba</label>
          <select value={form.testCycleId} onChange={e => update("testCycleId", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Sin ciclo</option>
            {testCycles.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select value={form.status} onChange={e => update("status", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="Pending">Pendiente</option>
            <option value="Passed">Aprobado</option>
            <option value="Failed">Rechazado</option>
            <option value="Blocked">Bloqueado</option>
            <option value="NotRun">No ejecutado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ejecutado por *</label>
          <input type="text" value={form.executedBy} onChange={e => update("executedBy", e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evidencia (URL)</label>
          <input type="text" value={form.evidence} onChange={e => update("evidence", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">{loading ? "Guardando..." : "Crear ejecución"}</button>
          <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  );
}