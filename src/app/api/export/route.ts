import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, handleAuthError } from "@/lib/get-user";
import { getUserProjects } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, "reports", "export");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "executions";
    const accessibleProjects = await getUserProjects(user.id);

    if (type === "executions") {
      const executions = await prisma.execution.findMany({
        where: { projectId: { in: accessibleProjects } },
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
        where: { projectId: { in: accessibleProjects } },
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
        where: { projectId: { in: accessibleProjects } },
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
    return handleAuthError(error) as NextResponse;
  }
}
