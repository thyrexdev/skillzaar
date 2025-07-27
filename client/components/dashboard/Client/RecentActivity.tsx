import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const activities = [
  {
    id: "1",
    action: "Project milestone completed",
    project: "E-commerce Redesign",
    time: "2 hours ago",
  },
  {
    id: "2",
    action: "New message received",
    project: "Mobile App Development",
    time: "4 hours ago",
  },
  {
    id: "3",
    action: "Invoice submitted",
    project: "Brand Identity",
    time: "1 day ago",
  },
  {
    id: "4",
    action: "Freelancer hired",
    project: "Content Strategy",
    time: "2 days ago",
  },
]

export function RecentActivity() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="space-y-1">
            <p className="text-sm font-medium text-foreground">{activity.action}</p>
            <p className="text-xs text-muted-foreground">{activity.project}</p>
            <p className="text-xs text-muted-foreground/70">{activity.time}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
