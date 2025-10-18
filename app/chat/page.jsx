'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageCircle } from 'lucide-react';
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
        <div className="minimal-flex-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="minimal-text">Loading chat...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout currentPage="chat">
        <div className="minimal-flex-center h-64">
          <p className="minimal-text">Please log in to access chat</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="chat">
      <div className="h-[calc(100vh-8rem)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="h-full flex rounded-2xl overflow-hidden shadow-2xl border border-slate-700/40 backdrop-blur-sm">
          {/* Conversation List - Hidden on mobile when viewing conversation */}
          <div className={`${showConversationList ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 bg-slate-800/70 border-r border-slate-700/30`}>
            <ConversationList
              onSelectConversation={handleSelectConversation}
              currentUserId={user.id}
            />
          </div>

          {/* Conversation View - Full width on mobile, 2/3 on desktop */}
          <div className={`${!showConversationList ? 'flex' : 'hidden'} md:flex w-full md:w-2/3 bg-slate-800/50`}>
            <ConversationView
              conversation={selectedConversation}
              currentUserId={user.id}
              onBack={handleBackToList}
            />
          </div>
        </div>
        
        {/* Database Setup Guide */}
        <DatabaseSetup />
      </div>
    </SidebarLayout>
  );
}
