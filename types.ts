// types.ts
// This file centralizes all major type definitions for the application.

// From tarefas.ts
export type TaskCategory = 'Física' | 'Mental' | 'Financeira' | 'Familiar' | 'Profissional' | 'Social' | 'Espiritual' | 'Preventiva' | 'Pessoal';

export interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    category: TaskCategory | '';
    priority: 'low' | 'medium' | 'high';
    dueDate: string; // YYYY-MM-DD
    startTime?: string; // HH:MM
    endTime?: string;   // HH:MM
    reminder?: string; // in minutes: '5', '15', '30', '60'
    reminderSent?: boolean;
}

// From financeira.ts
export interface Asset {
    id: string;
    name: string;
    purchaseDate: string; // YYYY-MM-DD
}

// From reflexoes.ts
export interface Reflection {
    id: string;
    category: string;
    title: string;
    text: string;
    date: string; // YYYY-MM-DD
    timestamp: number;
}

// From utils.ts
export interface GamificationProfile {
    level: number;
    ps: number;
    nextLevelPs: number;
}

export interface Streak {
    current: number;
    longest: number;
    lastActivityDate: string; // YYYY-MM-DD
}

// From preventiva.ts
export interface Supplement { id: string; name: string; dosage: string; frequency: string; time: string; notes: string; }
export interface Diagnostic { id: string; enabled: boolean; date: string; type: string; medication: string; notes: string; severity: string; }
export interface UserProfile { birthDate: string; sex: 'male' | 'female'; }
export interface IndicatorEntry { value: number; date: string; }

// From modals.ts
export interface ContractData {
    name: string;
    birthdate: string;
    commitment: string;
    period: string;
    goals: string;
    signature: string;
    date: string;
}

// From tts.ts
export interface TTSSettings {
    voiceURI: string | null;
    rate: number;
    pitch: number;
}
