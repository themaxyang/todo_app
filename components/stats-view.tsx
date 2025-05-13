"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import type { Todo, Category } from "@/components/todo-app"

interface StatsViewProps {
  todos: Todo[]
  categories: Category[]
}

export default function StatsView({ todos, categories }: StatsViewProps) {
  // Calculate completion rate
  const completionRate = useMemo(() => {
    if (todos.length === 0) return 0
    const completedCount = todos.filter((todo) => todo.completed).length
    return Math.round((completedCount / todos.length) * 100)
  }, [todos])

  // Calculate overdue tasks
  const overdueTasks = useMemo(() => {
    const now = new Date()
    return todos.filter((todo) => !todo.completed && todo.dueDate && todo.dueDate < now)
  }, [todos])

  // Calculate tasks by priority
  const tasksByPriority = useMemo(() => {
    const high = todos.filter((todo) => todo.priority === "high").length
    const medium = todos.filter((todo) => todo.priority === "medium").length
    const low = todos.filter((todo) => todo.priority === "low").length
    return { high, medium, low }
  }, [todos])

  // Calculate tasks by category
  const tasksByCategory = useMemo(() => {
    const result: Record<string, { total: number; completed: number; color: string }> = {}

    // Initialize with all categories
    categories.forEach((cat) => {
      result[cat.id] = { total: 0, completed: 0, color: cat.color }
    })

    // Count tasks
    todos.forEach((todo) => {
      if (todo.categoryId) {
        if (!result[todo.categoryId]) {
          result[todo.categoryId] = { total: 0, completed: 0, color: "#888888" }
        }
        result[todo.categoryId].total++
        if (todo.completed) {
          result[todo.categoryId].completed++
        }
      }
    })

    return result
  }, [todos, categories])

  // Calculate tasks for current week
  const currentWeekTasks = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Start on Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return days.map((day) => {
      const tasksForDay = todos.filter((todo) => todo.dueDate && isSameDay(todo.dueDate, day))

      return {
        date: day,
        total: tasksForDay.length,
        completed: tasksForDay.filter((t) => t.completed).length,
      }
    })
  }, [todos])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {todos.filter((t) => t.completed).length} of {todos.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {overdueTasks.length > 0
                ? `${overdueTasks.length} task${overdueTasks.length > 1 ? "s" : ""} past due date`
                : "No overdue tasks"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                  <span className="text-sm">High</span>
                </div>
                <span className="text-sm font-medium">{tasksByPriority.high}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                  <span className="text-sm">Medium</span>
                </div>
                <span className="text-sm font-medium">{tasksByPriority.medium}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <span className="text-sm">Low</span>
                </div>
                <span className="text-sm font-medium">{tasksByPriority.low}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(tasksByCategory).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(tasksByCategory)
                  .filter(([_, data]) => data.total > 0)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([categoryId, data]) => {
                    const category = categories.find((c) => c.id === categoryId)
                    const completionPercentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0

                    return (
                      <div key={categoryId} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.color }} />
                            <span className="text-sm font-medium">{category?.name || "Unknown"}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {data.completed}/{data.total}
                          </span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No categories assigned to tasks</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentWeekTasks.map((day) => {
                const dayName = format(day.date, "EEE")
                const dateStr = format(day.date, "MMM d")
                const isToday = isSameDay(day.date, new Date())

                return (
                  <div key={dateStr} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                        {dayName} {isToday && "(Today)"} - {dateStr}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {day.completed}/{day.total}
                      </span>
                    </div>
                    {day.total > 0 ? (
                      <Progress value={day.total > 0 ? (day.completed / day.total) * 100 : 0} className="h-2" />
                    ) : (
                      <div className="text-xs text-muted-foreground">No tasks</div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
