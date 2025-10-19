'use client';

import { MessageCircle, Loader2 } from 'lucide-react';

export default function ChatLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-6">
        {/* Animated Message Icon */}
        <div className="relative">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-lg">
            <MessageCircle className="w-10 h-10 text-white animate-pulse" />
          </div>
          
          {/* Floating dots animation */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-bounce"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 -left-3 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Loading text with typing animation */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-1">
            <span className="text-slate-200 text-lg font-medium">Loading conversations</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm">Connecting to your chat network...</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 mx-auto">
          <div className="bg-slate-700 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
