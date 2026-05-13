import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // 10 attempts per email per 15 minutes
        const rl = rateLimit({ key: `login:${credentials.email}`, limit: 10, windowMs: 15 * 60 * 1000 })
        if (!rl.success) throw new Error("Too many login attempts. Please wait 15 minutes and try again.")

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { workspace: true },
        })

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: user.workspace?.name ?? null,
          workspaceSlug: user.workspace?.slug ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.workspaceId = user.workspaceId
        token.workspaceName = user.workspaceName
        token.workspaceSlug = user.workspaceSlug
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.workspaceId = token.workspaceId as string | null
        session.user.workspaceName = token.workspaceName as string | null
        session.user.workspaceSlug = token.workspaceSlug as string | null
      }
      return session
    },
  },
}
