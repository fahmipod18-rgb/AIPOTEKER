
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
    Bertindaklah sebagai Apoteker profesional di Indonesia. Analisis pasien ini untuk Swamedikasi (Self-Medication).
    
    Data Pasien:
    - Usia: ${data.age}
    - Berat Badan: ${data.weight}
    - Kondisi Khusus: ${data.patientCondition}
    - Keluhan Utama: ${data.complaint}
    - Obat yang sudah digunakan: ${data.currentMeds}
    - Tindakan yang sudah dilakukan: ${data.treatment}
    
    ${image ? "Gambar kondisi disertakan untuk analisis visual." : ""}

    ${DOWA_KNOWLEDGE_BASE}

    Instruksi Output:
    1.  Gunakan Bahasa Indonesia.
    2.  **WAJIB FORMAT TABEL**: Sajikan data utama dalam bentuk Tabel Markdown.
    3.  Gunakan Google Search untuk memvalidasi indikasi, dosis, dan interaksi.
    4.  **Safety Check: Duplikasi Terapi**: Periksa apakah obat yang sudah digunakan pasien memiliki kandungan yang sama dengan rekomendasi baru. Jika ya, berikan label "(OPSI: PILIH SALAH SATU)" dan peringatkan tentang risiko overdosis/duplikasi. Jangan menyarankan meminum keduanya sekaligus.
    5.  **Prioritas Merk**: Boleh menyarankan obat paten/branded yang umum di Indonesia (misal: Siladex, Panadol, Silex, dll) selain generik, selama sesuai indikasi.
    6.  **ATURAN SITASI MUTLAK**: 
        - Setiap sel tabel yang berisi fakta medis (indikasi, dosis, interaksi, saran) **WAJIB** diakhiri dengan nomor sitasi [n]. 
        - DILARANG menulis kalimat medis tanpa sitasi.
        - Contoh Benar: "Paracetamol 500mg [1]"
        - Contoh Salah: "Paracetamol 500mg"
    7.  **Validasi DOWA**: Saat merekomendasikan obat, periksa apakah obat tersebut masuk kategori Obat Bebas, Bebas Terbatas, atau DOWA. Jika DOWA, pastikan jumlahnya sesuai aturan DOWA di atas. Jika obat keras NON-DOWA, arahkan ke dokter.
    
    Struktur Respon:

    ## Evaluasi Pengobatan & Tindakan Sebelumnya
    | Nama Obat/Tindakan | Keputusan (Lanjut/Stop) | Alasan Klinis [Sitasi] |
    | :--- | :--- | :--- |
    | ... | ... | ... [n] |

    ## Rekomendasi Obat Baru
    | Nama Obat | Kategori (Bebas/DOWA) | Alasan & Indikasi [Sitasi] | Batasan Jumlah (Jika DOWA) |
    | :--- | :--- | :--- | :--- |
    | ... | ... | ... [n] | ... [n] |
    
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
        systemInstruction: "Anda adalah Apoteker Profesional Indonesia. Patuhi aturan DOWA (Daftar Obat Wajib Apotek). Cek duplikasi terapi (polypharmacy). DILARANG membuat daftar referensi manual di akhir teks. Cukup gunakan sitasi inline [n]. UI akan menangani daftar link secara otomatis.",
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

// 4. Helper for Promkes Description Generation (BANTU SAYA AI)
export const generateVisualDescription = async (title: string, aspectRatio: string, style: string) => {
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
    layoutAdvice = "LAYOUT: Tri-fold Brochure style. Distinct vertical columns showing sequence of information.";
  }

  // Style-specific adjustments for the "Help Me AI" description generator
  let styleAdvice = "";
  if (style.includes("Analitis")) {
    styleAdvice = "STYLE: Data-Driven. Must include bar charts, percentage circles, and grid layouts. Use limited color palette (Blue/Grey). Font must be monospaced or crisp sans-serif.";
  } else if (style.includes("Minimalis")) {
    styleAdvice = "STYLE: Minimalist Medical. Lots of whitespace (negative space). Thin lines, simple stroke icons, high contrast text. Very structured.";
  } else if (style.includes("Ilustratif")) {
    styleAdvice = "STYLE: Medical Illustration (Flat/Semi-Realistic). Feature a central anatomical or character illustration explaining the concept. Surrounding elements are supportive icons.";
  } else if (style.includes("Corporate")) {
    styleAdvice = "STYLE: Corporate Hospital. Professional photos or high-end stock style mixed with clean UI elements. Blue/Teal/White palette. Trustworthy look.";
  } else if (style.includes("Storytelling")) {
    styleAdvice = "STYLE: Storytelling Flow. Use a sequential layout (Problem -> Solution). Vibrant colors, expressive characters, emotional engagement.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an Information Designer and Medical Illustrator.
      
      TASK: Create a detailed prompt for generating a text-heavy EDUCATIONAL INFOGRAPHIC.
      Topic: "${title}"
      Format Strategy: ${layoutAdvice}
      Target Visual Style: "${style}" (${styleAdvice})
      
      CRITICAL INSTRUCTIONS:
      1.  **DENSITY**: The image must look like a "Cheat Sheet" or "Reference Guide", NOT a book cover.
      2.  **ELEMENTS**: Ask for "numbered lists", "bullet points", "process diagrams", "charts", and "text blocks".
      3.  **TEXT SIMULATION**: Explicitly ask for "lines representing text" or "placeholder text blocks" to make it look informative.
      4.  **SELLING POINT**: Make it look attractive and "shareable" on social media.
      
      OUTPUT: A single descriptive paragraph in English describing the LAYOUT, CONTENT STRUCTURE, and STYLE.`,
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
  
  // Dynamic Style Injection based on User Selection
  let specificStyleInstructions = "";
  
  if (style.includes("Analitis")) {
    specificStyleInstructions = "VISUALS: Data visualization focus. Use bar charts, donut charts, and big bold percentage numbers. Modular grid layout. Clean, technical look.";
  } else if (style.includes("Minimalis")) {
    specificStyleInstructions = "VISUALS: Swiss Design style. Heavy use of negative space (whitespace). High contrast typography (Helvetica-ish). Simple stroke icons. No clutter.";
  } else if (style.includes("Ilustratif")) {
    specificStyleInstructions = "VISUALS: Medical Vector Illustration. Central focal point is a detailed flat or semi-realistic illustration of the organ/patient/drug. Surrounding text explains the mechanism.";
  } else if (style.includes("Corporate")) {
    specificStyleInstructions = "VISUALS: Professional Healthcare Brand. Trustworthy blue/white palette. Clean layout like a hospital brochure. May include photorealistic elements blended with vector UI.";
  } else if (style.includes("Storytelling")) {
    specificStyleInstructions = "VISUALS: Narrative Flow. Sequential panels (1->2->3). Vibrant, engaging colors. Expressive character illustrations showing emotion (pain -> relief).";
  }

  const globalInjector = `
  CORE REQUIREMENT: **COMMERCIAL QUALITY INFOGRAPHIC**.
  The image must look like a professionally designed, selling infographic found on top health portals (like Healthline or WHO).
  CONTENT: Must contain visible "Text Blocks" (simulated text), "Bullet Points", "Numbered Lists", or "Diagrams".
  DENSITY: High information density.
  DO NOT CREATE: Abstract art, blurry text, or simple book covers.
  ${specificStyleInstructions}
  `;

  // LEAFLET SPECIAL CASE (2 Images, 3 Panels each)
  if (aspectRatio === '1:2') {
    const basePrompt = `Design a ${style} tri-fold brochure/leaflet (Infographic Layout). 1:2 vertical aspect ratio.
    Topic: "${title}"
    Details: ${desc}.
    ${globalInjector}
    IMPORTANT: VISUALLY SPLIT INTO 3 VERTICAL COLUMNS. Fill columns with text blocks and small icons.`;

    const promptA = `${basePrompt} SIDE A (Outer). Column 1: Contact Info. Column 2: Back Panel (Summary). Column 3: Main Title Cover.`;
    const promptB = `${basePrompt} SIDE B (Inner). Column 1: Introduction (Text block). Column 2: Main Symptoms (List with icons). Column 3: Treatment (Step-by-step).`;

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
  Title: "${title}"
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
