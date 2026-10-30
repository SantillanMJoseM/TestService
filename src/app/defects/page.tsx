"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Defect { id: string; title: string; severity: string; status: string; reportedBy: string; createdAt: string }

const severityColor: Record<string, string> = { Low: "bg-gray-100 text-gray-700", Medium: "bg-yellow-100 text-yellow-700", High: "bg-orange-100 text-orange-700", Critical: "bg-red-100 text-red-700" };
const statusColor: Record<string, string> = { Open: "bg-red-100 text-red-700", InProgress: "bg-blue-100 text-blue-700", Resolved: "bg-green-100 text-green-700", Closed: "bg-gray-100 text-gray-700", Reopened: "bg-orange-100 text-orange-700" };

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/defects").then(r => r.json()).then(setDefects).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando...</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Incidencias</h1>
        <Link href="/defects/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Nueva incidencia</Link>
      </div>
      {defects.length === 0 ? <p className="text-gray-500">No hay incidencias registradas.</p> : (
        <div className="space-y-4">
          {defects.map(d => (
            <div key={d.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{d.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${severityColor[d.severity]}`}>{d.severity}</span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${statusColor[d.status]}`}>{d.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Reportado por: {d.reportedBy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}