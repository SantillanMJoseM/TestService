"use client";

import { useEffect, useState } from "react";

interface Role { id: string; name: string; description: string | null; isActive: boolean; _count?: { users: number; permissions: number } }
interface Permission { id: string; section: string; action: string; description: string | null }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const loadRoles = async () => {
    const res = await fetch("/api/roles");
    if (res.ok) setRoles(await res.json());
  };

  const loadPermissions = async () => {
    const res = await fetch("/api/permissions");
    if (res.ok) setPermissions(await res.json());
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadRoles(), loadPermissions()]);
      setLoading(false);
    })();
  }, []);

  const selectRole = async (role: Role) => {
    setSelectedRoleId(role.id);
    setError(null);
    const res = await fetch(`/api/roles/${role.id}/permissions`);
    if (res.ok) {
      const perms = await res.json();
      setSelectedPerms(perms.map((p: Permission) => p.id));
    } else {
      setSelectedPerms([]);
    }
  };

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const savePerms = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: selectedPerms }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar");
      }
      await loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al crear rol");
      }
      setNewRoleName("");
      setNewRoleDesc("");
      await loadRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  // Group permissions by section
  const sections = Array.from(new Set(permissions.map((p) => p.section))).sort();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Roles y permisos</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Roles</h2>
          <ul className="space-y-2">
            {roles.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => selectRole(r)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedRoleId === r.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
                >
                  {r.name} {r._count ? `(${r._count.users} usuarios)` : ""}
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={createRole} className="mt-4 space-y-2">
            <input type="text" placeholder="Nuevo rol" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input type="text" placeholder="Descripción" value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">Crear rol</button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
          {!selectedRoleId ? (
            <p className="text-gray-500">Seleccioná un rol para editar sus permisos.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Permisos del rol</h2>
                <button onClick={savePerms} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  {saving ? "Guardando..." : "Guardar permisos"}
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {sections.map((section) => (
                  <div key={section}>
                    <h3 className="font-medium text-gray-700 capitalize mb-2">{section}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {permissions.filter((p) => p.section === section).map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={selectedPerms.includes(p.id)} onChange={() => togglePerm(p.id)} />
                          {p.action}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
