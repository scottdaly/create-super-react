import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/auth'
import Avatar from './Avatar'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Logo
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Avatar user={user} />
            </>
          ) : (
            <>
              <Link 
                to="/login"
                className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}