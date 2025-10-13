'use client'

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Wall-B App</h1>
        <p className="text-gray-400 mb-6">Simple test page - no authentication</p>
        <div className="space-y-2">
          <a href="/" className="block text-blue-400 hover:underline">
            → Go to main app (should show login)
          </a>
          <a href="/test" className="block text-blue-400 hover:underline">
            → Test Supabase connection
          </a>
        </div>
      </div>
    </div>
  );
}
