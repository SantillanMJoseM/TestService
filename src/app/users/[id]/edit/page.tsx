"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Role { id: string; name: string }
interface Project { id: string; name: string; key: string }

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    roleId: "",
    isActive: true,
    status: "Active",
    projectIds: [] as string[],
    password: "",
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { id } = await params;
      const [userRes, rolesRes, projectsRes] = await Promise.all([
        fetch(`/api/users/${id}`),
        fetch("/api/roles"),
        fetch("/api/projects"),
      ]);
      if (userRes.ok) {
        const u = await userRes.json();
        setUsername(u.username);
        setForm({
          fullName: u.fullName || "",
          email: u.email || "",
          roleId: u.roleId || "",
          isActive: u.isActive ?? true,
          status: u.status || "Active",
          projectIds: (u.projectAssignments || []).map((p: { projectId: string }) => p.projectId),
          password: "",
        });
      }
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (projectsRes.ok) {
        const p = await projectsRes.json();
        setProjects(Array.isArray(p) ? p : p.data || []);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [params]);

  const toggleProject = (pid: string) => {
    setForm((prev) => ({
      ...prev,
      projectIds: prev.projectIds.includes(pid)
        ? prev.projectIds.filter((x) => x !== pid)
        : [...prev.projectIds, pid],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { id } = await params;
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        email: form.email,
        roleId: form.roleId || null,
        isActive: form.isActive,
        status: form.status,
        projectIds: form.projectIds,
      };
      if (form.password) body.password = form.password;
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar");
      }
      router.push("/users");
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar usuario: {username}</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select value={form.roleId} onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Sin rol</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="Active">Activo</option>
            <option value="Pending">Pendiente</option>
            <option value="Suspended">Suspendido</option>
            <option value="Rejected">Rechazado</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} id="isActive" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Activo</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (opcional)</label>
          <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Proyectos asignados</label>
          <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
            {projects.length === 0 && <p className="text-sm text-gray-500">No hay proyectos.</p>}
            {projects.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.projectIds.includes(p.id)} onChange={() => toggleProject(p.id)} />
                {p.name} ({p.key})
              </label>
            ))}
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
