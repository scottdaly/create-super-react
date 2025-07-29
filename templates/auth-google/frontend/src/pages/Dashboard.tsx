import { useAuth } from '../contexts/auth'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-medium">{user?.email}</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Info</h3>
            <p className="text-sm text-gray-600 mb-2">Email: {user?.email}</p>
            <p className="text-sm text-gray-600">Status: Active</p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                to="/settings"
                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
              >
                Account Settings
              </Link>
              <button className="block w-full text-left text-sm text-blue-600 hover:text-blue-800">
                View Reports
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
            <p className="text-sm text-gray-600">No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  )
}