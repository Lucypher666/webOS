/**
 * Tells the storefront to instantly rebuild specific pages.
 * Call this inside any admin API route after a successful save/delete.
 *
 * Requires env vars:
 *   STOREFRONT_URL      = https://your-storefront.vercel.app
 *   REVALIDATE_SECRET   = same secret set on the storefront
 */

const STOREFRONT_URL = process.env.STOREFRONT_URL
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

type RevalidateOptions = {
  tags?: string[]       // invalidate by cache tag (e.g. "products", "posts")
  paths?: string[]      // invalidate specific URLs (e.g. "/products/my-slug")
}

export async function revalidateStorefront(opts: RevalidateOptions): Promise<void> {
  if (!STOREFRONT_URL || !REVALIDATE_SECRET) {
    // Silently skip if not configured — storefront will fall back to ISR
    return
  }

  try {
    await fetch(`${STOREFRONT_URL}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: REVALIDATE_SECRET,
        tags: opts.tags ?? [],
        paths: opts.paths ?? [],
      }),
      // Don't wait forever — fire and move on
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Revalidation failure should never break the admin save
    console.warn("[revalidate] Could not reach storefront — changes will appear after ISR timeout")
  }
}
