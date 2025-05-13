import type { Metadata } from "next"
import TodoApp from "@/components/todo-app"

export const metadata: Metadata = {
  title: "Todo Pro",
  description: "A professional todo application built with Next.js and Tailwind CSS",
}

export default function Home() {
  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <TodoApp />
    </main>
  )
}
