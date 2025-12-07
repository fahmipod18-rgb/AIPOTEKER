
export enum View {
  SWAMEDIKASI = 'swamedikasi',
  DRUG_INFO = 'drug_info',
  INTERACTION = 'interaction',
  FARMAQUIZ = 'farmaquiz',
  PROMKES = 'promkes',
  SETTINGS = 'settings',
}

export interface SwamedikasiForm {
  age: string;
  weight: string;
  complaint: string;
  currentMeds: string;
  treatment: string;
  patientCondition: string; // New field
  image: File | null;
}

export interface PromkesForm {
  title: string;
  description: string;
  aspectRatio: string;
  style: string;
  colorPalette: string; // Stores the 'value' or 'label' of the palette
  size: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  image?: string;
  groundingLinks?: Array<{ title: string; url: string }>;
}

export enum AspectRatio {
  PERSEGI_1_1 = '1:1',
  POSTER_4_5 = '4:5',
  BANNER_PORTRAIT_1_3 = '1:3',
  LEAFLET_1_2 = '1:2'
}

export const STYLE_OPTIONS = [
  "Analitis & Data-Driven",
  "Minimalis & Clean",
  "Ilustratif (Flat / Semi-Realistic)",
  "Corporate & Profesional",
  "Storytelling & Emotional Engagement"
];

// New Structure for Visual Color Palettes
export interface ColorPaletteDef {
  id: string;
  label: string;
  colors: string[]; // Hex codes
  description: string; // For AI Prompt
}

export const COLOR_PALETTES: ColorPaletteDef[] = [
  { 
    id: "acak", 
    label: "Acak (AI Determined)", 
    colors: ["#FF5733", "#33FF57", "#3357FF"], 
    description: "Acak (AI Determined)" 
  },
  { 
    id: "medical_blue", 
    label: "Medical Blue", 
    colors: ["#0056b3", "#ffffff", "#e6e6e6"], 
    description: "Medical Blue (Trustworthy: Blue, White, Grey)" 
  },
  { 
    id: "nature_green", 
    label: "Nature Green", 
    colors: ["#2d6a4f", "#d8f3dc", "#ffffff"], 
    description: "Nature Green (Herbal/Wellness: Green, Earth, White)" 
  },
  { 
    id: "urgent_red", 
    label: "Urgent Red", 
    colors: ["#dc2626", "#ffffff", "#000000"], 
    description: "Urgent Red (Alert/Warning: Red, White, Black)" 
  },
  { 
    id: "calm_pastel", 
    label: "Calm Pastel", 
    colors: ["#fbcfe8", "#bae6fd", "#fff1f2"], 
    description: "Calm Pastel (Maternity/Baby: Soft Pink, Blue, Cream)" 
  },
  { 
    id: "professional_dark", 
    label: "Professional Dark", 
    colors: ["#1e293b", "#cbd5e1", "#fbbf24"], 
    description: "Professional Dark (High-end: Navy, Gold, Charcoal)" 
  },
  { 
    id: "energetic_orange", 
    label: "Energetic Orange", 
    colors: ["#f97316", "#4b5563", "#ffffff"], 
    description: "Energetic Orange (Fitness/Activity: Orange, Grey, White)" 
  },
  { 
    id: "clean_grayscale", 
    label: "Clean Grayscale", 
    colors: ["#000000", "#ffffff", "#94a3b8"], 
    description: "Clean Grayscale (Minimalist: Black, White, Silver)" 
  },
  { 
    id: "vibrant_pop", 
    label: "Vibrant Pop", 
    colors: ["#facc15", "#a855f7", "#06b6d4"], 
    description: "Vibrant Pop (Youth/Engagement: Yellow, Purple, Cyan)" 
  },
  { 
    id: "royal_purple", 
    label: "Royal Purple", 
    colors: ["#7e22ce", "#fbbf24", "#ffffff"], 
    description: "Royal Purple (Premium/Wisdom: Purple, Gold, White)" 
  },
  { 
    id: "earthy_brown", 
    label: "Earthy Brown", 
    colors: ["#78350f", "#fef3c7", "#166534"], 
    description: "Earthy Brown (Organic/Natural: Brown, Beige, Green)" 
  }
];

export const IMAGE_SIZES = ["1K", "2K", "4K"];

// QUIZ TYPES
export type QuizCategory = 'Farmasi Klinis' | 'Farmasi Industri' | 'Manajemen Farmasi';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[]; // [A, B, C, D]
  correctAnswer: number; // Index 0-3
  explanation: string;
  reference: string;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  wrongCount: number;
  userAnswers: number[]; // Index of answers selected by user
  questions: QuizQuestion[];
}
