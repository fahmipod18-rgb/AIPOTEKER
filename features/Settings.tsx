
import React, { useState, useEffect } from 'react';
import { Key, Save, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    alert('API Key berhasil dihapus dari penyimpanan lokal.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100">Pengaturan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Konfigurasi kunci API untuk akses layanan.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6 text-slate-800 dark:text-white">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Key className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Google Gemini API Key</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Diperlukan untuk akses fitur Pro (Gambar & Analisis)</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
              API Key Anda
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="tempel AIzaSy..."
                className="w-full pl-4 pr-12 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono dark:text-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Key disimpan secara lokal di browser Anda (LocalStorage) dan tidak dikirim ke server kami.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} /> Hapus Key
            </button>
            
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-lg text-white font-medium shadow-md transition-all flex items-center gap-2 ${
                saved ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              <Save size={18} />
              {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Belum punya API Key?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            Untuk menggunakan fitur canggih seperti Nano Banana Pro (Gambar) dan analisis mendalam, Anda memerlukan API Key dari project Google Cloud yang memiliki billing aktif (Pay-as-you-go).
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-primary/5 dark:bg-primary/10 px-3 py-2 rounded-lg border border-primary/10"
          >
            Dapatkan API Key di Google AI Studio <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
