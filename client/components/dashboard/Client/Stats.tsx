import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    name: "Active Projects",
    value: "4",
    change: "+2",
    changeType: "increase",
    icon: TrendingUp,
  },
  {
    name: "This Month",
    value: "$12,450",
    change: "-8%",
    changeType: "decrease",
    icon: TrendingDown,
  },
  {
    name: "Freelancers",
    value: "8",
    change: "0",
    changeType: "neutral",
    icon: Minus,
  },
  {
    name: "Completion Rate",
    value: "94%",
    change: "+5%",
    changeType: "increase",
    icon: TrendingUp,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
              <div className="flex items-center space-x-1">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === "increase"
                      ? "text-accent-foreground"
                      : stat.changeType === "decrease"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.change}
                </span>
                <stat.icon
                  className={`h-4 w-4 ${
                    stat.changeType === "increase"
                      ? "text-accent-foreground"
                      : stat.changeType === "decrease"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
