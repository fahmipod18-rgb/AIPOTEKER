
import React, { useState, useRef, useEffect } from 'react';
import { PromkesForm, AspectRatio, STYLE_OPTIONS, IMAGE_SIZES, COLOR_PALETTES, ColorPaletteDef } from '../types';
import { generatePromkesMedia, generateVisualDescription, generateHeadline } from '../services/geminiService';
import { Download, Sparkles, Image as ImageIcon, Wand2, Palette, ChevronDown, Check } from 'lucide-react';

export const Promkes: React.FC = () => {
  const [form, setForm] = useState<PromkesForm>({
    topic: '',
    title: '', 
    description: '', 
    aspectRatio: '1:1', 
    style: STYLE_OPTIONS[0],
    colorPalette: COLOR_PALETTES[0].description, // Default: Acak description
    size: '1K'
  });
  
  // State for Custom Dropdown (Color Palette)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [selectedPaletteObj, setSelectedPaletteObj] = useState<ColorPaletteDef>(COLOR_PALETTES[0]);

  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  
  // Changed to Array to support Leaflet (2 images) or Standard (1 image)
  const [imageUrls, setImageUrls] = useState<string[] | null>(null);

  // Close palette dropdown when clicking outside
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
  }, [paletteRef]);

  const handlePaletteSelect = (palette: ColorPaletteDef) => {
    setSelectedPaletteObj(palette);
    setForm({ ...form, colorPalette: palette.description });
    setIsPaletteOpen(false);
  };

  const handleGenerateHeadline = async () => {
    if (!form.topic) {
      alert("Mohon isi Topik terlebih dahulu.");
      return;
    }
    setGeneratingTitle(true);
    try {
      const headline = await generateHeadline(form.topic);
      if (headline) {
        setForm(prev => ({ ...prev, title: headline }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingTitle(false);
    }
  };

  const handleAutoDescription = async () => {
    if (!form.title || !form.topic) {
      alert("Mohon isi Topik dan Judul terlebih dahulu.");
      return;
    }
    setGeneratingDesc(true);
    try {
      const desc = await generateVisualDescription(
        form.topic,
        form.title, 
        form.aspectRatio, 
        form.style,
        form.colorPalette
      );
      setForm(prev => ({ ...prev, description: desc }));
    } catch (error) {
      alert("Gagal membuat deskripsi otomatis.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.title || !form.description) {
      alert("Mohon lengkapi judul dan deskripsi visual.");
      return;
    }
    setLoading(true);
    setImageUrls(null);
    try {
      const urls = await generatePromkesMedia(
        form.topic,
        form.title,
        form.description,
        form.aspectRatio,
        form.style,
        form.colorPalette,
        form.size
      );
      setImageUrls(urls);
    } catch (error) {
      alert("Gagal membuat gambar. Pastikan API Key valid (Google Cloud Billing aktif untuk model Pro).");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `aipoteker-promkes-${form.title.substring(0, 10).replace(/\s+/g, '-')}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-screen md:h-[calc(100vh-100px)]">
      {/* LEFT COLUMN: FORM INPUTS */}
      <div className="w-full md:w-96 shrink-0 flex flex-col gap-6 overflow-y-auto pb-20 md:pb-0 scrollbar-hide">
        <div>
          <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100">Media Promkes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Studio Promosi Kesehatan berbasis AI.</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-6">
          
          {/* STEP 1: TOPIC */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              1. Topik
            </label>
            <input 
              type="text" 
              className="w-full p-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white"
              placeholder="contoh: Kesehatan Mental Remaja"
              value={form.topic}
              onChange={e => setForm({...form, topic: e.target.value})}
            />
          </div>

          {/* STEP 2: HEADLINE */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                2. Judul / Headline
              </label>
              <button 
                onClick={handleGenerateHeadline}
                disabled={generatingTitle || !form.topic}
                className="text-[10px] flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
              >
                {generatingTitle ? <Sparkles size={10} className="animate-spin" /> : <Wand2 size={10} />}
                Bantu Saya (AI)
              </button>
            </div>
            <textarea 
              className="w-full p-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white h-20 resize-none"
              placeholder="contoh: Jangan Biarkan Stres Menguasaimu!"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          {/* STEP 3: FORMAT */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                3. Format Media
              </label>
              <div className="relative">
                <select 
                  className="w-full p-2.5 appearance-none bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white"
                  value={form.aspectRatio}
                  onChange={e => setForm({...form, aspectRatio: e.target.value})}
                >
                  <option value={AspectRatio.PERSEGI_1_1}>Persegi (IG Feed)</option>
                  <option value={AspectRatio.POSTER_4_5}>Poster (4:5)</option>
                  <option value={AspectRatio.BANNER_PORTRAIT_1_3}>Banner (1:3)</option>
                  <option value={AspectRatio.LEAFLET_1_2}>Leaflet (Lipat 3)</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                  <ImageIcon size={14} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Resolusi
              </label>
              <select 
                className="w-full p-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white"
                value={form.size}
                onChange={e => setForm({...form, size: e.target.value})}
              >
                {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* STEP 4: VISUAL STYLE */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              4. Gaya Visual
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  onClick={() => setForm({...form, style})}
                  className={`text-left px-3 py-2 rounded-lg text-[10px] font-medium border transition-all ${
                    form.style === style 
                      ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 5: COLOR PALETTE (CUSTOM DROPDOWN) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              5. Palet Warna
            </label>
            <div className="relative" ref={paletteRef}>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className="w-full p-2.5 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {selectedPaletteObj.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="truncate">{selectedPaletteObj.label}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isPaletteOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPaletteOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => handlePaletteSelect(palette)}
                      className="w-full p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1">
                          {palette.colors.map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{palette.label}</span>
                      </div>
                      {selectedPaletteObj.id === palette.id && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 6: DESCRIPTION */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                6. Deskripsi Visual
              </label>
              <button 
                onClick={handleAutoDescription}
                disabled={generatingDesc || !form.title || !form.topic}
                className="text-[10px] flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
              >
                {generatingDesc ? <Sparkles size={10} className="animate-spin" /> : <Wand2 size={10} />}
                Bantu Saya (AI)
              </button>
            </div>
            <textarea 
              className="w-full p-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm dark:text-white h-32 resize-none leading-relaxed"
              placeholder="Jelaskan detail elemen visual..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !form.title || !form.description}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Merender Desain...
              </>
            ) : (
              <>
                <Palette size={18} /> Buat Desain Sekarang
              </>
            )}
          </button>

        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden min-h-[400px] md:min-h-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        {loading ? (
          <div className="text-center z-10 p-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping"></div>
              <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                <Sparkles size={32} className="animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sedang Membuat Poster...</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              AI sedang menyusun layout, ilustrasi vektor, dan tipografi sesuai gaya "{form.style}".
            </p>
          </div>
        ) : imageUrls ? (
          <div className={`w-full h-full p-4 md:p-8 overflow-y-auto flex flex-wrap justify-center items-center gap-8 ${imageUrls.length > 1 ? 'content-start' : ''}`}>
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex flex-col gap-3 max-w-full">
                 <div className="relative group rounded-xl overflow-hidden shadow-2xl ring-4 ring-white/10 max-h-[70vh]">
                  <img 
                    src={url} 
                    alt={`Generated Promkes ${idx+1}`} 
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button 
                      onClick={() => downloadImage(url, idx)}
                      className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Download size={18} /> Download PNG
                    </button>
                  </div>
                </div>
                {imageUrls.length > 1 && (
                  <p className="text-center text-slate-400 text-xs font-mono uppercase tracking-widest">
                    {idx === 0 ? "Sisi Luar / Cover" : "Sisi Dalam / Isi"}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center z-10 opacity-40">
            <ImageIcon size={64} className="mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400 font-medium">Preview desain akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  );
};
