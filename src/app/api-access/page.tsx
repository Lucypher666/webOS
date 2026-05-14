"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Code2, Copy, Check, RefreshCw, Globe, Key, Zap, BookOpen } from "lucide-react"

const EXAMPLE_QUERIES = [
  {
    label: "Get Products",
    query: `query {
  products(limit: 10) {
    items {
      id
      name
      slug
      price
      comparePrice
      images
      category
      featured
      stock
    }
    total
  }
}`,
  },
  {
    label: "Get Single Product",
    query: `query {
  product(slug: "your-product-slug") {
    id
    name
    price
    description
    images
    tags
    variants {
      id
      name
      price
      stock
    }
  }
}`,
  },
  {
    label: "Get Blog Posts",
    query: `query {
  posts(limit: 5) {
    items {
      id
      title
      slug
      excerpt
      coverImage
      publishedAt
      category
    }
    total
  }
}`,
  },
  {
    label: "Get Settings & Banners",
    query: `query {
  settings {
    siteName
    logo
    contactEmail
    currency
  }
  banners {
    title
    subtitle
    image
    link
    buttonText
  }
}`,
  },
]

const CODE_EXAMPLES = [
  {
    label: "Next.js / React",
    lang: "typescript",
    code: (endpoint: string, apiKey: string) => `// Install: npm install graphql-request
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('${endpoint}', {
  headers: { 'x-api-key': '${apiKey}' },
})

// Fetch products
const data = await client.request(\`
  query {
    products(limit: 10) {
      items { id name slug price images }
    }
  }
\`)`,
  },
  {
    label: "Fetch API",
    lang: "javascript",
    code: (endpoint: string, apiKey: string) => `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey}',
  },
  body: JSON.stringify({
    query: \`
      query {
        products(limit: 10) {
          items { id name slug price images }
        }
      }
    \`,
  }),
})

const { data } = await response.json()
console.log(data.products.items)`,
  },
  {
    label: "Public URL (no key)",
    lang: "bash",
    code: (endpoint: string, _: string, slug: string) =>
      `# Use workspace slug instead of API key
curl -X POST '${endpoint.replace("/api/graphql", "")}/api/graphql?workspace=${slug}' \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"{ products(limit:5){ items { name price } } }"}'`,
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function ApiAccessPage() {
  const [apiKey, setApiKey] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [activeQuery, setActiveQuery] = useState(0)
  const [activeCode, setActiveCode] = useState(0)
  const [showKey, setShowKey] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const endpoint = `${baseUrl}/api/graphql`

  useEffect(() => {
    fetch("/api/workspaces/me")
      .then(r => r.json())
      .then(d => {
        setApiKey(d.apiKey ?? "")
        setSlug(d.slug ?? "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function regenerateKey() {
    if (!confirm("This will invalidate your current API key. Any existing integrations will stop working. Continue?")) return
    setRegenerating(true)
    const res = await fetch("/api/workspaces/regenerate-key", { method: "POST" })
    const data = await res.json()
    if (data.apiKey) setApiKey(data.apiKey)
    setRegenerating(false)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="API Access"
        description="Connect your storefront or any app to WebOS via GraphQL"
        icon={Code2}
      />

      {/* Endpoint + Key */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Endpoint */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-zinc-900 text-sm">GraphQL Endpoint</h3>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <code className="text-xs text-zinc-700 flex-1 truncate">{endpoint}</code>
            <CopyButton text={endpoint} />
          </div>
          <p className="text-xs text-zinc-400 mt-2">Send POST requests with your query in the body</p>
        </div>

        {/* API Key */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-zinc-900 text-sm">API Key</h3>
            </div>
            <button
              onClick={regenerateKey}
              disabled={regenerating}
              className="text-xs text-zinc-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <code className="text-xs text-zinc-700 flex-1 truncate font-mono">
              {loading ? "Loading..." : showKey ? apiKey : "•".repeat(32)}
            </code>
            <button onClick={() => setShowKey(s => !s)} className="text-xs text-zinc-400 hover:text-zinc-600 px-1">
              {showKey ? "Hide" : "Show"}
            </button>
            <CopyButton text={apiKey} />
          </div>
          <p className="text-xs text-zinc-400 mt-2">Send as <code className="bg-zinc-100 px-1 rounded">x-api-key</code> header</p>
        </div>
      </div>

      {/* Public URL */}
      {slug && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 mb-1">Public URL (no API key needed)</p>
            <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2">
              <code className="text-xs text-blue-700 flex-1 truncate">{endpoint}?workspace={slug}</code>
              <CopyButton text={`${endpoint}?workspace=${slug}`} />
            </div>
            <p className="text-xs text-blue-600 mt-1">Use this for public storefronts. Only exposes published content.</p>
          </div>
        </div>
      )}

      {/* Code examples */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="border-b border-zinc-100 px-5 py-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-500" />
          <h3 className="font-semibold text-zinc-900">Integration Examples</h3>
        </div>
        <div className="flex border-b border-zinc-100">
          {CODE_EXAMPLES.map((ex, i) => (
            <button
              key={ex.label}
              onClick={() => setActiveCode(i)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeCode === i
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <div className="relative bg-zinc-950 p-5">
          <div className="absolute top-3 right-3">
            <CopyButton text={CODE_EXAMPLES[activeCode].code(endpoint, apiKey, slug)} />
          </div>
          <pre className="text-xs text-zinc-300 overflow-x-auto leading-relaxed">
            <code>{CODE_EXAMPLES[activeCode].code(endpoint, apiKey, slug)}</code>
          </pre>
        </div>
      </div>

      {/* Example Queries */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h3 className="font-semibold text-zinc-900">Example Queries</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Copy these into your GraphQL client</p>
        </div>
        <div className="flex border-b border-zinc-100 overflow-x-auto">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={q.label}
              onClick={() => setActiveQuery(i)}
              className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeQuery === i
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="relative bg-zinc-950 p-5">
          <div className="absolute top-3 right-3">
            <CopyButton text={EXAMPLE_QUERIES[activeQuery].query} />
          </div>
          <pre className="text-xs text-zinc-300 overflow-x-auto leading-relaxed">
            <code>{EXAMPLE_QUERIES[activeQuery].query}</code>
          </pre>
        </div>
      </div>

      {/* Supported frameworks */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h3 className="font-semibold text-zinc-900 mb-4">Works with any framework</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["Next.js", "React", "Vue / Nuxt", "Svelte", "React Native", "Flutter", "Plain HTML", "Any REST client"].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
