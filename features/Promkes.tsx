
import React, { useState, useRef, useEffect } from 'react';
import { PromkesForm, AspectRatio, STYLE_OPTIONS, IMAGE_SIZES, COLOR_PALETTES, ColorPaletteDef } from '../types';
import { generatePromkesMedia, generateVisualDescription } from '../services/geminiService';
import { Download, Sparkles, Image as ImageIcon, Wand2, Palette, ChevronDown } from 'lucide-react';

export const Promkes: React.FC = () => {
  const [form, setForm] = useState<PromkesForm>({
    title: '', 
    description: '', 
    aspectRatio: '1:1', 
    style: STYLE_OPTIONS[0],
    colorPalette: COLOR_PALETTES[0].description, // Default: Acak description
    size: '1K'
  });
  
  // State for Custom Dropdown
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [selectedPaletteObj, setSelectedPaletteObj] = useState<ColorPaletteDef>(COLOR_PALETTES[0]);

  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setIsPaletteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePaletteSelect = (palette: ColorPaletteDef) => {
    setSelectedPaletteObj(palette);
    setForm({ ...form, colorPalette: palette.description });
    setIsPaletteOpen(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setImageUrls([]);
    try {
      const urls = await generatePromkesMedia(
        form.title, 
        form.description, 
        form.aspectRatio, 
        form.style, 
        form.colorPalette,
        form.size
      );
      setImageUrls(urls);
    } catch (err) {
      alert("Gagal membuat gambar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDescription = async () => {
    if (!form.title.trim()) {
      alert("Mohon isi Judul/Headline terlebih dahulu.");
      return;
    }
    setGeneratingDesc(true);
    try {
      // Pass title, aspectRatio, style AND colorPalette
      const aiDesc = await generateVisualDescription(
        form.title, 
        form.aspectRatio, 
        form.style, 
        form.colorPalette
      );
      setForm(prev => ({ ...prev, description: aiDesc }));
    } catch (err) {
      alert("Gagal membuat deskripsi otomatis.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] flex gap-6">
      <div className="w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
        <div className="mb-2">
          <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100">Media Promkes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Studio Promosi Kesehatan berbasis AI.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* STEP 1: Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">1. Judul / Headline</label>
            <input 
              required
              className="w-full p-3 glass-panel rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 text-sm dark:text-white dark:bg-slate-900/50"
              placeholder="contoh: Waspada Diabetes"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          {/* STEP 2: Format & Resolution */}
          <div className="grid grid-cols-2 gap-3">
             <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">2. Format Media</label>
              <select 
                className="w-full p-2.5 glass-panel rounded-lg border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white dark:bg-slate-900/50"
                value={form.aspectRatio}
                onChange={e => setForm({...form, aspectRatio: e.target.value})}
              >
                {Object.entries(AspectRatio).map(([key, value]) => (
                  <option key={key} value={value} className="text-slate-900 dark:text-white dark:bg-slate-800">{value} ({key.replace(/_/g, ' ')})</option>
                ))}
              </select>
            </div>
             <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Resolusi</label>
              <select 
                className="w-full p-2.5 glass-panel rounded-lg border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white dark:bg-slate-900/50"
                value={form.size}
                onChange={e => setForm({...form, size: e.target.value})}
              >
                {IMAGE_SIZES.map((size) => (
                  <option key={size} value={size} className="text-slate-900 dark:text-white dark:bg-slate-800">{size}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* STEP 3: Visual Style */}
          <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">3. Gaya Visual</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    type="button"
                    key={style}
                    onClick={() => setForm({...form, style})}
                    className={`text-xs py-2 px-3 rounded-lg border transition-all ${
                      form.style === style 
                        ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
          </div>

          {/* STEP 4: Color Palette (Custom Visual Dropdown) */}
          <div ref={paletteRef} className="relative">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
              4. Nuansa Warna (Color Palette) <Palette size={12} />
            </label>
            
            <button
              type="button"
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className="w-full p-2.5 glass-panel rounded-lg border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Visual Swatches for Selected */}
                <div className="flex -space-x-1">
                   {selectedPaletteObj.colors.map((c, i) => (
                     <div key={i} className="w-4 h-4 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: c }}></div>
                   ))}
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-200">{selectedPaletteObj.label}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isPaletteOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isPaletteOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => handlePaletteSelect(palette)}
                    className={`w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${selectedPaletteObj.id === palette.id ? 'bg-blue-50 dark:bg-slate-800' : ''}`}
                  >
                     <span className="text-sm text-slate-700 dark:text-slate-300">{palette.label}</span>
                     <div className="flex gap-1">
                       {palette.colors.map((c, i) => (
                         <div key={i} className="w-5 h-5 rounded border border-slate-200 dark:border-slate-600" style={{ backgroundColor: c }}></div>
                       ))}
                     </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STEP 5: Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">5. Deskripsi Visual</label>
              <button
                type="button"
                onClick={handleAutoDescription}
                disabled={generatingDesc || !form.title}
                className="flex items-center gap-1.5 text-[10px] font-medium text-primary hover:text-blue-700 dark:hover:text-blue-400 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-all disabled:opacity-50"
                title="AI akan membuat deskripsi berdasarkan Judul, Format, Gaya, dan Warna yang dipilih"
              >
                {generatingDesc ? <Sparkles size={10} className="animate-spin" /> : <Wand2 size={10} />}
                {generatingDesc ? 'Membuat...' : 'Bantu Saya (AI)'}
              </button>
            </div>
            <textarea 
              required
              className="w-full p-3 glass-panel rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 text-sm h-32 resize-none dark:text-white dark:bg-slate-900/50 placeholder:text-slate-400"
              placeholder="Jelaskan gambaran visual atau klik 'Bantu Saya (AI)'..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Sparkles className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? 'Sedang Membuat...' : 'Buat Desain'}
          </button>
        </form>
      </div>

      <div className="flex-1 glass-panel rounded-2xl p-6 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-y-auto">
        {loading ? (
           <div className="text-center animate-pulse">
             <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
             <p className="text-slate-400 font-medium">Mendesain dengan Nano Banana Pro...</p>
           </div>
        ) : imageUrls.length > 0 ? (
          <div className={`w-full h-full flex gap-4 ${imageUrls.length > 1 ? 'flex-row' : 'items-center justify-center'}`}>
             {imageUrls.map((url, idx) => (
               <div key={idx} className="relative group flex-1 flex flex-col items-center">
                 {imageUrls.length > 1 && (
                   <span className="mb-3 px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm">
                     {idx === 0 ? "Sisi Depan / Luar (Outer)" : "Sisi Dalam (Inner)"}
                   </span>
                 )}
                 <div className="relative w-full h-full flex items-center justify-center">
                   <img 
                    src={url} 
                    alt={`Generated Promkes ${idx + 1}`} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                   />
                   <a 
                    href={url} 
                    download={`promkes-${form.title}-${idx + 1}.png`}
                    className="absolute bottom-6 bg-white text-slate-900 px-4 py-2 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                   >
                     <Download size={16} /> Download
                   </a>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="text-center text-slate-400 dark:text-slate-600">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
            <p>Preview akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  );
};
