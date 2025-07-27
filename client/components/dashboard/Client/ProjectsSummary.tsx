import { Calendar, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const projects = [
  {
    id: "1",
    name: "E-commerce Redesign",
    progress: 75,
    budget: "$8,500",
    dueDate: "Aug 15",
    status: "On Track",
    freelancer: "Alex Johnson",
  },
  {
    id: "2",
    name: "Mobile App Development",
    progress: 45,
    budget: "$12,000",
    dueDate: "Sep 30",
    status: "In Progress",
    freelancer: "Sarah Williams",
  },
  {
    id: "3",
    name: "Brand Identity",
    progress: 90,
    budget: "$3,200",
    dueDate: "Aug 5",
    status: "Almost Done",
    freelancer: "Michael Chen",
  },
]

export function ProjectsSummary() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-foreground">Active Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {projects.map((project) => (
          <div key={project.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.freelancer}</p>
              </div>
              <Badge
                variant="outline"
                className={`${
                  project.status === "On Track"
                    ? "border-accent bg-accent/10 text-accent-foreground"
                    : project.status === "Almost Done"
                      ? "border-primary bg-primary/10 text-primary-foreground"
                      : "border-secondary bg-secondary/10 text-secondary-foreground"
                }`}
              >
                {project.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>{project.budget}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Due {project.dueDate}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
