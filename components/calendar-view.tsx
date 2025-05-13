"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, isSameDay } from "date-fns"
import { CheckCircle, Circle, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Todo, Category } from "@/components/todo-app"

interface CalendarViewProps {
  todos: Todo[]
  todosByDate: Record<string, Todo[]>
  onToggle: (id: string) => void
  onUpdate: (id: string, updatedData: Partial<Todo>) => void
  onDelete: (id: string) => void
  categories: Category[]
}

export default function CalendarView({ todos, todosByDate, onToggle, categories }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Get todos for the selected date
  const selectedDateTodos = selectedDate
    ? todos.filter((todo) => todo.dueDate && isSameDay(todo.dueDate, selectedDate))
    : []

  const getCategory = (categoryId: string | null) => {
    if (!categoryId) return null
    return categories.find((cat) => cat.id === categoryId) || null
  }

  // Custom day renderer for the calendar
  const renderDay = (day: Date) => {
    const dateStr = day.toISOString().split("T")[0]
    const todosForDay = todosByDate[dateStr] || []
    const hasTodos = todosForDay.length > 0
    const hasOverdueTodos = todosForDay.some((todo) => !todo.completed && day < new Date())
    const hasCompletedTodos = todosForDay.some((todo) => todo.completed)

    // Count todos by priority
    const highPriorityCount = todosForDay.filter((t) => t.priority === "high").length
    const mediumPriorityCount = todosForDay.filter((t) => t.priority === "medium").length
    const lowPriorityCount = todosForDay.filter((t) => t.priority === "low").length

    return (
      <div className="relative w-full h-full">
        <time
          dateTime={dateStr}
          className={cn(
            "flex justify-center items-center h-8 w-8 rounded-full",
            selectedDate && isSameDay(day, selectedDate) && "bg-primary text-primary-foreground",
            !selectedDate && isSameDay(day, new Date()) && "border border-primary",
          )}
        >
          {format(day, "d")}
        </time>

        {hasTodos && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-0.5">
            {highPriorityCount > 0 && <div className="h-1 w-1 rounded-full bg-red-500" />}
            {mediumPriorityCount > 0 && <div className="h-1 w-1 rounded-full bg-amber-500" />}
            {lowPriorityCount > 0 && <div className="h-1 w-1 rounded-full bg-green-500" />}
          </div>
        )}

        {hasOverdueTodos && <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />}

        {hasCompletedTodos && !hasOverdueTodos && (
          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
        )}
      </div>
    )
  }

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-2">
        <CardHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle>Calendar</CardTitle>
            <div className="flex space-x-1">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border"
            components={{
              Day: ({ date }) => renderDay(date),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-5 pt-5 pb-0">
          <CardTitle>{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {selectedDateTodos.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {selectedDateTodos.map((todo) => {
                  const category = getCategory(todo.categoryId)
                  return (
                    <div key={todo.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 mt-0.5 rounded-full p-0"
                        onClick={() => onToggle(todo.id)}
                      >
                        {todo.completed ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </Button>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              todo.completed && "line-through text-muted-foreground",
                            )}
                          >
                            {todo.text}
                          </p>
                          {todo.priority !== "medium" && (
                            <Badge
                              variant="outline"
                              className={cn(
                                todo.priority === "high" && "text-red-500",
                                todo.priority === "low" && "text-green-500",
                              )}
                            >
                              {todo.priority}
                            </Badge>
                          )}
                        </div>
                        {category && (
                          <Badge className="text-white text-xs" style={{ backgroundColor: category.color }}>
                            {category.name}
                          </Badge>
                        )}
                        {todo.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{todo.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
              <p>No tasks scheduled for this day</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => {
                  document.querySelector('button[aria-label="Add Task"]')?.click()
                }}
              >
                Add a task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
