'use client'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Wall-B App</h1>
        <p className="text-gray-400 mb-6">Simple test page - no authentication</p>
        <div className="space-y-2">
          <a href="/simple" className="block text-blue-400 hover:underline">
            → Go to simple page
          </a>
          <a href="/test" className="block text-blue-400 hover:underline">
            → Test Supabase connection
          </a>
        </div>
      </div>
    </div>
  );
}
