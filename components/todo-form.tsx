"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { Priority, Category, Todo } from "@/components/todo-app"

interface TodoFormProps {
  onSubmit: (todoData: Partial<Todo>) => void
  onCancel: () => void
  initialValue?: Partial<Todo>
  categories: Category[]
}

export default function TodoForm({ onSubmit, onCancel, initialValue = {}, categories }: TodoFormProps) {
  const [text, setText] = useState(initialValue.text || "")
  const [description, setDescription] = useState(initialValue.description || "")
  const [dueDate, setDueDate] = useState<Date | null>(initialValue.dueDate || null)
  const [priority, setPriority] = useState<Priority>(initialValue.priority || "medium")
  const [categoryId, setCategoryId] = useState<string | null>(initialValue.categoryId || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit({
        text: text.trim(),
        description,
        dueDate,
        priority,
        categoryId,
      })
      setText("")
      setDescription("")
      setDueDate(null)
      setPriority("medium")
      setCategoryId(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="What needs to be done?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />

          <Textarea
            placeholder="Add description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
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
              <Select value={categoryId || ""} onValueChange={(value) => setCategoryId(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
                    {dueDate ? format(dueDate, "PPP") : "No date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate || undefined} onSelect={setDueDate} initialFocus />
                  {dueDate && (
                    <div className="p-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={() => setDueDate(null)} className="w-full">
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" disabled={!text.trim()}>
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
