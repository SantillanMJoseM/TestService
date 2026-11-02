import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const BASE_URL = "http://localhost:3000";

async function loginAsAdmin(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No se pudo iniciar sesión en las pruebas");
  return setCookie.split(";")[0];
}

beforeEach(async () => {
  await prisma.execution.deleteMany();
  await prisma.defect.deleteMany();
  await prisma.testCycle.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.module.deleteMany();
  await prisma.version.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userProject.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();

  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@testservice.local",
      passwordHash: await bcrypt.hash("admin123", 10),
      fullName: "Administrador",
      role: "Admin",
      status: "Active",
      isActive: true,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Integration: Projects API", () => {
  it("crea y lista proyectos", async () => {
    const cookie = await loginAsAdmin();
    const authHeaders = { "Content-Type": "application/json", Cookie: cookie };

    const createRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Proyecto Test", key: "TEST" }),
    });
    expect(createRes.status).toBe(201);
    const project = await createRes.json();
    expect(project.name).toBe("Proyecto Test");

    const listRes = await fetch(`${BASE_URL}/api/projects`, { headers: { Cookie: cookie } });
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.data).toHaveLength(1);
  });

  it("obtiene proyecto por ID", async () => {
    const cookie = await loginAsAdmin();
    const authHeaders = { "Content-Type": "application/json", Cookie: cookie };

    const createRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Proyecto Detail", key: "DETAIL" }),
    });
    const project = await createRes.json();

    const getRes = await fetch(`${BASE_URL}/api/projects/${project.id}`, { headers: { Cookie: cookie } });
    expect(getRes.status).toBe(200);
    const detail = await getRes.json();
    expect(detail.name).toBe("Proyecto Detail");
  });

  it("actualiza proyecto", async () => {
    const cookie = await loginAsAdmin();
    const authHeaders = { "Content-Type": "application/json", Cookie: cookie };

    const createRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Proyecto Original", key: "ORIG" }),
    });
    const project = await createRes.json();

    const updateRes = await fetch(`${BASE_URL}/api/projects/${project.id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ name: "Proyecto Actualizado" }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Proyecto Actualizado");
  });

  it("elimina proyecto", async () => {
    const cookie = await loginAsAdmin();
    const authHeaders = { "Content-Type": "application/json", Cookie: cookie };

    const createRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Proyecto a Eliminar", key: "DEL" }),
    });
    const project = await createRes.json();

    const deleteRes = await fetch(`${BASE_URL}/api/projects/${project.id}`, { method: "DELETE", headers: { Cookie: cookie } });
    expect(deleteRes.status).toBe(200);

    const getRes = await fetch(`${BASE_URL}/api/projects/${project.id}`, { headers: { Cookie: cookie } });
    expect(getRes.status).toBe(404);
  });
});

describe("Integration: Modules API", () => {
  it("crea modulo asociado a proyecto", async () => {
    const cookie = await loginAsAdmin();
    const authHeaders = { "Content-Type": "application/json", Cookie: cookie };

    const projRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Proyecto Mod", key: "MOD" }),
    });
    const project = await projRes.json();

    const modRes = await fetch(`${BASE_URL}/api/modules`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Modulo 1", projectId: project.id }),
    });
    expect(modRes.status).toBe(201);
    const mod = await modRes.json();
    expect(mod.name).toBe("Modulo 1");
  });
});

describe("Integration: Test Cases API", () => {
  it("crea caso de prueba", async () => {
    const cookie = await loginAsAdmin();
    const authHeaders = { "Content-Type": "application/json", Cookie: cookie };

    const projRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Proyecto TC", key: "TC" }),
    });
    const project = await projRes.json();

    const tcRes = await fetch(`${BASE_URL}/api/test-cases`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Caso de prueba 1",
        steps: "Paso 1\nPaso 2",
        expectedResult: "Resultado esperado",
        projectId: project.id,
      }),
    });
    expect(tcRes.status).toBe(201);
    const tc = await tcRes.json();
    expect(tc.title).toBe("Caso de prueba 1");
  });
});
