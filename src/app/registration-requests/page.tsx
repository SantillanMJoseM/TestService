"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RegRequest {
  id: string;
  username: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;
}

interface Role { id: string; name: string }
interface Project { id: string; name: string; key: string }

export default function RegistrationRequestsPage() {
  const [requests, setRequests] = useState<RegRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});
  const [selectedProjects, setSelectedProjects] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rrRes, rolesRes, projectsRes] = await Promise.all([
        fetch("/api/registration-requests?status=Pending"),
        fetch("/api/roles"),
        fetch("/api/projects"),
      ]);
      if (rrRes.ok) setRequests(await rrRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (projectsRes.ok) {
        const p = await projectsRes.json();
        setProjects(Array.isArray(p) ? p : p.data || []);
      }
    } catch {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const res = await fetch(`/api/registration-requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleId: selectedRole[id] || null,
        projectIds: selectedProjects[id] || [],
      }),
    });
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.error || "Error al aprobar");
    }
  };

  const reject = async (id: string) => {
    const res = await fetch(`/api/registration-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.error || "Error al rechazar");
    }
  };

  const toggleProject = (reqId: string, pid: string) => {
    setSelectedProjects((prev) => {
      const current = prev[reqId] || [];
      return {
        ...prev,
        [reqId]: current.includes(pid) ? current.filter((x) => x !== pid) : [...current, pid],
      };
    });
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Solicitudes de registro</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {requests.length === 0 ? (
        <p className="text-gray-500">No hay solicitudes pendientes.</p>
      ) : (
        <div className="space-y-6">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="font-semibold text-gray-900">{r.fullName}</h2>
                <p className="text-sm text-gray-600">{r.username} — {r.email}</p>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol a asignar</label>
                  <select
                    value={selectedRole[r.id] || ""}
                    onChange={(e) => setSelectedRole((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Sin rol</option>
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proyectos asignados</label>
                  <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                    {projects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={(selectedProjects[r.id] || []).includes(p.id)} onChange={() => toggleProject(r.id, p.id)} />
                        {p.name} ({p.key})
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => approve(r.id)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium">Aprobar</button>
                <button onClick={() => reject(r.id)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium">Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
