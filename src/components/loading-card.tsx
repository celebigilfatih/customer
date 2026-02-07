import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingCardProps {
  className?: string
  header?: boolean
  rows?: number
}

export function LoadingCard({ 
  className, 
  header = true, 
  rows = 3 
}: LoadingCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {header && (
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface LoadingMetricProps {
  className?: string
}

export function LoadingMetric({ className }: LoadingMetricProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px] mb-2" />
        <Skeleton className="h-3 w-[80px]" />
      </CardContent>
    </Card>
  )
}
