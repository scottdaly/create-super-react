import { useState } from 'react'
import { useAuth } from '../contexts/auth'
import { Link } from 'react-router-dom'
import Modal from '../components/Modal'
import { apiFetch } from '../http'

export default function AccountSettings() {
  const { user } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-4">
          <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2">/</span>
          <span>Account Settings</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <p className="text-gray-900">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Signed in with Google. To change your email, update it in your Google account.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Status
              </label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>

          {/* Delete confirmation modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete account?"
            size="sm"
          >
            <p className="text-gray-700 mb-6">
              This action cannot be undone. All of your data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                onClick={async () => {
                  try {
                    await apiFetch('/api/account', { method: 'DELETE' })
                  } catch {}
                  window.location.href = '/' // redirect to home (session is gone)
                }}
              >
                Yes, delete
              </button>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  )
}