import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = 
  | "active" 
  | "inactive" 
  | "pending" 
  | "completed" 
  | "cancelled" 
  | "due" 
  | "late" 
  | "paid"
  | "default"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<StatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Aktif", variant: "default" },
  inactive: { label: "Pasif", variant: "secondary" },
  pending: { label: "Beklemede", variant: "outline" },
  completed: { label: "Tamamlandı", variant: "default" },
  cancelled: { label: "İptal", variant: "destructive" },
  due: { label: "Vadesi Geldi", variant: "outline" },
  late: { label: "Gecikmiş", variant: "destructive" },
  paid: { label: "Ödendi", variant: "default" },
  default: { label: "Bilinmiyor", variant: "secondary" },
}

function normalizeStatus(status: string): StatusType {
  const normalized = status.toLowerCase()
  if (normalized in statusConfig) {
    return normalized as StatusType
  }
  return "default"
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[normalizeStatus(status)]
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "font-medium",
        normalizeStatus(status) === "active" && "bg-green-500/10 text-green-600 hover:bg-green-500/20",
        normalizeStatus(status) === "paid" && "bg-green-500/10 text-green-600 hover:bg-green-500/20",
        normalizeStatus(status) === "completed" && "bg-green-500/10 text-green-600 hover:bg-green-500/20",
        normalizeStatus(status) === "pending" && "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20",
        normalizeStatus(status) === "due" && "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20",
        normalizeStatus(status) === "late" && "bg-red-500/10 text-red-600 hover:bg-red-500/20",
        normalizeStatus(status) === "cancelled" && "bg-red-500/10 text-red-600 hover:bg-red-500/20",
        normalizeStatus(status) === "inactive" && "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
