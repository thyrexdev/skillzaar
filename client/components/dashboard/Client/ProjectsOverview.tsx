"use client"

import { useState } from "react"
import { Calendar, MoreHorizontal, PlusCircle, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Static data for projects
const projects = [
  {
    id: "1",
    title: "E-commerce Website Redesign",
    description: "Redesign of the main e-commerce platform with improved UX",
    status: "In Progress",
    progress: 65,
    budget: "$8,500",
    dueDate: "Aug 15, 2023",
    category: "Web Development",
  },
  {
    id: "2",
    title: "Mobile App Development",
    description: "iOS and Android app for inventory management",
    status: "In Progress",
    progress: 40,
    budget: "$12,000",
    dueDate: "Sep 30, 2023",
    category: "Mobile Development",
  },
  {
    id: "3",
    title: "Brand Identity Refresh",
    description: "Update logo, color scheme and brand guidelines",
    status: "Completed",
    progress: 100,
    budget: "$3,200",
    dueDate: "Jul 10, 2023",
    category: "Design",
  },
  {
    id: "4",
    title: "Content Marketing Strategy",
    description: "Develop content strategy for Q3 and Q4",
    status: "Not Started",
    progress: 0,
    budget: "$5,000",
    dueDate: "Oct 1, 2023",
    category: "Marketing",
  },
]

export function ProjectsOverview() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredProjects =
    activeTab === "all"
      ? projects
      : projects.filter((project) => {
          if (activeTab === "active") return project.status === "In Progress"
          if (activeTab === "completed") return project.status === "Completed"
          if (activeTab === "pending") return project.status === "Not Started"
          return true
        })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Manage your ongoing and upcoming projects</CardDescription>
        </div>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="flex flex-col space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{project.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Edit project</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Cancel project</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      project.status === "In Progress"
                        ? "default"
                        : project.status === "Completed"
                          ? "success"
                          : "secondary"
                    }
                  >
                    {project.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {project.category}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Due {project.dueDate}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div>
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
          <Button variant="link" size="sm" className="p-0 h-auto">
            View all projects
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
