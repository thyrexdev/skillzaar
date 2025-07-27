import { Clock } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Static data for milestones
const milestones = [
  {
    id: "1",
    title: "Homepage Design Approval",
    project: "E-commerce Website Redesign",
    date: new Date(2023, 7, 5),
    status: "upcoming",
  },
  {
    id: "2",
    title: "Backend API Integration",
    project: "Mobile App Development",
    date: new Date(2023, 7, 12),
    status: "upcoming",
  },
  {
    id: "3",
    title: "Logo Finalization",
    project: "Brand Identity Refresh",
    date: new Date(2023, 7, 3),
    status: "urgent",
  },
  {
    id: "4",
    title: "Content Calendar Approval",
    project: "Content Marketing Strategy",
    date: new Date(2023, 7, 20),
    status: "upcoming",
  },
]

export function UpcomingMilestones() {
  // Sort milestones by date (closest first)
  const sortedMilestones = [...milestones].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upcoming Milestones</CardTitle>
        <CardDescription>Track important project deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMilestones.map((milestone) => (
            <div key={milestone.id} className="flex flex-col space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{milestone.title}</h4>
                <Badge variant={milestone.status === "urgent" ? "destructive" : "outline"}>
                  {milestone.status === "urgent" ? "Urgent" : "Upcoming"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{milestone.project}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                {format(milestone.date, "MMM d, yyyy")}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
