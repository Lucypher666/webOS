import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: LucideIcon
}

export function PageHeader({ title, description, action, icon: Icon }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
          {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
