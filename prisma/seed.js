const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create admin user if not exists
  const adminExists = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash("admin", 10);
    await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@testservice.local",
        passwordHash,
        fullName: "Administrador",
        role: "Admin",
        status: "Active",
        mustChangePassword: true,
        isActive: true,
      },
    });
    console.log("Admin user created (username: admin, password: admin)");
  } else {
    console.log("Admin user already exists, skipping");
  }

  // Create default roles if not exist
  const roles = [
    { name: "Administrador", description: "Acceso completo al sistema" },
    { name: "Tester", description: "Gestion de casos de prueba y ejecuciones" },
    { name: "Lider de testing", description: "Gestion de ciclos y supervision" },
    { name: "Usuario UAT", description: "Aprobacion de pruebas de aceptacion" },
    { name: "Desarrollador", description: "Consulta de defectos y casos" },
    { name: "Auditor", description: "Consulta de auditoria y reportes" },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findUnique({ where: { name: role.name } });
    if (!existing) {
      await prisma.role.create({ data: role });
      console.log("Role created: " + role.name);
    }
  }

  // Create default permissions
  const sections = [
    "dashboard", "projects", "modules", "versions", "test-cases",
    "test-cycles", "executions", "defects", "uat", "users",
    "registration-requests", "roles", "reports", "audit",
  ];
  const actions = ["view", "create", "edit", "delete", "approve", "export"];

  for (const section of sections) {
    for (const action of actions) {
      const existing = await prisma.permission.findUnique({
        where: { section_action: { section, action } },
      });
      if (!existing) {
        await prisma.permission.create({
          data: { section, action, description: action + " en " + section },
        });
      }
    }
  }
  console.log("Permissions created");

  // Assign all permissions to Administrador role
  const adminRole = await prisma.role.findUnique({ where: { name: "Administrador" } });
  if (adminRole) {
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      });
      if (!existing) {
        await prisma.rolePermission.create({
          data: { roleId: adminRole.id, permissionId: perm.id },
        });
      }
    }
    console.log("All permissions assigned to Administrador role");

    const adminUser = await prisma.user.findUnique({ where: { username: "admin" } });
    if (adminUser && !adminUser.roleId) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { roleId: adminRole.id },
      });
      console.log("Admin user linked to Administrador role");
    }
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });