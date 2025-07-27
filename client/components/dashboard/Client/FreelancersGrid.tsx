import Image from "next/image"
import { MoreHorizontal, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Static data for freelancers
const freelancers = [
  {
    id: "1",
    name: "Alex Johnson",
    title: "Senior Web Developer",
    rating: 4.9,
    hourlyRate: "$65",
    skills: ["React", "Node.js", "TypeScript"],
    status: "Active",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "2",
    name: "Sarah Williams",
    title: "UI/UX Designer",
    rating: 4.8,
    hourlyRate: "$55",
    skills: ["Figma", "Adobe XD", "Sketch"],
    status: "Active",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "3",
    name: "Michael Chen",
    title: "Mobile Developer",
    rating: 4.7,
    hourlyRate: "$60",
    skills: ["React Native", "Flutter", "Swift"],
    status: "Offline",
    avatar: "/placeholder.svg?height=80&width=80",
  },
  {
    id: "4",
    name: "Emily Rodriguez",
    title: "Content Strategist",
    rating: 4.6,
    hourlyRate: "$45",
    skills: ["Content Writing", "SEO", "Marketing"],
    status: "Active",
    avatar: "/placeholder.svg?height=80&width=80",
  },
]

export function FreelancersGrid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Freelancers</CardTitle>
        <CardDescription>Manage your hired freelancers and their projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {freelancers.map((freelancer) => (
            <div key={freelancer.id} className="flex items-start space-x-4 rounded-md border p-4">
              <Image
                src={freelancer.avatar || "/placeholder.svg"}
                alt={freelancer.name}
                width={50}
                height={50}
                className="rounded-full"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{freelancer.name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View profile</DropdownMenuItem>
                      <DropdownMenuItem>Send message</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>End contract</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground">{freelancer.title}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="text-xs">{freelancer.rating}</span>
                  <span className="text-xs text-muted-foreground">• {freelancer.hourlyRate}/hr</span>
                  <Badge variant={freelancer.status === "Active" ? "outline" : "secondary"} className="ml-auto text-xs">
                    {freelancer.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {freelancer.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
