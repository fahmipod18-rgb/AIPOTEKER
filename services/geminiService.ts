
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

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

// DATA REFERENSI DOWA (DAFTAR OBAT WAJIB APOTEK) - DIEKSTRAK DARI DOKUMEN RESMI
const DOWA_KNOWLEDGE_BASE = `
REFERENSI RESMI DOWA (DAFTAR OBAT WAJIB APOTEK) INDONESIA:

ATURAN UMUM: Obat-obat berikut adalah Obat Keras yang DIPERBOLEHKAN diserahkan oleh Apoteker tanpa resep dokter, dengan batasan jumlah tertentu.

DOWA NO. 1:
1. Oral Kontrasepsi: Max 1 siklus (Untuk siklus ke-2 dst, siklus pertama harus resep dokter). Contoh: Linestrenol, Ethinyl estradiol kombinasi.
2. Obat Saluran Cerna (Antasid + Sedatif/Spasmodik): Max 20 tablet. Contoh: Mg Trisilikat/Al.Oksida + Papaverin/Diazepam.
3. Anti Spasmodik: Papaverin, Hiosin Butilbromida (Max 20 tab).
4. Anti Mual: Metoklopramid HCl (Max 20 tab).
5. Laksan: Bisakodil Supp (Max 3 supp).
6. Obat Mulut/Tenggorokan: Hexetidine, Triamcinolone acetonide (Max 1 botol/tube).
7. Obat Saluran Nafas (Asma): Salbutamol, Terbutalin, Ketotifen (Max 20 tab, 1 sirup, 1 inhaler). *Hanya pengobatan ulangan*.
8. Mukolitik: Asetilsistein, Karbosistein, Bromheksin (Max 20 tab / 1 sirup).
9. Analgetik/Antipiretik: Metampiron (Max 20 tab), Asam Mefenamat (Max 20 tab).
10. Antihistamin: Mebhidrolin, Pheniramin, Astemizol (Max 20 tab).
11. Obat Cacing: Mebendazol (Max 6 tab / 1 sirup).
12. Obat Kulit Topikal:
    - Antibiotik: Tetrasiklin, Kloramfenikol, Gentamisin, Eritromisin, Framisetin (Max 1 tube).
    - Kortikosteroid: Hidrokortison, Betametason, Triamsinolon (Max 1 tube).
    - Antifungi: Mikonazol, Nistatin, Tolnaftat, Econazol (Max 1 tube).
    - Anestesi Lokal: Lidokain HCl (Max 1 tube).
    - Pemucat Kulit: Hidrokuinon (Max 1 tube).

DOWA NO. 2:
1. Albendazol: Tab 200mg (6 tab), 400mg (3 tab).
2. Bacitracin, Clindamicin (acne), Silver sulfadiazine: 1 tube.
3. Kortikosteroid Topikal: Dexametason, Methylprednisolon, Prednisolon, Hidrokortison butirat (1 tube).
4. NSAID Topikal/Oral: Diclofenac (1 tube), Piroxicam (1 tube), Ibuprofen (400mg/600mg Max 10 tab).
5. Antifungi Topikal: Ketoconazole (Kadar <2% Krim 1 tube / Scalp sol 1 botol), Isoconazol.
6. Omeprazole: Max 7 tablet.
7. Sucralfate, Sulfasalazine: Max 20 tablet.

DOWA NO. 3 (Umumnya Pengulangan Resep Dokter):
1. Antiulkus: Famotidin (Max 10 tab 20/40mg), Ranitidin (Max 10 tab 150mg).
2. Obat Kulit Akne: Asam Azeleat, Asam Fusidat, Motretinida, Tretinoin (Max 1 tube).
3. Antiinfeksi TBC: Kategori I, II, III (Hanya satu paket pengulangan).
4. Asam Urat & Nyeri: Allopurinol (Max 10 tab 100mg), Diklofenak Natrium (Max 10 tab 25mg), Piroksikam (Max 10 tab 10mg).
5. Antihistamin: Setirizin (Cetirizine), Siproheptadin (Max 10 tab).
6. Obat Mata/Telinga Antibodi: Gentamisin, Kloramfenikol (Max 1 tube/botol).
`;

// Helper to handle File to Part (Binary or Text)
const fileToPart = async (file: File) => {
  // If file is text-based (CSV, TXT, JSON), read as string
  if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
    return new Promise<{ text: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ text: `\n\n[ISI FILE SOURCE "${file.name}"]:\n${reader.result as string}\n[AKHIR FILE SOURCE]\n` });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // If file is supported binary (PDF, Image), read as base64
  if (file.type.startsWith('image/') || file.type === 'application/pdf') {
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
  }

  throw new Error(`Format file ${file.type} tidak didukung secara langsung. Mohon gunakan PDF, Gambar, CSV, atau TXT.`);
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
  image: File | null,
  sourceFile: File | null // NEW: Source of stock
) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelName = 'gemini-2.5-flash'; 

  let prompt = `
    Bertindaklah sebagai Apoteker profesional di Indonesia. Analisis pasien ini untuk Swamedikasi (Self-Medication).
    
    Data Pasien:
    - Usia: ${data.age}
    - Berat Badan: ${data.weight}
    - Kondisi Khusus: ${data.patientCondition}
    - Keluhan Utama: ${data.complaint}
    - Obat yang sudah digunakan: ${data.currentMeds}
    - Tindakan yang sudah dilakukan: ${data.treatment}
    
    ${image ? "Gambar kondisi disertakan untuk analisis visual." : ""}
    ${sourceFile ? "FILE SOURCE (Daftar Stok Obat Pribadi User) TELAH DILAMPIRKAN. Prioritaskan obat dari sini." : "User TIDAK melampirkan daftar stok obat."}

    ${DOWA_KNOWLEDGE_BASE}

    Instruksi Output:
    1.  Gunakan Bahasa Indonesia.
    2.  **WAJIB FORMAT TABEL**: Sajikan data utama dalam bentuk Tabel Markdown.
    
    3.  **LOGIKA KETERSEDIAAN OBAT & SOURCE FILE (CRITICAL)**:
        - **SKENARIO A: Jika TIDAK ADA File Source**:
          - Berikan rekomendasi obat terbaik secara klinis (Generik/Paten/Campuran).
          - **DILARANG** menulis label "[TERSEDIA DI STOK]" atau "[TIDAK TERSEDIA DI STOK]" sama sekali.
        
        - **SKENARIO B: Jika ADA File Source**:
          - Cek apakah obat yang direkomendasikan ada di dalam daftar source.
          - Jika **ADA**: Tambahkan label **"{{GREEN:[TERSEDIA DI STOK]}}"**.
          - Jika **TIDAK ADA** (tapi obat ini penting secara klinis): Tambahkan label **"{{RED:[TIDAK TERSEDIA DI STOK]}}"**.
          - **PRIORITAS**: Utamakan obat yang tersedia di stok **HANYA JIKA** indikasi medisnya sesuai dan aman.
          - **SAFETY FIRST**: JANGAN memaksakan obat dari stok jika tidak ampuh atau kontraindikasi. Jika stok tidak memadai, WAJIB sarankan obat luar (tandai dengan {{RED:[TIDAK TERSEDIA DI STOK]}}).

    4.  **Strategi Rekomendasi (Multiple Options)**:
        - **PENTING: PISAHKAN TABEL BERDASARKAN KELUHAN**. Jangan gabungkan semua obat dalam satu tabel besar. Buat Sub-Header untuk setiap gejala (misal: "Untuk Demam", "Untuk Batuk").
        - Berikan 2-3 Opsi Obat per gejala (jika memungkinkan).
        - **FILTER DUPLIKASI ZAT AKTIF**: DILARANG menyarankan obat tunggal (misal CTM) jika sudah menyarankan obat campuran yang mengandung zat tersebut (misal Konidin) dalam satu rangkaian terapi. Pilih salah satu yang terbaik.
        - **TAG PILIHAN**:
          - JIKA ada >1 opsi obat untuk satu gejala (artinya user harus memilih), tambahkan label "*(OPSI: PILIH SALAH SATU)*" pada nama obat.
          - JIKA hanya ada 1 obat rekomendasi untuk gejala tersebut, DILARANG memberikan label tersebut.
    
    5.  **Formatting**: Nama obat **TEBAL** (Bold). Gunakan merek populer (Panadol, Siladex, dll) atau Generik.
    6.  **ATURAN SITASI MUTLAK**: Setiap sel tabel berisi fakta medis WAJIB diakhiri sitasi [n].
    
    Struktur Respon:

    ## Evaluasi Pengobatan & Tindakan Sebelumnya
    | Nama Obat/Tindakan | Keputusan (Lanjut/Stop) | Alasan Klinis [Sitasi] |
    | :--- | :--- | :--- |
    | ... | ... | ... [n] |

    ## Rekomendasi Pengobatan (Dikelompokkan per Gejala)
    
    ### 1. Untuk Mengatasi [Nama Gejala, misal: Demam]
    | Nama Obat (Opsi) | Kandungan Zat Aktif | Kategori (Bebas/DOWA) | Alasan & Indikasi [Sitasi] | Batasan Jumlah (Jika DOWA) |
    | :--- | :--- | :--- | :--- | :--- |
    | **Nama Obat A** {{GREEN:[TERSEDIA DI STOK]}} *(OPSI: PILIH SALAH SATU)* | ... | ... | ... [n] | ... |
    | **Nama Obat B** {{RED:[TIDAK TERSEDIA DI STOK]}} *(OPSI: PILIH SALAH SATU)* | ... | ... | ... [n] | ... |

    ### 2. Untuk Mengatasi [Nama Gejala, misal: Batuk Berdahak]
    | Nama Obat (Opsi) | Kandungan Zat Aktif | Kategori (Bebas/DOWA) | Alasan & Indikasi [Sitasi] | Batasan Jumlah (Jika DOWA) |
    | :--- | :--- | :--- | :--- | :--- |
    | **Nama Obat C** ... | ... | ... | ... [n] | ... |
    
    ## Aturan Pakai
    | Nama Obat | Dosis (sesuai usia/BB) | Frekuensi | Durasi Maks |
    | :--- | :--- | :--- | :--- |
    | ... | ... [n] | ... | ... |

    ## Non-Drug Treatment
    - [Saran 1] [n]
    
    ## Red Flags (Segera ke Dokter Jika)
    - [Gejala 1] [n]
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (image) {
    try {
       const imagePart = await fileToPart(image);
       // Check if text part (error handling for unsupported types handled in fileToPart)
       if ('text' in imagePart) {
         // Should not happen for image files, but for safety
         parts[0].text += imagePart.text;
       } else {
         parts.unshift(imagePart);
       }
    } catch (e) {
      console.warn("Skipping image attachment:", e);
    }
  }

  // Handle Source File (PDF/Image/Text)
  if (sourceFile) {
    try {
      const sourcePart = await fileToPart(sourceFile);
      if ('text' in sourcePart) {
        // It's a text file (CSV/TXT), append to prompt text
        parts[0].text += sourcePart.text;
      } else {
        // It's a binary file (PDF), add as part
        parts.unshift(sourcePart);
      }
    } catch (e) {
      console.warn("Failed to attach source file", e);
      throw e; // Rethrow to alert user in UI
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }],
        systemInstruction: "Anda adalah Apoteker Profesional. Pisahkan tabel rekomendasi per gejala. Prioritaskan obat dari 'Source File' jika aman. Cek duplikasi terapi. Gunakan sitasi inline [n].",
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
    try {
      const imagePart = await fileToPart(image);
      if ('text' in imagePart) {
         parts[0].text += imagePart.text;
      } else {
         parts.unshift(imagePart);
      }
    } catch (e) {
      console.warn("Interaction Image Error", e);
    }
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

// 4. Helper: Generate Headline (NEW)
export const generateHeadline = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const prompt = `
    Anda adalah Creative Copywriter spesialis Kampanye Kesehatan.
    Tugas: Buatkan 1 (satu) Judul/Headline Poster yang **Sangat Menarik (Catchy), Persuasif, dan Tidak Kaku**.
    Topik: "${topic}".

    Panduan Gaya:
    - Gunakan Bahasa Indonesia yang **luwes, populer, dan mudah dipahami** oleh masyarakat awam.
    - **Hindari** bahasa birokratis atau istilah medis yang terlalu teknis/rumit.
    - Fokus pada **manfaat** atau **dampak emosional** (mengajak, mengingatkan, atau memberi solusi).
    - Headline harus singkat, padat, dan "memancing" orang untuk membaca.
    
    Output: Hanya teks judulnya saja tanpa tanda petik.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Headline Gen Error:", error);
    return "";
  }
};

// 4b. Helper for Promkes Description Generation (BANTU SAYA AI)
export const generateVisualDescription = async (topic: string, title: string, aspectRatio: string, style: string, colorPalette: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Adjusted for TEXT-HEAVY / INFOGRAPHIC Layouts
  let layoutAdvice = "";
  if (aspectRatio === '1:1') {
    layoutAdvice = "LAYOUT: Dense Square Infographic. Split into 4 clear quadrants. Top left: Headline. Top right: Key stat/icon. Bottom left: Bullet points. Bottom right: Chart or diagram.";
  } else if (aspectRatio === '4:5') {
    layoutAdvice = "LAYOUT: Educational Poster (Vertical). 1. Header Area (20%). 2. Body Area (60%) featuring a step-by-step list (1, 2, 3) or a flowchart with vector icons and visible text blocks. 3. Footer Area (20%) for warnings/contact.";
  } else if (aspectRatio === '1:3') {
    layoutAdvice = "LAYOUT: Standing Banner (X-Banner). Top-to-bottom flow. Must look like a list. Header -> Point 1 -> Point 2 -> Point 3 -> Footer. High text density.";
  } else if (aspectRatio === '1:2') {
    // UPDATED FOR FLAT TRI-FOLD (16:9 Landscape usually fits open brochures better than vertical)
    layoutAdvice = "LAYOUT: FLAT 2D OPEN TRI-FOLD BROCHURE. The layout MUST consist of 3 EQUAL VERTICAL COLUMNS side-by-side. Column 1 (Intro/Problem), Column 2 (Detail/Process), Column 3 (Solution/Contact). Must look like a print-ready design file, NOT a 3D mockup.";
  }

  // Style-specific adjustments for the "Help Me AI" description generator
  let styleAdvice = "";
  if (style.includes("Analitis")) {
    styleAdvice = "STYLE: Data-Driven. Must include bar charts, percentage circles, and grid layouts. Font must be monospaced or crisp sans-serif.";
  } else if (style.includes("Minimalis")) {
    styleAdvice = "STYLE: Minimalist Medical. Lots of whitespace (negative space). Thin lines, simple stroke icons, high contrast text. Very structured.";
  } else if (style.includes("Ilustratif")) {
    styleAdvice = "STYLE: Medical Illustration (Flat/Semi-Realistic). Feature a central anatomical or character illustration explaining the concept. Surrounding elements are supportive icons.";
  } else if (style.includes("Corporate")) {
    styleAdvice = "STYLE: Corporate Hospital. Professional photos or high-end stock style mixed with clean UI elements. Trustworthy look.";
  } else if (style.includes("Storytelling")) {
    styleAdvice = "STYLE: Storytelling Flow. Use a sequential layout (Problem -> Solution). Expressive character illustrations showing emotion (pain -> relief).";
  }

  // Color Palette Injection
  let colorAdvice = "";
  if (colorPalette.includes("Acak")) {
    colorAdvice = "COLOR: Select a harmonious color palette suitable for the topic.";
  } else {
    colorAdvice = `COLOR PALETTE: STRICTLY use the "${colorPalette}" scheme. Ensure these colors are dominant in the background, text, and elements.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an Information Designer and Medical Illustrator.
      
      TASK: Create a detailed prompt for generating a text-heavy EDUCATIONAL INFOGRAPHIC.
      MAIN TOPIC/SUBJECT: "${topic}"
      POSTER HEADLINE: "${title}"
      Format Strategy: ${layoutAdvice}
      Target Visual Style: "${style}" (${styleAdvice})
      ${colorAdvice}
      
      CRITICAL INSTRUCTIONS:
      1.  **DENSITY**: The image must look like a "Cheat Sheet" or "Reference Guide", NOT a book cover.
      2.  **ELEMENTS**: Ask for "numbered lists", "bullet points", "process diagrams", "charts", and "text blocks".
      3.  **TEXT SIMULATION**: Explicitly ask for "lines representing text" or "placeholder text blocks" to make it look informative.
      4.  **SELLING POINT**: Make it look attractive and "shareable" on social media.
      5.  **NO CONTACT PLACEHOLDERS**: STRICTLY FORBID the inclusion of "Contact" sections with template placeholders (e.g., "[Phone Number]", "[Website]", "[Clinic Name]", "[Insert Text]"). Focus 100% on the educational topic.
      6.  **FLAT DESIGN**: If the format is Leaflet, ensure the description asks for a FLAT 2D LAYOUT with 3 COLUMNS, not a 3D perspective.
      
      OUTPUT: A single descriptive paragraph in English describing the LAYOUT, CONTENT STRUCTURE, COLORS, and STYLE.`,
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
  topic: string,
  title: string,
  desc: string,
  aspectRatio: string,
  style: string,
  colorPalette: string,
  size: string
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Dynamic Style Injection based on User Selection
  let specificStyleInstructions = "";
  
  if (style.includes("Analitis")) {
    specificStyleInstructions = "VISUALS: Data visualization focus. Use bar charts, donut charts, and big bold percentage numbers. Modular grid layout. Clean, technical look.";
  } else if (style.includes("Minimalis")) {
    specificStyleInstructions = "VISUALS: Swiss Design style. Heavy use of negative space (whitespace). High contrast typography (Helvetica-ish). Simple stroke icons. No clutter.";
  } else if (style.includes("Ilustratif")) {
    specificStyleInstructions = "VISUALS: Medical Vector Illustration. Central focal point is a detailed flat or semi-realistic illustration of the organ/patient/drug. Surrounding text explains the mechanism.";
  } else if (style.includes("Corporate")) {
    specificStyleInstructions = "VISUALS: Professional Healthcare Brand. Trustworthy look. Clean layout like a hospital brochure. May include photorealistic elements blended with vector UI.";
  } else if (style.includes("Storytelling")) {
    specificStyleInstructions = "VISUALS: Narrative Flow. Sequential panels (1->2->3). Expressive character illustrations showing emotion (pain -> relief).";
  }

  // Color Palette Injection
  let colorInstructions = "";
  if (!colorPalette.includes("Acak")) {
    colorInstructions = `COLOR PALETTE: STRICTLY use the "${colorPalette}" scheme. The entire infographic must follow this palette for backgrounds, accents, and text.`;
  }

  const globalInjector = `
  CORE REQUIREMENT: **COMMERCIAL QUALITY INFOGRAPHIC**.
  The image must look like a professionally designed, selling infographic found on top health portals (like Healthline or WHO).
  CONTENT: Must contain visible "Text Blocks" (simulated text), "Bullet Points", "Numbered Lists", or "Diagrams".
  DENSITY: High information density.
  
  NEGATIVE PROMPT / RESTRICTIONS:
  - NO "Contact Us" sections with template placeholders (e.g., "[Phone Number]", "[Website]", "[Clinic Name]", "[Insert Text]"). 
  - NO bracketed placeholders or empty form fields.
  - The design should be purely educational.
  - DO NOT CREATE: Abstract art, blurry text, or simple book covers.

  ${specificStyleInstructions}
  ${colorInstructions}
  `;

  // LEAFLET SPECIAL CASE (2 Images, 3 Panels each)
  // UPDATED LOGIC: Use 16:9 Landscape to allow ample space for 3 distinct columns.
  if (aspectRatio === '1:2') {
    const structuralInstruction = `
    DESIGN TYPE: FLAT 2D PRINT LAYOUT.
    VIEW: Top-down, perfectly flat.
    LAYOUT: The image MUST be a single rectangular canvas visually divided into **EXACTLY 3 EQUAL VERTICAL COLUMNS** (Tri-fold structure).
    STYLE: ${style}. High Resolution Vector Infographic.
    
    NEGATIVE PROMPT:
    - NO 3D rendering.
    - NO perspective view.
    - NO stack of papers.
    - NO showing the brochure on a table or desk.
    - NO multiple sheets of paper.
    - NO shadows or curling paper edges.
    - NO contact info templates like "[Phone Number]" or "[Address]".
    `;

    const promptA = `
    ${structuralInstruction}
    CONTEXT: OUTER SIDE (Back Panel, Fold Panel, Front Cover).
    
    Structure (Left to Right):
    - COLUMN 1 (Left - Back Panel): "Prevention Tips". List of 4 icon+text items. 
    - COLUMN 2 (Center - Fold Panel): Minimal Branding. A single clean vector icon and the slogan.
    - COLUMN 3 (Right - FRONT COVER): Big Bold Title "${title}" at the top. Large Hero Illustration in the middle. Subtitle at bottom.
    
    Topic: ${topic}. ${desc}
    ${globalInjector}
    `;

    const promptB = `
    ${structuralInstruction}
    CONTEXT: INNER SIDE (Left Panel, Center Panel, Right Panel).
    
    Structure (Left to Right):
    - COLUMN 1 (Left): "Understanding the Problem". Headline + Text Block + Diagram.
    - COLUMN 2 (Center): "Main Infographic". A detailed central flowchart or anatomy diagram spanning the width of the column.
    - COLUMN 3 (Right): "Treatment & Action". Numbered list (1, 2, 3) explaining steps. Bottom: Generic "Consult Doctor" icon (No text).
    
    Topic: ${topic}. ${desc}
    ${globalInjector}
    `;

    try {
      // Execute both requests in parallel
      // NOTE: Using 16:9 Landscape for Leaflet to support the 3-column layout better than 9:16
      const [responseA, responseB] = await Promise.all([
        ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: promptA }] },
          config: { imageConfig: { aspectRatio: '16:9', imageSize: size as any } }
        }),
        ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: promptB }] },
          config: { imageConfig: { aspectRatio: '16:9', imageSize: size as any } }
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
  let compositionInstruction = "";

  switch (aspectRatio) {
    case '1:1': 
      apiAspectRatio = '1:1'; 
      compositionInstruction = "Layout: Dense Grid Infographic. Split into quadrants. Include charts and text lists.";
      break;
    case '4:5': 
      apiAspectRatio = '3:4'; 
      compositionInstruction = "Layout: Vertical Educational Poster. Header at top. Body contains a structured list of steps (1, 2, 3) or symptoms with icons and text descriptions. Footer with disclaimer.";
      break;
    case '1:3': 
      apiAspectRatio = '9:16';
      compositionInstruction = "Layout: X-Banner (Standing Banner). Stacked content blocks. Title -> Point 1 -> Point 2 -> Point 3. High information density.";
      break;
    default: apiAspectRatio = '1:1';
  }

  const prompt = `Design a High-Density Educational Infographic.
  Topic: "${topic}"
  Headline Title: "${title}"
  Content Description: ${desc}.
  Layout Strategy: ${compositionInstruction}
  ${globalInjector}
  Ensure the result looks like a helpful medical reference document with organized information sections.`;

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

// 6. FARMAQUIZ GENERATOR
export const generateQuizQuestions = async (category: string): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelName = 'gemini-2.5-flash';

  const prompt = `
    Anda adalah Pembuat Soal Ujian Kompetensi Apoteker Indonesia (UKAI).
    Buatkan 20 soal latihan Pilihan Ganda (Multiple Choice) untuk kategori: "${category}".
    
    Persyaratan Soal:
    1. Soal harus berbasis studi kasus klinis, perhitungan farmasi, atau regulasi industri sesuai kategori.
    2. Tingkat kesulitan setara UKAI (HOTS - Higher Order Thinking Skills).
    3. Referensi harus jelas (misal: Farmakope Indonesia Ed VI, CPOB 2018, PMK No 72/2016, Dipiro Ed 11).
    4. Opsi jawaban ada 4 (A, B, C, D).
    5. Sertakan pembahasan yang sangat mendalam dan analitis (mengapa jawaban benar, mengapa opsi lain salah).

    Output WAJIB JSON Array murni tanpa markdown formatting (seperti \`\`\`json).
    Format JSON:
    [
      {
        "id": 1,
        "question": "Seorang pasien...",
        "options": ["A. Opsi 1", "B. Opsi 2", "C. Opsi 3", "D. Opsi 4"],
        "correctAnswer": 0, // 0 untuk A, 1 untuk B, dst
        "explanation": "Jawaban A benar karena... (Analisis). Opsi B salah karena...",
        "reference": "PMK No 72 Tahun 2016 tentang..."
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    // Parse JSON
    const questions = JSON.parse(jsonText) as QuizQuestion[];
    
    // Validate count (sometimes AI generates less/more, strict checking optional but good)
    return questions.slice(0, 20); 

  } catch (error) {
    console.error("Quiz Gen Error:", error);
    throw error;
  }
};
