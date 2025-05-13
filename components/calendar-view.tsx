"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
    // Use UTC date string to match todosByDate format
    const dateStr = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2 bg-gradient-to-br from-black/95 to-black/90 border-purple-500/20 shadow-lg shadow-purple-500/5">
        <CardHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Calendar</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePreviousMonth}
                className="border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-purple-400" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNextMonth}
                className="border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-purple-400" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-lg border border-purple-500/20 bg-black/50 shadow-lg shadow-purple-500/5"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-purple-200",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30 transition-colors"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-purple-300/70 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative",
                "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                "[&:has([aria-selected].day-outside)]:bg-purple-500/10",
                "[&:has([aria-selected])]:bg-purple-500/10",
                "first:[&:has([aria-selected])]:rounded-l-md",
                "last:[&:has([aria-selected])]:rounded-r-md",
                "focus-within:relative focus-within:z-20"
              ),
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-9 p-0 font-normal text-purple-200 hover:text-purple-100 hover:bg-purple-500/20 transition-colors",
                "aria-selected:opacity-100"
              ),
              day_range_end: "day-range-end",
              day_selected: "bg-purple-500 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white",
              day_today: "bg-purple-500/20 text-purple-200",
              day_outside: "day-outside text-purple-300/50 aria-selected:bg-purple-500/10 aria-selected:text-purple-300/50",
              day_disabled: "text-purple-300/30",
              day_range_middle: "aria-selected:bg-purple-500/20 aria-selected:text-purple-200",
              day_hidden: "invisible",
            }}
            components={{
              Day: ({ date }) => renderDay(date),
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-black/95 to-black/90 border-purple-500/20 shadow-lg shadow-purple-500/5">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {selectedDateTodos.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {selectedDateTodos.map((todo) => {
                  const category = getCategory(todo.categoryId)
                  return (
                    <div 
                      key={todo.id} 
                      className="flex items-start space-x-3 p-3 rounded-lg bg-black/50 border border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 mt-0.5 rounded-full p-0 hover:bg-purple-500/20 transition-colors"
                        onClick={() => onToggle(todo.id)}
                      >
                        {todo.completed ? (
                          <CheckCircle className="h-5 w-5 text-purple-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-purple-400/50" />
                        )}
                      </Button>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={cn(
                              "text-sm font-medium text-purple-100",
                              todo.completed && "line-through text-purple-400/50",
                            )}
                          >
                            {todo.text}
                          </p>
                          {todo.priority !== "medium" && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-purple-500/20",
                                todo.priority === "high" && "text-red-400 border-red-500/20",
                                todo.priority === "low" && "text-green-400 border-green-500/20",
                              )}
                            >
                              {todo.priority}
                            </Badge>
                          )}
                        </div>
                        {category && (
                          <Badge 
                            className="text-white text-xs border-none" 
                            style={{ 
                              backgroundColor: `${category.color}40`,
                              color: category.color,
                              border: `1px solid ${category.color}40`
                            }}
                          >
                            {category.name}
                          </Badge>
                        )}
                        {todo.description && (
                          <p className="text-xs text-purple-300/70 line-clamp-2">{todo.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <p className="text-purple-300/70">No tasks scheduled for this day</p>
              <Button
                variant="outline"
                className="mt-4 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30 text-purple-400 transition-colors"
                onClick={() => {
                  (document.querySelector('button[aria-label="Add Task"]') as HTMLButtonElement)?.click()
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
