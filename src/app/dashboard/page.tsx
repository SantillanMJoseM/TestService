"use client";
import { useEffect, useState } from "react";

interface Stats {
  projects: number;
  testCases: number;
  executions: number;
  passed: number;
  failed: number;
  defects: number;
  openDefects: number;
  uatApprovals: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ projects: 0, testCases: 0, executions: 0, passed: 0, failed: 0, defects: 0, openDefects: 0, uatApprovals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [projects, testCases, executions, defects, uatApprovals] = await Promise.all([
          fetch("/api/projects").then(r => r.json()),
          fetch("/api/test-cases").then(r => r.json()),
          fetch("/api/executions").then(r => r.json()),
          fetch("/api/defects").then(r => r.json()),
          fetch("/api/uat-approvals").then(r => r.json()),
        ]);

        const passed = executions.filter((e: { status: string }) => e.status === "Passed").length;
        const failed = executions.filter((e: { status: string }) => e.status === "Failed").length;
        const openDefects = defects.filter((d: { status: string }) => d.status === "Open").length;

        setStats({
          projects: projects.length,
          testCases: testCases.length,
          executions: executions.length,
          passed,
          failed,
          defects: defects.length,
          openDefects,
          uatApprovals: uatApprovals.length,
        });
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8"><p>Cargando dashboard...</p></div>;

  const passRate = stats.executions > 0 ? Math.round((stats.passed / stats.executions) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Proyectos", value: stats.projects, color: "bg-blue-500" },
          { label: "Casos de prueba", value: stats.testCases, color: "bg-purple-500" },
          { label: "Ejecuciones", value: stats.executions, color: "bg-indigo-500" },
          { label: "Incidencias", value: stats.defects, color: "bg-red-500" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-md p-6">
            <div className={`w-10 h-10 ${card.color} rounded-lg mb-3`} />
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultados de ejecuciones</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aprobadas</span>
              <span className="text-sm font-bold text-green-600">{stats.passed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rechazadas</span>
              <span className="text-sm font-bold text-red-600">{stats.failed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-sm font-bold text-gray-900">{stats.executions}</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Tasa de éxito</span>
                <span>{passRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${passRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incidencias</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Abiertas</span>
              <span className="text-sm font-bold text-red-600">{stats.openDefects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-sm font-bold text-gray-900">{stats.defects}</span>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Aprobaciones UAT</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.uatApprovals}</p>
          </div>
        </div>
      </div>
    </div>
  );
}