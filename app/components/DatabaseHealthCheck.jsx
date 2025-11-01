

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function DatabaseHealthCheck() {
  const [healthStatus, setHealthStatus] = useState({
    conversations: 'checking',
    conversation_participants: 'checking',
    direct_messages: 'checking',
    profiles: 'checking'
  });

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  const checkDatabaseHealth = async () => {
    const tables = ['conversations', 'conversation_participants', 'direct_messages', 'profiles'];
    const status = {};

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          status[table] = 'error';
          console.error(`Table ${table} error:`, error);
        } else {
          status[table] = 'ok';
        }
      } catch (err) {
        status[table] = 'error';
        console.error(`Table ${table} exception:`, err);
      }
    }

    setHealthStatus(status);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400 animate-pulse" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'error':
        return 'Error';
      default:
        return 'Checking...';
    }
  };

  const allTablesOk = Object.values(healthStatus).every(status => status === 'ok');
  const hasErrors = Object.values(healthStatus).some(status => status === 'error');

  if (allTablesOk) {
    return null; // Don't show if everything is OK
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-medium text-white">Database Status</h3>
        </div>
        
        <div className="space-y-2">
          {Object.entries(healthStatus).map(([table, status]) => (
            <div key={table} className="flex items-center justify-between text-sm">
              <span className="text-gray-300 capitalize">
                {table.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className={`text-xs ${
                  status === 'ok' ? 'text-green-400' : 
                  status === 'error' ? 'text-red-400' : 
                  'text-yellow-400'
                }`}>
                  {getStatusText(status)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {hasErrors && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-xs text-gray-400 mb-2">
              Some database tables are missing or have errors. 
              Please run the SQL schema in your Supabase database.
            </p>
            <button
              onClick={checkDatabaseHealth}
              className="text-xs text-[#087E8B] hover:text-[#087E8B] transition-colors"
            >
              Retry Check
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


