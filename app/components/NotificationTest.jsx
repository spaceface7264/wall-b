

import { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationTest({ userId }) {
  const [testMessage, setTestMessage] = useState('');
  const { createNotification } = useNotifications(userId);

  const sendTestNotification = async () => {
    if (!testMessage.trim()) return;

    await createNotification(
      'system',
      'Test Notification',
      testMessage,
      { test: true }
    );
    
    setTestMessage('');
  };

  if (!userId) return null;

  return (
    <div className="mobile-card p-4">
      <h3 className="mobile-subheading mb-3 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        Test Notifications
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Test Message
          </label>
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message..."
            className="minimal-input w-full"
          />
        </div>
        
        <button
          onClick={sendTestNotification}
          disabled={!testMessage.trim()}
          className="mobile-btn-primary flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send Test Notification
        </button>
        
        <div className="text-xs text-gray-400">
          This will create a test notification that you can see in the notification bell.
        </div>
      </div>
    </div>
  );
}


