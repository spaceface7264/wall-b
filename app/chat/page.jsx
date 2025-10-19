'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Loader2 } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import ConversationList from '../components/ConversationList';
import ConversationView from '../components/ConversationView';
import DatabaseSetup from '../components/DatabaseSetup';

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
        <div className="flex items-center justify-center h-[calc(100vh-7.5rem)]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading chat...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout currentPage="chat">
        <div className="flex items-center justify-center h-[calc(100vh-7.5rem)]">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">Please log in to access chat</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="chat">
      <div className="h-[calc(100vh-7.5rem)] flex flex-col">
        {/* Main Chat Container */}
        <div className="flex-1 flex bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
          {/* Conversation List */}
          <div className={`${showConversationList ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 bg-slate-800 border-r border-slate-700/50`}>
            <ConversationList
              onSelectConversation={handleSelectConversation}
              currentUserId={user.id}
            />
          </div>

          {/* Conversation View */}
          <div className={`${!showConversationList ? 'flex' : 'hidden'} md:flex w-full md:w-2/3 bg-slate-800/50`}>
            <ConversationView
              conversation={selectedConversation}
              currentUserId={user.id}
              onBack={handleBackToList}
            />
          </div>
        </div>
        
        {/* Database Setup - Only show if needed */}
        <div className="mt-4">
          <DatabaseSetup />
        </div>
      </div>
    </SidebarLayout>
  );
}
