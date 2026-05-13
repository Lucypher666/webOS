export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/pages/:path*",
    "/blog/:path*",
    "/media/:path*",
    "/banners/:path*",
    "/orders/:path*",
    "/bookings/:path*",
    "/seo/:path*",
    "/theme/:path*",
    "/settings/:path*",
    "/workspaces/:path*",
    "/users/:path*",
    "/team/:path*",
    "/audit-logs/:path*",
    "/coupons/:path*",
    "/gift-cards/:path*",
    "/customers/:path*",
  ],
}
