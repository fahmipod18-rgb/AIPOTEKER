
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
