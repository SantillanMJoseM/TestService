"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", fullName: "", role: "Tester" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); }
      router.push("/");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error desconocido"); } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Registrarse</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input type="text" value={form.fullName} onChange={e => setForm(p => ({...p, fullName: e.target.value}))} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario *</label>
          <input type="text" value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
          <input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={6} className="w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))} className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="Tester">Tester</option>
            <option value="BusinessUser">Usuario de negocio</option>
            <option value="Viewer">Visualizador</option>
            <option value="Admin">Administrador</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 hover:underline">Iniciar sesión</Link>
      </p>
    </div>
  );
}