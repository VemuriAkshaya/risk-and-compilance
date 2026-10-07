import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ShellBar } from './ShellBar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleToggleSidebar = () => {
    // If screen is mobile/tablet, toggle drawer
    if (window.innerWidth <= 900) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const handleRefreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <ShellBar
        onToggleSidebar={handleToggleSidebar}
        onRefreshData={handleRefreshData}
      />
      <div className="app-body">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
        <main className="app-main-content">
          <Outlet key={refreshKey} />
        </main>
      </div>
    </div>
  );
};
