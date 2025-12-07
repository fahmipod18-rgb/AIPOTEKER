
import React from 'react';
import { View } from '../types';
import { Pill, Activity, Files, Image as ImageIcon, Cross, Moon, Sun, Settings, GraduationCap } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, theme, toggleTheme }) => {
  const menuItems = [
    { id: View.SWAMEDIKASI, label: 'Swamedikasi', icon: <Activity size={20} />, description: 'Layanan Swamedikasi' },
    { id: View.DRUG_INFO, label: 'Informasi Obat', icon: <Pill size={20} />, description: 'Pusat Informasi Obat' },
    { id: View.INTERACTION, label: 'Cek Interaksi', icon: <Files size={20} />, description: 'Analisis Interaksi' },
    { id: View.FARMAQUIZ, label: 'Farmaquiz', icon: <GraduationCap size={20} />, description: 'Asah Pengetahuan' },
    { id: View.PROMKES, label: 'Media Promkes', icon: <ImageIcon size={20} />, description: 'Buat Poster/Konten' },
    { id: View.SETTINGS, label: 'Pengaturan', icon: <Settings size={20} />, description: 'API Key & Konfigurasi' },
  ];

  return (
    <div className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-white/40 dark:border-slate-700/50 flex flex-col z-20">
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <div className="bg-primary text-white p-1 rounded-lg shadow-md shadow-primary/20">
            <Cross size={20} />
          </div>
          <span className="dark:text-white transition-colors">AIPOTEKER</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-light tracking-wide">
          Dashboard Farmasi AI
        </p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
              currentView === item.id
                ? 'bg-primary/10 dark:bg-primary/20 text-primary shadow-sm ring-1 ring-primary/20 dark:ring-primary/10'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {item.icon}
            <div className="text-left">
              <div className="leading-none">{item.label}</div>
              <div className="text-[10px] opacity-70 font-light mt-1">{item.description}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            {theme === 'light' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-400" />}
            Mode {theme === 'light' ? 'Terang' : 'Gelap'}
          </span>
        </button>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
           <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono">
             v1.1.0 • Gemini 2.5/3.0
           </p>
        </div>
      </div>
    </div>
  );
};
