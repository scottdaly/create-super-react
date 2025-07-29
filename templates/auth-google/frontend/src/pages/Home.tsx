export default function Home() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Our App</h1>
        <p className="text-lg text-gray-600 mb-8">
          A modern full-stack application built with React, TypeScript, and Tailwind CSS.
        </p>
        <div className="max-w-2xl mx-auto text-gray-600">
          <p className="mb-4">
            This is a production-ready starter with Google authentication, secure sessions, and a beautiful UI.
            Get started by signing in with your Google account.
          </p>
        </div>
      </div>
    </div>
  )
}