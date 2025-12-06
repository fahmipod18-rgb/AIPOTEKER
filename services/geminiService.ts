
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get API Key (LocalStorage priority, fallback to env)
const getApiKey = () => {
  const storedKey = localStorage.getItem('gemini_api_key');
  const envKey = process.env.API_KEY;
  
  // Prioritize stored key if valid length, else env key
  const key = (storedKey && storedKey.length > 10) ? storedKey : envKey;
  
  if (!key) {
    throw new Error("API Key tidak ditemukan. Silakan atur di menu Pengaturan.");
  }
  return key;
};

// 1. Swamedikasi (Self-medication)
export const analyzeSwamedikasi = async (
  data: {
    age: string;
    weight: string;
    complaint: string;
    currentMeds: string;
    treatment: string;
    patientCondition: string;
  },
  image: File | null
) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelName = 'gemini-2.5-flash'; 

  let prompt = `
    Bertindaklah sebagai Apoteker profesional. Analisis pasien ini untuk Swamedikasi (Self-Medication).
    
    Data Pasien:
    - Usia: ${data.age}
    - Berat Badan: ${data.weight}
    - Kondisi Khusus: ${data.patientCondition}
    - Keluhan Utama: ${data.complaint}
    - Obat yang sudah digunakan: ${data.currentMeds}
    - Tindakan yang sudah dilakukan: ${data.treatment}
    
    ${image ? "Gambar kondisi disertakan untuk analisis visual." : ""}

    Instruksi Output:
    1.  Gunakan Bahasa Indonesia.
    2.  **WAJIB FORMAT TABEL**: Sajikan data utama dalam bentuk Tabel Markdown.
    3.  Gunakan Google Search untuk memvalidasi indikasi, dosis, dan interaksi.
    4.  **ATURAN SITASI MUTLAK**: 
        - Setiap sel tabel yang berisi fakta medis (indikasi, dosis, interaksi, saran) **WAJIB** diakhiri dengan nomor sitasi [n]. 
        - DILARANG menulis kalimat medis tanpa sitasi.
        - Contoh Benar: "Paracetamol 500mg [1]"
        - Contoh Salah: "Paracetamol 500mg"
    
    Struktur Respon:

    ## Evaluasi Pengobatan & Tindakan Sebelumnya
    | Nama Obat/Tindakan | Keputusan (Lanjut/Stop) | Alasan Klinis [Sitasi] |
    | :--- | :--- | :--- |
    | ... | ... | ... [n] |

    ## Rekomendasi Obat Baru
    | Nama Obat | Golongan | Alasan & Indikasi [Sitasi] |
    | :--- | :--- | :--- |
    | ... | ... | ... [n] |
    
    ## Aturan Pakai
    | Nama Obat | Dosis (sesuai usia/BB) | Frekuensi | Durasi Maks |
    | :--- | :--- | :--- | :--- |
    | ... | ... [n] | ... | ... |

    ## Non-Drug Treatment (Saran Perawatan)
    - [Saran 1] [n]
    - [Saran 2] [n]
    
    ## Upselling & Cross-selling
    | Produk | Manfaat |
    | :--- | :--- |
    | ... | ... [n] |
    
    ## Red Flags (Segera ke Dokter Jika)
    - [Gejala 1] [n]
    - [Gejala 2] [n]
  `;

  const parts: any[] = [{ text: prompt }];
  if (image) {
    const imagePart = await fileToPart(image);
    parts.unshift(imagePart);
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }],
        systemInstruction: "Anda adalah Apoteker Profesional. Anda DILARANG membuat daftar referensi manual di akhir teks. Cukup gunakan sitasi inline [n] di setiap kalimat/fakta medis. UI akan menangani daftar link secara otomatis.",
      }
    });
    
    return {
      text: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Swamedikasi Error:", error);
    throw error;
  }
};

// 2. Drug Information
export const getDrugInfo = async (drugName: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Buat monografi obat lengkap untuk: "${drugName}".
      
      Struktur: Gunakan **TABEL MARKDOWN** untuk menyajikan informasi.
      Bahasa: Indonesia.
      Validasi: Gunakan Google Search.
      
      **ATURAN DOSIS (PENTING)**:
      - Prioritaskan penulisan dosis dalam format mg/KgBB (terutama untuk anak). 
      - Jika tidak ada data berat badan, tuliskan dosis lazim (fixed dose). 
      - Wajib sertakan Dosis Maksimum.

      **ATURAN SITASI MUTLAK**:
      - Setiap fakta dalam sel tabel HARUS memiliki sitasi [n].
      - Jangan biarkan sel tabel kosong tanpa sumber jika itu adalah data medis.

      ## Ringkasan Obat
      | Kategori | Keterangan |
      | :--- | :--- |
      | **Golongan** | ... [n] |
      | **Kategori Kehamilan** | ... [n] |
      | **Bentuk Sediaan** | ... [n] |

      ## Indikasi Medis
      | Kondisi / Diagnosa | Penjelasan Singkat Indikasi [Sitasi] |
      | :--- | :--- |
      | ... | ... [n] |

      ## Detail Dosis & Aturan Pakai
      | Target Pasien (Anak/Dewasa/Lansia) | Dosis Basis Berat Badan (mg/KgBB) | Dosis Lazim / Fixed Dose | Dosis Maksimum (Harian/Sekali) | Frekuensi & Durasi |
      | :--- | :--- | :--- | :--- | :--- |
      | Anak | (Contoh: 10-15 mg/KgBB) [n] | ... | (Contoh: Max 60 mg/KgBB/hari) [n] | ... |
      | Dewasa | - | (Contoh: 500 mg) [n] | (Contoh: Max 4g/hari) [n] | ... |

      ## Keamanan
      | Aspek | Keterangan Lengkap [Sitasi] |
      | :--- | :--- |
      | **Kontraindikasi** | ... [n] |
      | **Peringatan** | ... [n] |
      | **Efek Samping** | ... [n] |
      
      ## Interaksi Obat Utama
      | Obat Lain | Efek Interaksi | Level | Mekanisme & Dampak [Sitasi] |
      | :--- | :--- | :--- | :--- |
      | ... | ... | ... | (Jelaskan farmakokinetik/dinamik secara detail) ... [n] |`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }],
        systemInstruction: "Anda adalah database farmasi. Sajikan data dalam tabel. Pisahkan Indikasi dan Dosis. Prioritaskan dosis mg/KgBB. DILARANG membuat daftar referensi manual. Gunakan hanya sitasi inline [n].",
      }
    });

    return {
      text: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Drug Info Error:", error);
    throw error;
  }
};

// 3. Interaction Checker
export const checkInteractions = async (drugsInput: string, image: File | null) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelName = 'gemini-2.5-flash';

  let prompt = `
    Analisis interaksi obat untuk:
    ${drugsInput}
    ${image ? "(Juga ekstrak dan periksa obat dari gambar)" : ""}

    Instruksi:
    - Bahasa Indonesia.
    - **WAJIB FORMAT TABEL MARKDOWN**.
    - Gunakan Google Search untuk validasi.
    
    **ATURAN SITASI MUTLAK**:
    - Setiap penjelasan mekanisme, dampak, dan rekomendasi WAJIB diakhiri sitasi [n].
    - Jelaskan mekanisme secara farmakologis (enzim, reseptor, dll).

    Struktur:
    ## Tabel Analisis Interaksi Obat-Obat
    | Pasangan Obat | Level | Mekanisme & Dampak Klinis [Sitasi] | Rekomendasi Apoteker [Sitasi] | Referensi Obat [Sitasi] |
    | :--- | :--- | :--- | :--- | :--- |
    | A + B | **Major** | (Jelaskan detail CYP/Farmakodinamik) ... [n] | ... [n] | [1] [2] |
    
    ## Interaksi Lain (Makanan/Penyakit)
    | Objek Interaksi | Jenis (Makanan/Penyakit) | Detail Interaksi & Mekanisme [Sitasi] | Manajemen/Saran [Sitasi] |
    | :--- | :--- | :--- | :--- |
    | ... | ... | ... [n] | ... [n] |
  `;

  const parts: any[] = [{ text: prompt }];
  if (image) {
    const imagePart = await fileToPart(image);
    parts.unshift(imagePart);
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }],
        systemInstruction: "Anda adalah sistem pakar interaksi obat. DILARANG membuat daftar referensi manual. Gunakan hanya sitasi inline [n].",
      }
    });

    return {
      text: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Interaction Check Error:", error);
    throw error;
  }
};

// 4. Helper for Promkes Description Generation
export const generateVisualDescription = async (title: string, aspectRatio: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  let layoutAdvice = "";
  if (aspectRatio === '1:1') {
    layoutAdvice = "Format Persegi (Square). Fokuskan subjek di tengah (centered composition).";
  } else if (aspectRatio === '4:5') {
    layoutAdvice = "Format Poster Portrait (4:5). Komposisi vertikal, sisakan ruang di atas untuk headline teks.";
  } else if (aspectRatio === '1:3') {
    layoutAdvice = "Format X-Banner (Standing Banner 1:3). Komposisi sangat tinggi dan ramping. Subjek harus memanjang atau ditumpuk vertikal.";
  } else if (aspectRatio === '1:2') {
    layoutAdvice = "Format Brosur Lipat Tiga (Leaflet 1:2). Deskripsikan tata letak yang cocok untuk dibagi menjadi 3 panel vertikal.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Kamu adalah Art Director profesional untuk kampanye kesehatan.
      
      Tugas: Buatlah deskripsi visual yang detail, estetik, dan menarik untuk sebuah media promosi kesehatan.
      Judul: "${title}"
      Format Media: ${layoutAdvice}
      
      Instruksi:
      - Sesuaikan komposisi visual dengan format media yang diminta di atas.
      - Deskripsikan subjek utama (misal: dokter, pasien, atau metafora visual).
      - Deskripsikan suasana (mood), pencahayaan, dan palet warna.
      - Deskripsikan latar belakang.
      - Output HANYA paragraf deskripsi visual dalam Bahasa Indonesia yang siap digunakan sebagai prompt untuk desainer (atau AI Image Generator). Jangan ada teks pengantar lain.
      - Buatlah deskripsi yang memungkinkan hasil gambar terlihat bersih, modern, dan profesional.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Desc Gen Error:", error);
    throw error;
  }
};

// 5. Media Promkes (Image Gen)
export const generatePromkesMedia = async (
  title: string,
  desc: string,
  aspectRatio: string,
  style: string,
  size: string
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // LEAFLET SPECIAL CASE (2 Images, 3 Panels each)
  if (aspectRatio === '1:2') {
    const basePrompt = `Create a ${style} tri-fold brochure/leaflet design. 1:2 vertical aspect ratio.
    Title: "${title}"
    Description: ${desc}.
    IMPORTANT: The image MUST be visually divided into 3 vertical panels (tri-fold layout).`;

    const promptA = `${basePrompt} This is SIDE A (OUTER SIDE / FRONT). Show the Cover Panel, Back Panel, and Folded-in Panel. High quality, professional text placement.`;
    const promptB = `${basePrompt} This is SIDE B (INNER SIDE). Show the 3 inside panels with continuous or segmented content flow. Informative and structured.`;

    try {
      // Execute both requests in parallel
      const [responseA, responseB] = await Promise.all([
        ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: promptA }] },
          config: { imageConfig: { aspectRatio: '9:16', imageSize: size as any } }
        }),
        ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: promptB }] },
          config: { imageConfig: { aspectRatio: '9:16', imageSize: size as any } }
        })
      ]);

      const getImage = (res: any) => {
        for (const part of res.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
      };

      const imgA = getImage(responseA);
      const imgB = getImage(responseB);

      const results = [];
      if (imgA) results.push(imgA);
      if (imgB) results.push(imgB);
      
      if (results.length === 0) throw new Error("Gagal membuat gambar leaflet.");
      return results;

    } catch (error) {
      console.error("Leaflet Gen Error:", error);
      throw error;
    }
  }

  // STANDARD CASE (Single Image)
  let apiAspectRatio = "1:1";
  let promptSuffix = "";

  switch (aspectRatio) {
    case '1:1': 
      apiAspectRatio = '1:1'; 
      break;
    case '4:5': 
      apiAspectRatio = '3:4'; 
      promptSuffix = " Composition should be optimized for a 4:5 poster crop, leaving some vertical margin.";
      break;
    case '1:3': 
      apiAspectRatio = '9:16';
      promptSuffix = " Composition should be tall and narrow, suitable for a 1:3 vertical standing banner (X-banner).";
      break;
    default: apiAspectRatio = '1:1';
  }

  const prompt = `Create a ${style} health promotion design.
  Title: "${title}"
  Content Description: ${desc}.
  The design should be high quality, text-legible (if any), and visually professional for a pharmacy context. ${promptSuffix}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: apiAspectRatio as any,
          imageSize: size as any,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return [`data:image/png;base64,${part.inlineData.data}`];
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// Helper
const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
