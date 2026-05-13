import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      workspaceId: string | null
      workspaceName: string | null
      workspaceSlug: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    workspaceId: string | null
    workspaceName: string | null
    workspaceSlug: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    workspaceId: string | null
    workspaceName: string | null
    workspaceSlug: string | null
  }
}
