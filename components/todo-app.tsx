"use client"

import { useState, useEffect } from "react"
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

export type Priority = "low" | "medium" | "high"

export type Category = {
  id: string
  name: string
  color: string
}

export type Todo = {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  dueDate: Date | null
  priority: Priority
  categoryId: string | null
  description: string
  subTasks: SubTask[]
}

export type SubTask = {
  id: string
  text: string
  completed: boolean
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "priority">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Load todos and categories from localStorage on initial render
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos")
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos)
        // Convert string dates back to Date objects
        const todosWithDates = parsedTodos.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
          subTasks: todo.subTasks || [],
          description: todo.description || "",
          priority: todo.priority || "medium",
          categoryId: todo.categoryId || null,
        }))
        setTodos(todosWithDates)
      } catch (error) {
        console.error("Failed to parse todos from localStorage", error)
      }
    }

    const savedCategories = localStorage.getItem("categories")
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories))
      } catch (error) {
        console.error("Failed to parse categories from localStorage", error)
      }
    } else {
      // Default categories
      const defaultCategories = [
        { id: "work", name: "Work", color: "#ef4444" },
        { id: "personal", name: "Personal", color: "#3b82f6" },
        { id: "shopping", name: "Shopping", color: "#10b981" },
        { id: "health", name: "Health", color: "#8b5cf6" },
      ]
      setCategories(defaultCategories)
      localStorage.setItem("categories", JSON.stringify(defaultCategories))
    }
  }, [])

  // Save todos and categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories))
  }, [categories])

  const addTodo = (todoData: Partial<Todo>) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: todoData.text || "",
      completed: false,
      createdAt: new Date(),
      dueDate: todoData.dueDate || null,
      priority: todoData.priority || "medium",
      categoryId: todoData.categoryId || null,
      description: todoData.description || "",
      subTasks: todoData.subTasks || [],
    }
    setTodos([newTodo, ...todos])
    setIsAddingTodo(false)
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const updateTodo = (id: string, updatedData: Partial<Todo>) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, ...updatedData } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const addCategory = (name: string, color: string) => {
    const newCategory = {
      id: Date.now().toString(),
      name,
      color,
    }
    setCategories([...categories, newCategory])
  }

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((category) => category.id !== id))
    // Remove category from todos
    setTodos(todos.map((todo) => (todo.categoryId === id ? { ...todo, categoryId: null } : todo)))
  }

  const toggleSubTask = (todoId: string, subTaskId: string) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === todoId) {
          const updatedSubTasks = todo.subTasks.map((subTask) =>
            subTask.id === subTaskId ? { ...subTask, completed: !subTask.completed } : subTask,
          )
          return { ...todo, subTasks: updatedSubTasks }
        }
        return todo
      }),
    )
  }

  const addSubTask = (todoId: string, text: string) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === todoId) {
          const newSubTask = {
            id: Date.now().toString(),
            text,
            completed: false,
          }
          return { ...todo, subTasks: [...todo.subTasks, newSubTask] }
        }
        return todo
      }),
    )
  }

  const deleteSubTask = (todoId: string, subTaskId: string) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            subTasks: todo.subTasks.filter((subTask) => subTask.id !== subTaskId),
          }
        }
        return todo
      }),
    )
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
      todo.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === null || todo.categoryId === selectedCategory

    return matchesTab && matchesSearch && matchesCategory
  })

  // Sort todos
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === "dueDate") {
      // Handle null due dates
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return sortOrder === "asc" ? 1 : -1
      if (!b.dueDate) return sortOrder === "asc" ? -1 : 1
      return sortOrder === "asc" ? a.dueDate.getTime() - b.dueDate.getTime() : b.dueDate.getTime() - a.dueDate.getTime()
    } else if (sortBy === "priority") {
      const priorityValues = { high: 3, medium: 2, low: 1 }
      const priorityA = priorityValues[a.priority]
      const priorityB = priorityValues[b.priority]
      return sortOrder === "asc" ? priorityA - priorityB : priorityB - priorityA
    } else {
      // Default sort by createdAt
      return sortOrder === "asc"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime()
    }
  })

  // Count todos by status
  const activeTodosCount = todos.filter((todo) => !todo.completed).length
  const completedTodosCount = todos.filter((todo) => todo.completed).length
  const todosWithDueDateCount = todos.filter((todo) => todo.dueDate !== null).length

  // Group todos by date for calendar view
  const todosByDate = todos.reduce(
    (acc, todo) => {
      if (todo.dueDate) {
        // Use UTC date string to avoid timezone issues
        const date = new Date(todo.dueDate)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Todo Pro</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddingTodo(true)} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          <ModeToggle />
        </div>
      </div>

      {isAddingTodo && <TodoForm onSubmit={addTodo} onCancel={() => setIsAddingTodo(false)} categories={categories} />}

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
                  onToggle={toggleTodo}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                  onToggleSubTask={toggleSubTask}
                  onAddSubTask={addSubTask}
                  onDeleteSubTask={deleteSubTask}
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
                  onToggle={toggleTodo}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                  onToggleSubTask={toggleSubTask}
                  onAddSubTask={addSubTask}
                  onDeleteSubTask={deleteSubTask}
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
                  onToggle={toggleTodo}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                  onToggleSubTask={toggleSubTask}
                  onAddSubTask={addSubTask}
                  onDeleteSubTask={deleteSubTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            todos={todos}
            todosByDate={todosByDate}
            onToggle={toggleTodo}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
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
