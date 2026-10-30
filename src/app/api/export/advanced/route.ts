import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "executions";
  const format = searchParams.get("format") || "csv";

  try {
    if (type === "executions") {
      const executions = await prisma.execution.findMany({
        include: { testCase: true, project: true },
        orderBy: { createdAt: "desc" },
      });

      if (format === "excel") {
        const data = executions.map((e) => ({
          ID: e.id,
          Proyecto: e.project.name,
          "Caso de prueba": e.testCase.title,
          Estado: e.status,
          "Ejecutado por": e.executedBy,
          Fecha: e.createdAt.toISOString(),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ejecuciones");
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=ejecuciones.xlsx",
          },
        });
      }

      if (format === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Reporte de Ejecuciones - TestService", 14, 20);
        doc.setFontSize(10);
        let y = 35;
        doc.text("ID | Proyecto | Caso | Estado | Ejecutor", 14, y);
        y += 7;
        executions.slice(0, 50).forEach((e) => {
          const line = `${e.id.substring(0, 8)} | ${e.project.name.substring(0, 15)} | ${e.testCase.title.substring(0, 20)} | ${e.status} | ${e.executedBy}`;
          doc.text(line, 14, y);
          y += 6;
          if (y > 280) { doc.addPage(); y = 20; }
        });
        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=ejecuciones.pdf",
          },
        });
      }
    }

    if (type === "defects") {
      const defects = await prisma.defect.findMany({
        include: { project: true },
        orderBy: { createdAt: "desc" },
      });

      if (format === "excel") {
        const data = defects.map((d) => ({
          ID: d.id,
          Título: d.title,
          Severidad: d.severity,
          Estado: d.status,
          Proyecto: d.project.name,
          "Reportado por": d.reportedBy,
          Fecha: d.createdAt.toISOString(),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Incidencias");
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=incidencias.xlsx",
          },
        });
      }
    }

    return NextResponse.json({ error: "Tipo o formato no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error al exportar:", error);
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}