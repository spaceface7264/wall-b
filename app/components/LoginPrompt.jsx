import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function LoginPrompt({ message = "Sign in to continue", action = "Sign In" }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      <LogIn className="w-12 h-12 text-gray-400 mb-3" />
      <p className="text-gray-300 text-center mb-4">{message}</p>
      <button
        onClick={() => navigate('/')}
        className="mobile-btn-primary"
      >
        {action}
      </button>
    </div>
  );
}

