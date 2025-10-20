'use client';

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CommunityHub() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 MINIMAL TEST: useEffect triggered');
    setLoading(false);
    setCommunities([]);
  }, []);

  return (
    <SidebarLayout currentPage="community" pageTitle="Communities">
      <div className="mobile-container">
        <h1 className="mobile-title text-white mb-2">Communities</h1>
        <p className="text-white">MINIMAL TEST - No API calls</p>
        <p className="text-white">Loading: {loading ? 'true' : 'false'}</p>
        <p className="text-white">Communities count: {communities.length}</p>
      </div>
    </SidebarLayout>
  );
}