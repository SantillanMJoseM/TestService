"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface UatApproval { id: string; status: string; comments: string | null; approvedAt: string; version?: { name: string }; user?: { fullName: string } }

const statusColor: Record<string, string> = { Pending: "bg-yellow-100 text-yellow-700", Approved: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-700" };

export default function UatPage() {
  const [approvals, setApprovals] = useState<UatApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/uat-approvals").then(r => r.json()).then(setApprovals).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aprobaciones UAT</h1>
        <Link href="/uat/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nueva aprobación</Link>
      </div>
      {approvals.length === 0 ? <p className="text-gray-500">No hay aprobaciones UAT registradas.</p> : (
        <div className="space-y-4">
          {approvals.map(a => (
            <div key={a.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${statusColor[a.status]}`}>{a.status}</span>
                    {a.version && <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-700">{a.version.name}</span>}
                  </div>
                  {a.user && <p className="text-sm text-gray-600">Aprobado por: {a.user.fullName}</p>}
                  {a.comments && <p className="text-sm text-gray-500 mt-1">{a.comments}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(a.approvedAt).toLocaleDateString("es-ES")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}