import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Todo = Database['public']['Tables']['todos']['Row'] & {
  subtasks: Database['public']['Tables']['subtasks']['Row'][]
}
type Category = Database['public']['Tables']['categories']['Row']

export function useSupabase() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch todos and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch todos with their subtasks
        const { data: todosData, error: todosError } = await supabase
          .from('todos')
          .select(`
            *,
            subtasks (*)
          `)
          .order('created_at', { ascending: false })

        if (todosError) throw todosError

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (categoriesError) throw categoriesError

        setTodos(todosData as Todo[])
        setCategories(categoriesData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Todo operations
  const addTodo = async (todoData: {
    text: string
    description: string | null
    completed: boolean
    priority: 'low' | 'medium' | 'high'
    due_date: string | null
    category_id: string | null
  }) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert(todoData)
        .select(`
          *,
          subtasks (*)
        `)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from insert')
      }

      // Add the new todo with empty subtasks array
      setTodos(prev => [{ ...data, subtasks: [] }, ...prev])
      return data
    } catch (error) {
      console.error('Error adding todo:', error)
      throw error
    }
  }

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, ...updates } : todo
      ))
    } catch (error) {
      console.error('Error updating todo:', error)
      throw error
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTodos(prev => prev.filter(todo => todo.id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error)
      throw error
    }
  }

  // Category operations
  const addCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single()

      if (error) throw error

      setCategories(prev => [...prev, data])
    } catch (error) {
      console.error('Error adding category:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCategories(prev => prev.filter(category => category.id !== id))
      // Update todos that had this category
      setTodos(prev => prev.map(todo => 
        todo.category_id === id ? { ...todo, category_id: null } : todo
      ))
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  // Subtask operations
  const addSubtask = async (todoId: string, text: string) => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          todo_id: todoId,
          text,
          completed: false,
        })
        .select()
        .single()

      if (error) throw error

      setTodos(prev => prev.map(todo => 
        todo.id === todoId 
          ? { ...todo, subtasks: [...todo.subtasks, data] }
          : todo
      ))
    } catch (error) {
      console.error('Error adding subtask:', error)
      throw error
    }
  }

  const toggleSubtask = async (todoId: string, subtaskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed })
        .eq('id', subtaskId)
        .eq('todo_id', todoId)

      if (error) throw error

      setTodos(prev => prev.map(todo => 
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.map(subtask =>
                subtask.id === subtaskId ? { ...subtask, completed } : subtask
              ),
            }
          : todo
      ))
    } catch (error) {
      console.error('Error toggling subtask:', error)
      throw error
    }
  }

  const deleteSubtask = async (todoId: string, subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId)
        .eq('todo_id', todoId)

      if (error) throw error

      setTodos(prev => prev.map(todo => 
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.filter(subtask => subtask.id !== subtaskId),
            }
          : todo
      ))
    } catch (error) {
      console.error('Error deleting subtask:', error)
      throw error
    }
  }

  return {
    loading,
    todos,
    categories,
    addTodo,
    updateTodo,
    deleteTodo,
    addCategory,
    deleteCategory,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  }
} 