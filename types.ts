
export enum View {
  SWAMEDIKASI = 'swamedikasi',
  DRUG_INFO = 'drug_info',
  INTERACTION = 'interaction',
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
  "Profesional Medis",
  "Friendly Edukatif",
  "Minimalis",
  "Colorful",
  "Corporate Clean"
];

export const IMAGE_SIZES = ["1K", "2K", "4K"];
