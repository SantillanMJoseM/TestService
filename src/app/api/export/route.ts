import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "executions";

  try {
    if (type === "executions") {
      const executions = await prisma.execution.findMany({
        include: { testCase: true, project: true },
        orderBy: { createdAt: "desc" },
      });

      const csv = [
        "ID,Proyecto,Caso de prueba,Estado,Ejecutado por,Fecha",
        ...executions.map((e) =>
          `"${e.id}","${e.project.name}","${e.testCase.title}","${e.status}","${e.executedBy}","${e.createdAt.toISOString()}"`
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=ejecuciones.csv",
        },
      });
    }

    if (type === "defects") {
      const defects = await prisma.defect.findMany({
        include: { project: true },
        orderBy: { createdAt: "desc" },
      });

      const csv = [
        "ID,Título,Severidad,Estado,Proyecto,Reportado por,Fecha",
        ...defects.map((d) =>
          `"${d.id}","${d.title}","${d.severity}","${d.status}","${d.project.name}","${d.reportedBy}","${d.createdAt.toISOString()}"`
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=incidencias.csv",
        },
      });
    }

    if (type === "test-cases") {
      const testCases = await prisma.testCase.findMany({
        include: { project: true, module: true },
        orderBy: { createdAt: "desc" },
      });

      const csv = [
        "ID,Título,Prioridad,Tipo,Proyecto,Módulo",
        ...testCases.map((tc) =>
          `"${tc.id}","${tc.title}","${tc.priority}","${tc.type}","${tc.project.name}","${tc.module?.name || ""}"`
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=casos-prueba.csv",
        },
      });
    }

    return NextResponse.json({ error: "Tipo de exportación no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error al exportar:", error);
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}