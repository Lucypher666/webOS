import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash("admin123", 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@webos.dev" },
    update: {},
    create: {
      email: "admin@webos.dev",
      password,
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  })

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-store" },
    update: {},
    create: {
      name: "Demo Store",
      slug: "demo-store",
      description: "A demo ecommerce workspace",
    },
  })

  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: {
      email: "owner@demo.com",
      password: await bcrypt.hash("owner123", 12),
      name: "Demo Owner",
      role: "WORKSPACE_OWNER",
      workspaceId: workspace.id,
    },
  })

  await prisma.settings.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      siteName: "Demo Store",
      contactEmail: "hello@demo.com",
      currency: "USD",
    },
  })

  await prisma.theme.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: { workspaceId: workspace.id },
  })

  await prisma.seoConfig.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      metaTitle: "Demo Store",
      metaDesc: "Welcome to our demo store",
    },
  })

  console.log("Seeded:")
  console.log("  Super Admin → admin@webos.dev / admin123")
  console.log("  Workspace Owner → owner@demo.com / owner123")
  console.log("  Workspace: Demo Store")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
