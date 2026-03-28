export type Unit = 'SESI' | 'SENAI' | 'FIEAC' | 'IEL';
export type Competence = 'Digital' | 'Ambiental' | 'Inclusiva' | 'Outros';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  unit: Unit;
  area: string;
  totalHours: number;
  avatarUrl?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredHours: number;
  unlocked: boolean;
}

export const unitGoals: Record<Unit, number> = {
  SENAI: 40,
  SESI: 20,
  FIEAC: 20,
  IEL: 20,
};

export const unitColors: Record<Unit, string> = {
  SESI: 'unit-sesi',
  SENAI: 'unit-senai',
  FIEAC: 'unit-fieac',
  IEL: 'unit-iel',
};
