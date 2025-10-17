'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TabNavigation({ 
  tabs = [], 
  activeTab, 
  onTabChange, 
  className = '' 
}) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [tabs]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTab = (index) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tabElement = container.children[index];
      if (tabElement) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();
        const scrollLeft = container.scrollLeft + (tabRect.left - containerRect.left) - (containerRect.width / 2) + (tabRect.width / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleTabClick = (tab, index) => {
    onTabChange(tab.id);
    scrollToTab(index);
  };

  if (tabs.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Scroll Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 z-10 h-12 w-8 bg-gradient-to-r from-gray-900 to-transparent flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 z-10 h-12 w-8 bg-gradient-to-l from-gray-900 to-transparent flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Tab Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
      >
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab, index)}
              className={`
                relative flex items-center justify-center px-4 py-3 min-h-[48px] whitespace-nowrap
                text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              {tab.icon && (
                <tab.icon className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
