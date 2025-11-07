

import { useRef } from 'react';

export default function TabNavigation({ 
  tabs = [], 
  activeTab, 
  onTabChange, 
  className = '' 
}) {
  const scrollContainerRef = useRef(null);

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
      {/* Tab Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' },
          paddingLeft: '0',
          paddingRight: '0'
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
                ${index === 0 ? 'pl-4' : ''}
                ${index === tabs.length - 1 ? 'pr-4' : ''}
                ${activeTab === tab.id
                  ? 'text-[#2663EB] bg-[#2663EB]/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              {tab.icon && (
                <tab.icon className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-[#2663EB]/20 text-[#2663EB] rounded-full">
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
