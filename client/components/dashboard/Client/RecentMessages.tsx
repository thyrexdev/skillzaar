"use client"

import { useState } from "react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Static data for messages
const messages = [
  {
    id: "1",
    sender: "Alex Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    message: "I've completed the first phase of the website redesign. Could you review it when you have a moment?",
    timestamp: new Date(2023, 6, 28, 14, 35),
    unread: true,
  },
  {
    id: "2",
    sender: "Sarah Williams",
    avatar: "/placeholder.svg?height=40&width=40",
    message: "Just uploaded the new mockups for the mobile app. Let me know what you think!",
    timestamp: new Date(2023, 6, 27, 9, 12),
    unread: false,
  },
  {
    id: "3",
    sender: "Michael Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    message: "I need some clarification on the requirements for the notification system.",
    timestamp: new Date(2023, 6, 26, 16, 45),
    unread: false,
  },
  {
    id: "4",
    sender: "Emily Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    message: "The blog posts for this month are ready for your review. I've also included some SEO recommendations.",
    timestamp: new Date(2023, 6, 25, 11, 20),
    unread: false,
  },
]

export function RecentMessages() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMessages = messages.filter(
    (message) =>
      message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Messages</CardTitle>
        <CardDescription>Stay in touch with your freelancers</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <div key={message.id} className="flex gap-4">
                <Image
                  src={message.avatar || "/placeholder.svg"}
                  alt={message.sender}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {message.sender}
                      {message.unread && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-primary"></span>}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">No messages found</p>
          )}
        </div>
        <Button variant="outline" className="w-full mt-4 bg-transparent">
          View All Messages
        </Button>
      </CardContent>
    </Card>
  )
}
