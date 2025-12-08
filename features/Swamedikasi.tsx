
import React, { useState } from 'react';
import { SwamedikasiForm } from '../types';
import { analyzeSwamedikasi } from '../services/geminiService';
import { ResponseCard } from '../components/ResponseCard';
import { Upload, AlertCircle, FileText, PackageCheck } from 'lucide-react';

const PATIENT_CONDITIONS = [
  "Tidak ada kondisi khusus",
  "Hamil",
  "Anak-anak",
  "Lansia",
  "Lainnya"
];

export const Swamedikasi: React.FC = () => {
  const [formData, setFormData] = useState<SwamedikasiForm>({
    age: '', 
    weight: '', 
    complaint: '', 
    currentMeds: '', 
    treatment: '', 
    patientCondition: PATIENT_CONDITIONS[0],
    image: null,
    sourceFile: null // New field
  });
  
  // Separate state for the dropdown selection and the custom text input
  const [selectedCondition, setSelectedCondition] = useState(PATIENT_CONDITIONS[0]);
  const [customCondition, setCustomCondition] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; groundingChunks?: any[] } | null>(null);

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCondition(value);
    
    if (value !== 'Lainnya') {
      setFormData(prev => ({ ...prev, patientCondition: value }));
      setCustomCondition('');
    } else {
      setFormData(prev => ({ ...prev, patientCondition: '' }));
    }
  };

  const handleCustomConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCondition(value);
    setFormData(prev => ({ ...prev, patientCondition: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      // Ensure patient condition is set correctly before sending
      const finalData = {
        ...formData,
        patientCondition: selectedCondition === 'Lainnya' ? customCondition : selectedCondition
      };
      
      const data = await analyzeSwamedikasi(finalData, formData.image, formData.sourceFile);
      setResult(data);
    } catch (err) {
      alert("Gagal melakukan analisis. Mohon periksa input dan coba lagi. Pastikan file source adalah PDF, CSV, atau TXT.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100">Assesment Swamedikasi</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Analisis WWHAM berbasis AI untuk pengobatan mandiri.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Usia Pasien</label>
            <input 
              required
              type="text" 
              className="w-full p-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="contoh: 25 tahun"
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Berat Badan (kg)</label>
            <input 
              required
              type="text" 
              className="w-full p-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="contoh: 60 kg"
              value={formData.weight}
              onChange={e => setFormData({...formData, weight: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Kondisi Pasien</label>
          <div className="grid grid-cols-2 gap-4">
            <select 
              className="w-full p-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white transition-all"
              value={selectedCondition}
              onChange={handleConditionChange}
            >
              {PATIENT_CONDITIONS.map((cond) => (
                <option key={cond} value={cond} className="text-slate-900 dark:text-white dark:bg-slate-800">{cond}</option>
              ))}
            </select>
            
            {selectedCondition === 'Lainnya' && (
              <input 
                required
                type="text" 
                className="w-full p-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white transition-all animate-in fade-in slide-in-from-left-2 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Tuliskan kondisi spesifik..."
                value={customCondition}
                onChange={handleCustomConditionChange}
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Keluhan Utama</label>
          <textarea 
            required
            className="w-full p-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white h-24 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Jelaskan gejala, durasi, dan sifat sakit..."
            value={formData.complaint}
            onChange={e => setFormData({...formData, complaint: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Obat yang Sudah Digunakan</label>
            <textarea 
              className="w-full p-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white h-20 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="Sebutkan obat yang sudah diminum (jika ada)..."
              value={formData.currentMeds}
              onChange={e => setFormData({...formData, currentMeds: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Tindakan yang Sudah Dilakukan</label>
            <textarea 
              className="w-full p-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white h-20 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="Contoh: Kompres, istirahat, minum air hangat..."
              value={formData.treatment}
              onChange={e => setFormData({...formData, treatment: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IMAGE PROOF */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Bukti Visual (Opsional)</label>
            <div className="relative group h-24">
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={e => setFormData({...formData, image: e.target.files?.[0] || null})}
              />
              <div className={`w-full h-full flex items-center justify-center p-2 border-2 border-dashed rounded-xl transition-all ${formData.image ? 'border-primary bg-primary/5 dark:bg-primary/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <div className="text-center">
                  <Upload className={`mx-auto h-5 w-5 mb-1 ${formData.image ? 'text-primary' : 'text-slate-400'}`} />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate px-2">{formData.image ? formData.image.name : "Foto Kondisi"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SOURCE FILE (STOCK) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
               Source Obat (Stok Pribadi) <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Opsional</span>
            </label>
            <div className="relative group h-24">
              <input 
                type="file" 
                // Updated accept attribute to restrict unsupported formats
                accept=".pdf, .csv, .txt, image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={e => setFormData({...formData, sourceFile: e.target.files?.[0] || null})}
              />
              <div className={`w-full h-full flex items-center justify-center p-2 border-2 border-dashed rounded-xl transition-all ${formData.sourceFile ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <div className="text-center">
                  {formData.sourceFile ? (
                     <PackageCheck className="mx-auto h-5 w-5 mb-1 text-green-600 dark:text-green-400" />
                  ) : (
                     <FileText className="mx-auto h-5 w-5 mb-1 text-slate-400" />
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate px-2">
                    {formData.sourceFile ? formData.sourceFile.name : "Upload PDF/CSV/TXT/IMG"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Menganalisis Klinis & Stok...' : 'Buat Rekomendasi Klinis'}
        </button>
      </form>

      <div className="flex items-start gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl text-yellow-800 dark:text-yellow-200 text-xs">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p>Disclaimer AI: Alat ini membantu profesional tetapi tidak menggantikan penilaian klinis. Verifikasi semua rekomendasi DOWA/OTC dengan regulasi Kemenkes terbaru.</p>
      </div>

      <ResponseCard 
        title="Hasil Asesmen" 
        content={result?.text || ''} 
        groundingChunks={result?.groundingChunks}
        isLoading={loading} 
      />
    </div>
  );
};
