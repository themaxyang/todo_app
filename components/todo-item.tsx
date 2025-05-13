"use client"

import type React from "react"

import { useState } from "react"
import {
  Pencil,
  Trash2,
  Check,
  X,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  ListTodo,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import type { Todo, Priority, Category } from "@/components/todo-app"

interface TodoItemProps {
  todo: Todo
  categories: Category[]
  onToggle: (id: string) => void
  onUpdate: (id: string, updatedData: Partial<Todo>) => void
  onDelete: (id: string) => void
  onToggleSubTask: (todoId: string, subTaskId: string) => void
  onAddSubTask: (todoId: string, text: string) => void
  onDeleteSubTask: (todoId: string, subTaskId: string) => void
}

export default function TodoItem({
  todo,
  categories,
  onToggle,
  onUpdate,
  onDelete,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [editDescription, setEditDescription] = useState(todo.description)
  const [editDueDate, setEditDueDate] = useState<Date | null>(todo.dueDate)
  const [editPriority, setEditPriority] = useState<Priority>(todo.priority)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(todo.categoryId)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newSubTaskText, setNewSubTaskText] = useState("")

  const handleUpdate = () => {
    if (editText.trim()) {
      onUpdate(todo.id, {
        text: editText,
        description: editDescription,
        dueDate: editDueDate,
        priority: editPriority,
        categoryId: editCategoryId,
      })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditText(todo.text)
    setEditDescription(todo.description)
    setEditDueDate(todo.dueDate)
    setEditPriority(todo.priority)
    setEditCategoryId(todo.categoryId)
    setIsEditing(false)
  }

  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubTaskText.trim()) {
      onAddSubTask(todo.id, newSubTaskText.trim())
      setNewSubTaskText("")
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-amber-500"
      case "low":
        return "text-green-500"
      default:
        return ""
    }
  }

  const getCategory = (categoryId: string | null) => {
    if (!categoryId) return null
    return categories.find((cat) => cat.id === categoryId) || null
  }

  const category = getCategory(todo.categoryId)
  const completedSubTasks = todo.subTasks.filter((st) => st.completed).length
  const totalSubTasks = todo.subTasks.length

  return (
    <Card className={cn("transition-all duration-200", todo.completed && "opacity-75")}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="flex flex-col space-y-3">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
              className="flex-1"
              placeholder="Task title"
            />

            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add description (optional)"
              className="min-h-[80px]"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={editPriority} onValueChange={(value) => setEditPriority(value as Priority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={editCategoryId || ""} onValueChange={(value) => setEditCategoryId(value || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Clock className="mr-2 h-4 w-4" />
                      {editDueDate ? format(editDueDate, "PPP") : "No date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDueDate || undefined}
                      onSelect={setEditDueDate}
                      initialFocus
                    />
                    {editDueDate && (
                      <div className="p-2 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={() => setEditDueDate(null)} className="w-full">
                          Clear date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate}>
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 mt-0.5 rounded-full p-0"
                  onClick={() => onToggle(todo.id)}
                >
                  {todo.completed ? <CheckCircle className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                  <span className="sr-only">{todo.completed ? "Mark as incomplete" : "Mark as complete"}</span>
                </Button>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <p
                      className={cn(
                        "text-sm font-medium leading-none",
                        todo.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {todo.text}
                    </p>
                    {todo.priority !== "medium" && (
                      <Badge variant="outline" className={getPriorityColor(todo.priority)}>
                        {todo.priority}
                      </Badge>
                    )}
                    {category && (
                      <Badge className="text-white" style={{ backgroundColor: category.color }}>
                        {category.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground space-x-2">
                    <span>{formatDate(todo.createdAt)}</span>
                    {todo.dueDate && (
                      <span
                        className={cn(
                          "flex items-center",
                          new Date() > todo.dueDate && !todo.completed && "text-red-500",
                        )}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Due: {format(todo.dueDate, "MMM d")}
                      </span>
                    )}
                    {totalSubTasks > 0 && (
                      <span className="flex items-center">
                        <ListTodo className="h-3 w-3 mr-1" />
                        {completedSubTasks}/{totalSubTasks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                  disabled={todo.completed}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(todo.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>

            <CollapsibleContent className="mt-3 space-y-3">
              {todo.description && (
                <div className="text-sm text-muted-foreground border-l-2 border-muted pl-3 py-1">
                  {todo.description}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Subtasks</h4>
                  <span className="text-xs text-muted-foreground">
                    {completedSubTasks} of {totalSubTasks} completed
                  </span>
                </div>

                {todo.subTasks.length > 0 && (
                  <ul className="space-y-1">
                    {todo.subTasks.map((subTask) => (
                      <li key={subTask.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full p-0"
                            onClick={() => onToggleSubTask(todo.id, subTask.id)}
                            disabled={todo.completed}
                          >
                            {subTask.completed ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </Button>
                          <span className={cn(subTask.completed && "line-through text-muted-foreground")}>
                            {subTask.text}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => onDeleteSubTask(todo.id, subTask.id)}
                          disabled={todo.completed}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {!todo.completed && (
                  <form onSubmit={handleAddSubTask} className="flex space-x-2">
                    <Input
                      value={newSubTaskText}
                      onChange={(e) => setNewSubTaskText(e.target.value)}
                      placeholder="Add a subtask"
                      className="text-sm h-8"
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={!newSubTaskText.trim()}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </form>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
