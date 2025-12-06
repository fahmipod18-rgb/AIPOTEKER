import React, { useState } from 'react';
import { getDrugInfo } from '../services/geminiService';
import { ResponseCard } from '../components/ResponseCard';
import { Search } from 'lucide-react';

export const DrugInfo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; groundingChunks?: any[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await getDrugInfo(query);
      setResult(data);
    } catch (err) {
      alert("Gagal mengambil informasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="mb-6">
        <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100">Pusat Informasi Obat</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monografi lengkap dikutip dari jurnal medis terpercaya.</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <input 
          type="text" 
          className="w-full pl-12 pr-4 py-4 glass-panel rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all dark:bg-slate-900/50"
          placeholder="Masukkan nama generik atau merek (contoh: Amoxicillin, Panadol)..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Search className="absolute left-4 top-4 text-slate-400" />
        <button 
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-6 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
        >
          Cari
        </button>
      </form>

      <ResponseCard 
        title={`Monografi: ${query}`}
        content={result?.text || ''} 
        groundingChunks={result?.groundingChunks}
        isLoading={loading} 
      />
    </div>
  );
};