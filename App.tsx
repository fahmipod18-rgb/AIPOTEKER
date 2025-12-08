
import React, { useState, useEffect } from 'react';
import { View } from './types';
import { Sidebar } from './components/Sidebar';
import { Swamedikasi } from './features/Swamedikasi';
import { DrugInfo } from './features/DrugInfo';
import { InteractionChecker } from './features/InteractionChecker';
import { Promkes } from './features/Promkes';
import { Settings } from './features/Settings';
import { Farmaquiz } from './features/Farmaquiz';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.SWAMEDIKASI);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderView = () => {
    switch (currentView) {
      case View.SWAMEDIKASI:
        return <Swamedikasi />;
      case View.DRUG_INFO:
        return <DrugInfo />;
      case View.INTERACTION:
        return <InteractionChecker />;
      case View.FARMAQUIZ:
        return <Farmaquiz />;
      case View.PROMKES:
        return <Promkes />;
      case View.SETTINGS:
        return <Settings />;
      default:
        return <Swamedikasi />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-slate-600 dark:text-slate-300 transition-colors duration-300 bg-[#f8fafc] dark:bg-[#0f172a]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false); // Close sidebar on mobile when item selected
        }} 
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 w-full transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 sticky top-0 z-20 glass-panel border-b border-slate-200 dark:border-slate-700/50 mb-4 mx-4 mt-4 rounded-xl">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
            <span className="bg-primary text-white p-1 rounded">AP</span> AIPOTEKER
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* View Content */}
        <div className="p-4 md:p-8 overflow-y-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
