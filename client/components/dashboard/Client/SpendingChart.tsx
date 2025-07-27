"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, type TooltipProps } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Static data for spending chart
const monthlyData = [
  { name: "Jan", amount: 2400 },
  { name: "Feb", amount: 1398 },
  { name: "Mar", amount: 9800 },
  { name: "Apr", amount: 3908 },
  { name: "May", amount: 4800 },
  { name: "Jun", amount: 3800 },
  { name: "Jul", amount: 4300 },
]

const weeklyData = [
  { name: "Mon", amount: 900 },
  { name: "Tue", amount: 1200 },
  { name: "Wed", amount: 1800 },
  { name: "Thu", amount: 800 },
  { name: "Fri", amount: 1500 },
  { name: "Sat", amount: 300 },
  { name: "Sun", amount: 100 },
]

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Amount</span>
            <span className="font-bold text-muted-foreground">${payload[0].value}</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function SpendingChart() {
  const [activeTab, setActiveTab] = useState("monthly")
  const data = activeTab === "monthly" ? monthlyData : weeklyData

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Overview</CardTitle>
        <CardDescription>Track your spending on freelance projects</CardDescription>
        <Tabs defaultValue="monthly" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} dy={10} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
