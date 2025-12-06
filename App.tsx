
import React, { useState, useEffect } from 'react';
import { View } from './types';
import { Sidebar } from './components/Sidebar';
import { Swamedikasi } from './features/Swamedikasi';
import { DrugInfo } from './features/DrugInfo';
import { InteractionChecker } from './features/InteractionChecker';
import { Promkes } from './features/Promkes';
import { Settings } from './features/Settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.SWAMEDIKASI);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
      case View.PROMKES:
        return <Promkes />;
      case View.SETTINGS:
        return <Settings />;
      default:
        return <Swamedikasi />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-slate-600 dark:text-slate-300 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
