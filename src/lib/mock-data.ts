export type Unit = 'SESI' | 'SENAI' | 'FIEAC' | 'IEL';
export type Competence = 'Digital' | 'Ambiental' | 'Inclusiva';
export type BadgeLevel = 'explorador' | 'dedicado' | 'especialista' | 'mestre';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  unit: Unit;
  area: string;
  totalHours: number;
  avatarUrl?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  title: string;
  hours: number;
  competence: Competence;
  status: 'pending' | 'approved' | 'rejected';
  fileUrl?: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: BadgeLevel;
  requiredHours: number;
  unlocked: boolean;
}

export interface Achievement {
  id: string;
  userName: string;
  userUnit: Unit;
  description: string;
  timestamp: string;
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

export const mockUser: UserProfile = {
  id: '1',
  name: 'Maria Silva',
  email: 'maria.silva@fieac.org.br',
  unit: 'SESI',
  area: 'Recursos Humanos',
  totalHours: 14,
};

export const mockLeaderboard: UserProfile[] = [
  { id: '2', name: 'Carlos Mendes', email: 'carlos@fieac.org.br', unit: 'SENAI', area: 'TI', totalHours: 52 },
  { id: '3', name: 'Ana Costa', email: 'ana@fieac.org.br', unit: 'SESI', area: 'Marketing', totalHours: 38 },
  { id: '1', name: 'Maria Silva', email: 'maria@fieac.org.br', unit: 'SESI', area: 'RH', totalHours: 14 },
  { id: '4', name: 'Pedro Lima', email: 'pedro@fieac.org.br', unit: 'FIEAC', area: 'Financeiro', totalHours: 30 },
  { id: '5', name: 'Julia Santos', email: 'julia@fieac.org.br', unit: 'IEL', area: 'Operações', totalHours: 25 },
  { id: '6', name: 'Roberto Alves', email: 'roberto@fieac.org.br', unit: 'SENAI', area: 'Engenharia', totalHours: 45 },
  { id: '7', name: 'Fernanda Oliveira', email: 'fernanda@fieac.org.br', unit: 'SESI', area: 'Educação', totalHours: 22 },
  { id: '8', name: 'Lucas Pereira', email: 'lucas@fieac.org.br', unit: 'IEL', area: 'Inovação', totalHours: 18 },
];

export const mockCertificates: Certificate[] = [
  { id: '1', userId: '1', title: 'Fundamentos de IA Generativa', hours: 4, competence: 'Digital', status: 'approved', createdAt: '2025-03-15' },
  { id: '2', userId: '1', title: 'Gestão Sustentável', hours: 6, competence: 'Ambiental', status: 'approved', createdAt: '2025-03-10' },
  { id: '3', userId: '1', title: 'Acessibilidade Digital', hours: 4, competence: 'Inclusiva', status: 'pending', createdAt: '2025-03-20' },
];

export const mockBadges: Badge[] = [
  { id: '1', name: 'Explorador', description: 'Complete 5 horas de capacitação', icon: 'compass', level: 'explorador', requiredHours: 5, unlocked: true },
  { id: '2', name: 'Dedicado', description: 'Complete 10 horas de capacitação', icon: 'flame', level: 'dedicado', requiredHours: 10, unlocked: true },
  { id: '3', name: 'Especialista', description: 'Atinja 100% da meta da unidade', icon: 'award', level: 'especialista', requiredHours: 20, unlocked: false },
  { id: '4', name: 'Mestre do Saber', description: 'Atinja 2x a meta da unidade', icon: 'crown', level: 'mestre', requiredHours: 40, unlocked: false },
];

export const mockAchievements: Achievement[] = [
  { id: '1', userName: 'Carlos Mendes', userUnit: 'SENAI', description: 'Conquistou o badge "Especialista"!', timestamp: '2 min atrás' },
  { id: '2', userName: 'Ana Costa', userUnit: 'SESI', description: 'Bateu a meta de 20h! 🎉', timestamp: '15 min atrás' },
  { id: '3', userName: 'Pedro Lima', userUnit: 'FIEAC', description: 'Enviou certificado "Liderança Ágil"', timestamp: '1h atrás' },
  { id: '4', userName: 'Julia Santos', userUnit: 'IEL', description: 'Conquistou o badge "Explorador"!', timestamp: '3h atrás' },
];

export const mockCourses = [
  { id: '1', title: 'IA Generativa para Negócios', competence: 'Digital' as Competence, hours: 8, image: '', provider: 'Coursera' },
  { id: '2', title: 'ESG e Sustentabilidade Corporativa', competence: 'Ambiental' as Competence, hours: 6, image: '', provider: 'FGV' },
  { id: '3', title: 'Diversidade e Inclusão no Trabalho', competence: 'Inclusiva' as Competence, hours: 4, image: '', provider: 'SENAI' },
  { id: '4', title: 'Transformação Digital', competence: 'Digital' as Competence, hours: 10, image: '', provider: 'Google' },
  { id: '5', title: 'Economia Circular', competence: 'Ambiental' as Competence, hours: 5, image: '', provider: 'SESI' },
  { id: '6', title: 'Acessibilidade Web', competence: 'Inclusiva' as Competence, hours: 3, image: '', provider: 'W3C' },
];
