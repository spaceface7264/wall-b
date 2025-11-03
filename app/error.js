'use client'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Something went wrong!</h2>
        <p className="text-gray-400 mb-4">{error?.message || 'An unexpected error occurred'}</p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
