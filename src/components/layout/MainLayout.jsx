import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { OfflineIndicator } from "@/components/ui/offline-indicator";

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
        {/* Header com indicador offline */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Abrir menu de navegação"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          <OfflineIndicator />
        </header>

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
