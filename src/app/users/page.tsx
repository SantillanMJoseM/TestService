"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface User { id: string; username: string; email: string; fullName: string; role: string; isActive: boolean; createdAt: string }

const roleColor: Record<string, string> = { Admin: "bg-red-100 text-red-700", Tester: "bg-blue-100 text-blue-700", BusinessUser: "bg-green-100 text-green-700", Viewer: "bg-gray-100 text-gray-700" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/users").then(r => r.json()).then(setUsers).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nuevo usuario</Link>
      </div>
      {users.length === 0 ? <p className="text-gray-500">No hay usuarios registrados.</p> : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{u.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-0.5 rounded ${roleColor[u.role]}`}>{u.role}</span></td>
                  <td className="px-6 py-4"><span className={`text-xs font-medium px-2.5 py-0.5 rounded ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.isActive ? "Activo" : "Inactivo"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}