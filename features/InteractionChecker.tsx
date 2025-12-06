import React, { useState, useEffect } from 'react';
import { checkInteractions } from '../services/geminiService';
import { ResponseCard } from '../components/ResponseCard';
import { AlertTriangle, Clipboard } from 'lucide-react';

export const InteractionChecker: React.FC = () => {
  const [drugs, setDrugs] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; groundingChunks?: any[] } | null>(null);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            setImage(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleCheck = async () => {
    if (!drugs && !image) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await checkInteractions(drugs, image);
      setResult(data);
    } catch (err) {
      alert("Gagal memeriksa interaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="mb-6">
        <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100">Cek Interaksi Obat</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Deteksi interaksi obat-obat, obat-makanan, dan obat-penyakit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Input Manual</label>
          <textarea 
            className="flex-1 w-full p-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Daftar obat di sini (satu per baris)...&#10;Simvastatin&#10;Amlodipine"
            value={drugs}
            onChange={e => setDrugs(e.target.value)}
          />
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full justify-center items-center border-dashed border-2 border-slate-200 dark:border-slate-700 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
          <input 
            type="file" 
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={e => setImage(e.target.files?.[0] || null)}
          />
           <div className="text-center p-4">
             {image ? (
               <div className="text-primary font-medium flex flex-col items-center">
                 <Clipboard className="mb-2" />
                 {image.name}
                 <span className="text-xs text-slate-400 font-normal mt-1">Klik untuk ubah</span>
               </div>
             ) : (
               <>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full inline-block mb-3">
                  <Clipboard className="text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload atau Paste Screenshot</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">CMD+V untuk paste gambar resep</p>
               </>
             )}
           </div>
        </div>
      </div>

      <button 
        onClick={handleCheck}
        disabled={loading || (!drugs && !image)}
        className="w-full py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-medium shadow-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
      >
        {loading ? 'Menganalisis Interaksi...' : 'Cek Interaksi'}
      </button>

      {result && (
        <div className="mt-8">
           <ResponseCard 
            title="Laporan Interaksi" 
            content={result.text} 
            groundingChunks={result.groundingChunks}
            isLoading={loading} 
          />
        </div>
      )}
    </div>
  );
};