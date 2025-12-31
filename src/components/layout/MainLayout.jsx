import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Fechar menu de navegação"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSidebarOpen(false);
            }
          }}
        />
      )}
      
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        <main 
          id="main-content"
          className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto"
          role="main"
          aria-label="Conteúdo principal"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
