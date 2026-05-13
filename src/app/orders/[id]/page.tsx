import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Package, Truck, User, MapPin, CreditCard, ExternalLink } from "lucide-react"

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"
  const workspaceId = session?.user?.workspaceId

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      workspace: { select: { name: true } },
      items: { include: { product: { select: { name: true, images: true } } } },
    },
  })

  if (!order || (!isSuperAdmin && order.workspaceId !== workspaceId)) {
    return <div className="p-6 text-zinc-500">Order not found</div>
  }

  let address: any = {}
  try { address = JSON.parse(order.address ?? "{}") } catch {}

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.createdAt)}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900">Order Items</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {order.items.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-zinc-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">Qty: {item.quantity} · {formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-zinc-50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>−{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-zinc-900 border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900">Shipping</h2>
              </div>
              <Badge variant="outline">{order.shippingStatus}</Badge>
            </div>

            {order.trackingNumber ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Tracking Number</p>
                    <p className="text-sm font-bold text-blue-900 mt-1">{order.trackingNumber}</p>
                  </div>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
                      Track Package <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-zinc-100 rounded-xl">
                <p className="text-sm text-zinc-400">No tracking information added yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6">
            <div className="space-y-3">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" /> Customer
              </h2>
              <div>
                <p className="text-sm font-medium text-zinc-900">{order.customerName}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{order.customerEmail}</p>
                {order.customerPhone && <p className="text-xs text-zinc-500">{order.customerPhone}</p>}
              </div>
            </div>

            <div className="space-y-3 border-t pt-5">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-400" /> Shipping Address
              </h2>
              {order.address ? (
                <div className="text-xs text-zinc-600 leading-relaxed space-y-0.5">
                  {address.line1 && <p>{address.line1}</p>}
                  {address.line2 && <p>{address.line2}</p>}
                  {(address.city || address.state) && <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>}
                  {address.zip && <p>{address.zip}</p>}
                  {address.country && <p>{address.country}</p>}
                  {!address.line1 && <p>{order.address}</p>}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">No address provided</p>
              )}
            </div>

            <div className="space-y-3 border-t pt-5">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-400" /> Payment
              </h2>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Method</span>
                  <span className="text-zinc-700">{order.paymentMethod ?? "Not specified"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Status</span>
                  <span className={`font-medium ${order.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="space-y-3 border-t pt-5">
                <h2 className="font-semibold text-zinc-900">Notes</h2>
                <p className="text-xs text-zinc-600 leading-relaxed">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
