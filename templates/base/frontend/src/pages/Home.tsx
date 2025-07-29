import { useState, useEffect } from 'react'

export default function Home() {
  const [todos, setTodos] = useState<Array<{ id: number; title: string; done: number }>>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/todos')
      if (res.ok) {
        const data = await res.json()
        setTodos(data)
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      const res = await fetch('http://localhost:3000/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo })
      })
      
      if (res.ok) {
        setNewTodo('')
        await fetchTodos()
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to <span className="text-blue-600">{{PROJECT_NAME}}</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A modern full-stack application built with React, TypeScript, Tailwind CSS, Bun, and Hono.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Lightning Fast</h3>
                  <p className="mt-1 text-sm text-gray-500">Powered by Vite and Bun for optimal performance</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Type Safe</h3>
                  <p className="mt-1 text-sm text-gray-500">Full TypeScript support throughout the stack</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Beautiful UI</h3>
                  <p className="mt-1 text-sm text-gray-500">Styled with Tailwind CSS v4 for a modern look</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Todo App */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Demo: Todo List</h2>
          <p className="text-sm text-gray-500 mb-6">
            This demo connects to the backend API at http://localhost:3000. Make sure the backend is running!
          </p>
          
          <form onSubmit={addTodo} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new todo..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
          </form>

          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : todos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No todos yet. Add one above!</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {todos.map((todo) => (
                <li key={todo.id} className="py-3">
                  <div className="flex items-center">
                    <span className={`flex-1 ${todo.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.title}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Getting Started */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Start editing <code className="bg-gray-200 px-1 py-0.5 rounded">src/pages/Home.tsx</code> to customize this page</p>
            <p>2. Add new pages in the <code className="bg-gray-200 px-1 py-0.5 rounded">src/pages</code> directory</p>
            <p>3. Update routes in <code className="bg-gray-200 px-1 py-0.5 rounded">src/App.tsx</code></p>
            <p>4. Modify the backend API in <code className="bg-gray-200 px-1 py-0.5 rounded">backend/src/index.ts</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}