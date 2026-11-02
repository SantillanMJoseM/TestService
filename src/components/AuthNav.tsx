"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export default function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return <div className="text-sm text-gray-400">Cargando...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-700 font-medium">{user.fullName}</span>
        <span className="text-gray-500">({user.role})</span>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-sm">
      <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
        Iniciar sesión
      </Link>
      <Link href="/register" className="text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">
        Registrarse
      </Link>
    </div>
  );
}
