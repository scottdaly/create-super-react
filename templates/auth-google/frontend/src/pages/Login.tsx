import { useEffect } from 'react'
import { useAuth } from '../contexts/auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign in to Your Account</h1>
        
        <button
          className="w-full border border-gray-300 px-4 py-3 rounded hover:bg-gray-50 transition-colors"
          onClick={() => { window.location.href = '/api/auth/google/start' }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}