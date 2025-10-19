'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Loader2 } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import ConversationList from '../components/ConversationList';
import ConversationView from '../components/ConversationView';
import ChatLoading from '../components/ChatLoading';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationList, setShowConversationList] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowConversationList(false);
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="chat">
        <ChatLoading />
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout currentPage="chat">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center space-y-4 max-w-sm px-4">
            <div className="bg-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
              <MessageCircle className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-200">Connect with the Community</h3>
              <p className="text-slate-400 text-sm">Sign in to start conversations and engage with members worldwide</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="chat">
      {/* Main Chat Container - respects parent padding */}
      <div className="flex flex-col h-full overflow-hidden rounded-lg border border-slate-700/50">
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation List Panel */}
          <div 
            className={`
              ${showConversationList ? 'flex' : 'hidden'}
              md:flex md:flex-col
              w-full md:w-80 lg:w-96
              border-r border-slate-700/50
              bg-slate-900/30
              overflow-hidden
            `}
          >
            <ConversationList
              onSelectConversation={handleSelectConversation}
              currentUserId={user.id}
            />
          </div>

          {/* Conversation View Panel */}
          <div 
            className={`
              ${!showConversationList ? 'flex' : 'hidden'}
              md:flex md:flex-col
              flex-1
              bg-slate-900/20
              overflow-hidden
            `}
          >
            {selectedConversation ? (
              <ConversationView
                conversation={selectedConversation}
                currentUserId={user.id}
                onBack={handleBackToList}
              />
            ) : (
              <div className="hidden md:flex items-center justify-center h-full">
                <div className="text-center space-y-4 max-w-md px-6">
                  <div className="bg-slate-800/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-12 h-12 text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-300">No Conversation Selected</h3>
                    <p className="text-slate-500 text-sm">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </SidebarLayout>
  );
}