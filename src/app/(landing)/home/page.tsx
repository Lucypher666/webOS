import Link from "next/link"
import { Layers, BarChart2, Globe, ShoppingBag, FileText, Image, Zap, Shield, Users, ArrowRight, Check } from "lucide-react"

const features = [
  { icon: ShoppingBag, title: "Products & Orders", desc: "Full inventory management, order tracking, and customer data in one place." },
  { icon: FileText, title: "Blog & Pages", desc: "Create content, landing pages, and blog posts with a clean editor." },
  { icon: Image, title: "Media Library", desc: "Upload and manage all your images and files in one organised library." },
  { icon: BarChart2, title: "Analytics", desc: "Real-time revenue, order trends, and growth metrics on your dashboard." },
  { icon: Globe, title: "Public API", desc: "GraphQL API to power your storefront or any frontend you choose." },
  { icon: Users, title: "Team Access", desc: "Invite team members with role-based permissions — owner, editor, and more." },
  { icon: Zap, title: "Coupons & Gift Cards", desc: "Run promotions with discount codes and gift cards built right in." },
  { icon: Shield, title: "Multi-tenant & Secure", desc: "Every workspace is fully isolated. Your data stays yours." },
]

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect to get started",
    features: ["1 workspace", "Up to 50 products", "100 orders/month", "Community support"],
    cta: "Start free",
    href: "/register",
    highlight: false,
    available: true,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "For growing businesses",
    features: ["1 workspace", "Up to 500 products", "Unlimited orders", "Email support", "Custom domain", "Coupons & Gift cards"],
    cta: "Coming Soon",
    href: null,
    highlight: true,
    available: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For serious operations",
    features: ["3 workspaces", "Unlimited products", "Unlimited orders", "Priority support", "Team members", "Advanced analytics", "API access"],
    cta: "Coming Soon",
    href: null,
    highlight: false,
    available: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <header className="border-b border-zinc-800 sticky top-0 z-50 bg-zinc-950/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">WebOS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          </nav>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3 h-3" />
          The all-in-one website management platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Manage your entire<br />
          <span className="text-blue-500">website in one place</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
          WebOS gives you everything you need to run your business online — products, orders, blog, pages, media, SEO, and more. One dashboard. Zero complexity.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Sign in to dashboard
          </Link>
        </div>
        <p className="text-zinc-600 text-sm mt-4">No credit card required · Free plan available</p>
      </section>


      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Everything you need to run your business</h2>
          <p className="text-zinc-400">All the tools, none of the bloat.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
              <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
          <p className="text-zinc-400">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border flex flex-col ${
                plan.highlight
                  ? "bg-blue-600 border-blue-500"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <div className="mb-6">
                <p className={`text-sm font-medium mb-1 ${plan.highlight ? "text-blue-200" : "text-zinc-400"}`}>{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? "text-blue-200" : "text-zinc-500"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mt-2 ${plan.highlight ? "text-blue-100" : "text-zinc-500"}`}>{plan.description}</p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-blue-200" : "text-emerald-400"}`} />
                    <span className={plan.highlight ? "text-blue-50" : "text-zinc-300"}>{f}</span>
                  </li>
                ))}
              </ul>
              {plan.available ? (
                <Link
                  href={plan.href!}
                  className={`w-full text-center font-semibold py-2.5 rounded-xl text-sm transition-colors ${
                    plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <div
                  className={`w-full text-center font-semibold py-2.5 rounded-xl text-sm cursor-not-allowed opacity-60 ${
                    plan.highlight
                      ? "bg-white text-blue-600"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {plan.cta}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to launch?</h2>
          <p className="text-zinc-400 mb-8">Join businesses already managing their websites with WebOS.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Create your free workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span>WebOS</span>
          </div>
          <p>© {new Date().getFullYear()} WebOS. Built by <a href="https://evokira.in" target="_blank" rel="noopener noreferrer" className="text-zinc-400 font-medium hover:text-white transition-colors">Evokira</a>. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-zinc-400 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-zinc-400 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
