"use client"

import { useState } from "react"
import { PlusCircle, Search, CalendarIcon, BarChart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TodoItem from "@/components/todo-item"
import TodoForm from "@/components/todo-form"
import { Badge } from "@/components/ui/badge"
import CalendarView from "@/components/calendar-view"
import StatsView from "@/components/stats-view"
import { ModeToggle } from "@/components/mode-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from "@/lib/hooks/useSupabase"
import type { Database } from "@/lib/supabase"

export type Priority = "low" | "medium" | "high"

export type Category = Database['public']['Tables']['categories']['Row']
export type Todo = Database['public']['Tables']['todos']['Row'] & {
  subtasks: Database['public']['Tables']['subtasks']['Row'][]
}
export type SubTask = Database['public']['Tables']['subtasks']['Row']

export default function TodoApp() {
  const {
    loading,
    todos,
    categories,
    addTodo: supabaseAddTodo,
    updateTodo: supabaseUpdateTodo,
    deleteTodo: supabaseDeleteTodo,
    addCategory: supabaseAddCategory,
    deleteCategory: supabaseDeleteCategory,
    addSubtask: supabaseAddSubtask,
    toggleSubtask: supabaseToggleSubtask,
    deleteSubtask: supabaseDeleteSubtask,
  } = useSupabase()

  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "priority">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Handle todo operations
  const handleAddTodo = async (todoData: Partial<Todo>) => {
    try {
      // Format the todo data according to the database schema
      const formattedTodoData = {
        text: todoData.text || "",
        description: todoData.description || null,
        completed: false,
        priority: (todoData.priority || "medium") as Priority,
        due_date: todoData.due_date || null,
        category_id: todoData.category_id || null,
      }

      await supabaseAddTodo(formattedTodoData)
      setIsAddingTodo(false)
    } catch (error) {
      console.error('Error adding todo:', error)
      // You might want to show an error toast here
    }
  }

  const handleToggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    try {
      await supabaseUpdateTodo(id, { completed: !todo.completed })
    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  const handleUpdateTodo = async (id: string, updatedData: Partial<Todo>) => {
    try {
      await supabaseUpdateTodo(id, updatedData)
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      await supabaseDeleteTodo(id)
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const handleAddCategory = async (name: string, color: string) => {
    try {
      await supabaseAddCategory({ name, color })
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await supabaseDeleteCategory(id)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleToggleSubTask = async (todoId: string, subTaskId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (!todo) return

    const subtask = todo.subtasks.find(st => st.id === subTaskId)
    if (!subtask) return

    try {
      await supabaseToggleSubtask(todoId, subTaskId, !subtask.completed)
    } catch (error) {
      console.error('Error toggling subtask:', error)
    }
  }

  const handleAddSubTask = async (todoId: string, text: string) => {
    try {
      await supabaseAddSubtask(todoId, text)
    } catch (error) {
      console.error('Error adding subtask:', error)
    }
  }

  const handleDeleteSubTask = async (todoId: string, subTaskId: string) => {
    try {
      await supabaseDeleteSubtask(todoId, subTaskId)
    } catch (error) {
      console.error('Error deleting subtask:', error)
    }
  }

  // Filter todos based on active tab, search query, and selected category
  const filteredTodos = todos.filter((todo) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && !todo.completed) ||
      (activeTab === "completed" && todo.completed) ||
      activeTab === "calendar" ||
      activeTab === "stats"

    const matchesSearch =
      todo.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesCategory = selectedCategory === null || todo.category_id === selectedCategory

    return matchesTab && matchesSearch && matchesCategory
  })

  // Sort todos
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === "dueDate") {
      // Handle null due dates
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return sortOrder === "asc" ? 1 : -1
      if (!b.due_date) return sortOrder === "asc" ? -1 : 1
      return sortOrder === "asc" 
        ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() 
        : new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    } else if (sortBy === "priority") {
      const priorityValues = { high: 3, medium: 2, low: 1 }
      const priorityA = priorityValues[a.priority]
      const priorityB = priorityValues[b.priority]
      return sortOrder === "asc" ? priorityA - priorityB : priorityB - priorityA
    } else {
      // Default sort by createdAt
      return sortOrder === "asc"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Count todos by status
  const activeTodosCount = todos.filter((todo) => !todo.completed).length
  const completedTodosCount = todos.filter((todo) => todo.completed).length
  const todosWithDueDateCount = todos.filter((todo) => todo.due_date !== null).length

  // Group todos by date for calendar view
  const todosByDate = todos.reduce(
    (acc, todo) => {
      if (todo.due_date) {
        const date = new Date(todo.due_date)
        const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
        if (!acc[dateStr]) {
          acc[dateStr] = []
        }
        acc[dateStr].push(todo)
      }
      return acc
    },
    {} as Record<string, Todo[]>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-purple-200">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          Todo Pro
        </h1>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setIsAddingTodo(true)} 
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          <ModeToggle />
        </div>
      </div>

      {isAddingTodo && (
        <TodoForm 
          onSubmit={handleAddTodo} 
          onCancel={() => setIsAddingTodo(false)} 
          categories={categories} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date created</SelectItem>
              <SelectItem value="dueDate">Due date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="h-10 w-10"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
          <Select value={selectedCategory || ""} onValueChange={(value) => setSelectedCategory(value || null)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
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
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between overflow-x-auto">
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {todos.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">
                {activeTodosCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              <Badge variant="secondary" className="ml-2">
                {completedTodosCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Calendar
              <Badge variant="secondary" className="ml-2">
                {todosWithDueDateCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center">
              <BarChart className="h-4 w-4 mr-1" />
              Stats
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4">
          {sortedTodos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? "No matching tasks found" : "No tasks yet. Add one to get started!"}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onToggle={handleToggleTodo}
                  onUpdate={handleUpdateTodo}
                  onDelete={handleDeleteTodo}
                  onToggleSubTask={handleToggleSubTask}
                  onAddSubTask={handleAddSubTask}
                  onDeleteSubTask={handleDeleteSubTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {sortedTodos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? "No matching active tasks found" : "No active tasks!"}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onToggle={handleToggleTodo}
                  onUpdate={handleUpdateTodo}
                  onDelete={handleDeleteTodo}
                  onToggleSubTask={handleToggleSubTask}
                  onAddSubTask={handleAddSubTask}
                  onDeleteSubTask={handleDeleteSubTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {sortedTodos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? "No matching completed tasks found" : "No completed tasks!"}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onToggle={handleToggleTodo}
                  onUpdate={handleUpdateTodo}
                  onDelete={handleDeleteTodo}
                  onToggleSubTask={handleToggleSubTask}
                  onAddSubTask={handleAddSubTask}
                  onDeleteSubTask={handleDeleteSubTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            todos={todos}
            todosByDate={todosByDate}
            onToggle={handleToggleTodo}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
            categories={categories}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <StatsView todos={todos} categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
