import { createYoga, createSchema } from 'graphql-yoga'
import { prisma } from '@/lib/prisma'

const { handleRequest } = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        # Workspace
        workspace: Workspace

        # Products
        products(category: String, featured: Boolean, search: String, limit: Int, page: Int): ProductList!
        product(slug: String!): Product
        categories: [String!]!

        # Blog
        posts(category: String, limit: Int, page: Int): PostList!
        post(slug: String!): Post

        # Pages
        pages: [Page!]!
        page(slug: String!): Page

        # Banners
        banners: [Banner!]!

        # Settings
        settings: Settings

        # Theme
        theme: Theme

        # SEO
        seoConfig: SeoConfig
      }

      # ── Workspace ───────────────────────────────────────────
      type Workspace {
        id: ID!
        name: String!
        slug: String!
        description: String
        logo: String
        plan: String!
      }

      # ── Products ────────────────────────────────────────────
      type ProductList {
        items: [Product!]!
        total: Int!
        page: Int!
        pages: Int!
      }

      type Product {
        id: ID!
        name: String!
        slug: String!
        description: String
        price: Float!
        comparePrice: Float
        images: [String!]!
        stock: Int!
        sku: String
        category: String
        tags: [String!]!
        featured: Boolean!
        variants: [ProductVariant!]!
        createdAt: String!
      }

      type ProductVariant {
        id: ID!
        name: String!
        sku: String
        price: Float
        stock: Int!
        options: String
      }

      # ── Blog ────────────────────────────────────────────────
      type PostList {
        items: [Post!]!
        total: Int!
        page: Int!
        pages: Int!
      }

      type Post {
        id: ID!
        title: String!
        slug: String!
        content: String
        excerpt: String
        coverImage: String
        category: String
        tags: [String!]!
        author: String
        publishedAt: String
        createdAt: String!
      }

      # ── Pages ───────────────────────────────────────────────
      type Page {
        id: ID!
        title: String!
        slug: String!
        content: String
        metaTitle: String
        metaDescription: String
        createdAt: String!
      }

      # ── Banners ─────────────────────────────────────────────
      type Banner {
        id: ID!
        title: String!
        subtitle: String
        image: String
        link: String
        buttonText: String
        order: Int!
      }

      # ── Settings ────────────────────────────────────────────
      type Settings {
        siteName: String
        siteUrl: String
        contactEmail: String
        contactPhone: String
        address: String
        currency: String
        timezone: String
        socialLinks: SocialLinks
      }

      type SocialLinks {
        facebook: String
        instagram: String
        twitter: String
        linkedin: String
        youtube: String
      }

      # ── Theme ────────────────────────────────────────────────
      type Theme {
        primaryColor: String!
        secondaryColor: String!
        accentColor: String!
        fontHeading: String!
        fontBody: String!
        logo: String
        favicon: String
      }

      # ── SEO ──────────────────────────────────────────────────
      type SeoConfig {
        metaTitle: String
        metaDesc: String
        ogImage: String
        googleAnalyticsId: String
        robots: String
        sitemap: Boolean
      }
    `,
    resolvers: {
      Query: {
        workspace: async (_, __, ctx: any) => {
          return prisma.workspace.findUnique({ where: { id: ctx.workspaceId } })
        },

        products: async (_, { category, featured, search, limit = 20, page = 1 }: any, ctx: any) => {
          const where: any = { workspaceId: ctx.workspaceId, status: 'ACTIVE' }
          if (category) where.category = category
          if (featured !== undefined) where.featured = featured
          if (search) where.name = { contains: search, mode: 'insensitive' }

          const [items, total] = await Promise.all([
            prisma.product.findMany({
              where,
              include: { variants: true },
              orderBy: { createdAt: 'desc' },
              skip: (page - 1) * limit,
              take: limit,
            }),
            prisma.product.count({ where }),
          ])
          return { items, total, page, pages: Math.ceil(total / limit) }
        },

        product: async (_, { slug }: any, ctx: any) => {
          return prisma.product.findFirst({
            where: { workspaceId: ctx.workspaceId, slug, status: 'ACTIVE' },
            include: { variants: true },
          })
        },

        categories: async (_, __, ctx: any) => {
          const products = await prisma.product.findMany({
            where: { workspaceId: ctx.workspaceId, status: 'ACTIVE', category: { not: null } },
            select: { category: true },
            distinct: ['category'],
          })
          return products.map(p => p.category).filter(Boolean) as string[]
        },

        posts: async (_, { category, limit = 10, page = 1 }: any, ctx: any) => {
          const where: any = { workspaceId: ctx.workspaceId, status: 'PUBLISHED' }
          if (category) where.category = category

          const [items, total] = await Promise.all([
            prisma.post.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              skip: (page - 1) * limit,
              take: limit,
            }),
            prisma.post.count({ where }),
          ])
          return { items, total, page, pages: Math.ceil(total / limit) }
        },

        post: async (_, { slug }: any, ctx: any) => {
          return prisma.post.findFirst({
            where: { workspaceId: ctx.workspaceId, slug, status: 'PUBLISHED' },
          })
        },

        pages: async (_, __, ctx: any) => {
          return prisma.page.findMany({
            where: { workspaceId: ctx.workspaceId, status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
          })
        },

        page: async (_, { slug }: any, ctx: any) => {
          return prisma.page.findFirst({
            where: { workspaceId: ctx.workspaceId, slug, status: 'PUBLISHED' },
          })
        },

        banners: async (_, __, ctx: any) => {
          return prisma.banner.findMany({
            where: { workspaceId: ctx.workspaceId, active: true },
            orderBy: { order: 'asc' },
          })
        },

        settings: async (_, __, ctx: any) => {
          const s = await prisma.settings.findUnique({ where: { workspaceId: ctx.workspaceId } })
          if (!s) return null
          let social: any = {}
          try { social = JSON.parse(s.socialLinks as string ?? '{}') } catch {}
          return { ...s, socialLinks: social }
        },

        theme: async (_, __, ctx: any) => {
          return prisma.theme.findUnique({ where: { workspaceId: ctx.workspaceId } })
        },

        seoConfig: async (_, __, ctx: any) => {
          return prisma.seoConfig.findUnique({ where: { workspaceId: ctx.workspaceId } })
        },
      },

      Product: {
        images: (p: any) => {
          if (Array.isArray(p.images)) return p.images
          try { return JSON.parse(p.images ?? '[]') } catch { return [] }
        },
        tags: (p: any) => {
          if (Array.isArray(p.tags)) return p.tags
          try { return JSON.parse(p.tags ?? '[]') } catch { return [] }
        },
        createdAt: (p: any) => p.createdAt?.toISOString?.() ?? p.createdAt,
      },

      Post: {
        tags: (p: any) => {
          if (Array.isArray(p.tags)) return p.tags
          try { return JSON.parse(p.tags ?? '[]') } catch { return [] }
        },
        publishedAt: (p: any) => p.publishedAt?.toISOString?.() ?? p.publishedAt ?? null,
        createdAt: (p: any) => p.createdAt?.toISOString?.() ?? p.createdAt,
      },

      Page: {
        createdAt: (p: any) => p.createdAt?.toISOString?.() ?? p.createdAt,
      },
    },
  }),

  context: async ({ request }) => {
    // Support both x-api-key header and ?workspace= query param (public read)
    const apiKey = request.headers.get('x-api-key')
    const url = new URL(request.url)
    const workspaceSlug = url.searchParams.get('workspace')

    if (apiKey) {
      const workspace = await prisma.workspace.findUnique({ where: { apiKey } })
      if (!workspace) throw new Error('Invalid API key')
      return { workspaceId: workspace.id }
    }

    if (workspaceSlug) {
      const workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })
      if (!workspace) throw new Error('Workspace not found')
      return { workspaceId: workspace.id }
    }

    throw new Error('Provide x-api-key header or ?workspace=your-slug query param')
  },

  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export const GET = (request: Request) => handleRequest(request, {})
export const POST = (request: Request) => handleRequest(request, {})
