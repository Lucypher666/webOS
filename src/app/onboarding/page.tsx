"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layers, Building2, Palette, Globe, ArrowRight, Check } from "lucide-react"

const steps = [
  { id: "workspace", title: "Name your workspace", icon: Building2 },
  { id: "brand", title: "Set your brand colors", icon: Palette },
  { id: "site", title: "Configure your site", icon: Globe },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    siteName: "",
    siteUrl: "",
    contactEmail: "",
    primaryColor: "#3b82f6",
    accentColor: "#6366f1",
    currency: "USD",
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleFinish() {
    setLoading(true)
    try {
      await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteName: form.siteName,
            siteUrl: form.siteUrl,
            contactEmail: form.contactEmail,
            currency: form.currency,
          }),
        }),
        fetch("/api/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            primaryColor: form.primaryColor,
            accentColor: form.accentColor,
          }),
        }),
      ])
      router.push("/dashboard")
    } catch {
      setLoading(false)
    }
  }

  const isLast = step === steps.length - 1

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Let&apos;s set up your workspace</h1>
          <p className="text-zinc-400 mt-1 text-sm">Takes less than 2 minutes</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${i < step ? "bg-emerald-500" : "bg-zinc-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            {(() => { const Icon = steps[step].icon; return <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-blue-400" /></div> })()}
            <h2 className="text-lg font-semibold text-white">{steps[step].title}</h2>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Business / site name</label>
                <input
                  type="text"
                  value={form.siteName}
                  onChange={e => set("siteName", e.target.value)}
                  placeholder="My Awesome Store"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Contact email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={e => set("contactEmail", e.target.value)}
                  placeholder="hello@yoursite.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Currency</label>
                <select
                  value={form.currency}
                  onChange={e => set("currency", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Primary color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={e => set("primaryColor", e.target.value)}
                    className="w-12 h-10 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={e => set("primaryColor", e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Accent color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={e => set("accentColor", e.target.value)}
                    className="w-12 h-10 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.accentColor}
                    onChange={e => set("accentColor", e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl border border-zinc-700 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.primaryColor }} />
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.accentColor }} />
                <span className="text-sm text-zinc-400">Preview of your brand colors</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Website URL <span className="text-zinc-600">(optional)</span></label>
                <input
                  type="url"
                  value={form.siteUrl}
                  onChange={e => set("siteUrl", e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-zinc-600">Where your storefront is hosted. You can add this later.</p>
              </div>
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4">
                <p className="text-sm text-blue-300 font-medium mb-1">You&apos;re all set!</p>
                <p className="text-xs text-blue-400">Your workspace is ready. You can always update these settings later from the Settings page.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Skip setup
              </button>
            )}

            <button
              onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
              disabled={loading || (step === 0 && !form.siteName)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              {loading ? "Saving…" : isLast ? "Go to dashboard" : "Continue"}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
