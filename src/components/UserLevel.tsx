import { motion } from "framer-motion";
import { Shield, Sparkles } from "lucide-react";

const LEVELS = [
  { name: "Novato", minHours: 0, maxHours: 5, color: "from-slate-400 to-slate-500", bg: "bg-slate-500/10 text-slate-600" },
  { name: "Explorador", minHours: 5, maxHours: 10, color: "from-blue-400 to-blue-600", bg: "bg-blue-500/10 text-blue-600" },
  { name: "Dedicado", minHours: 10, maxHours: 20, color: "from-violet-400 to-violet-600", bg: "bg-violet-500/10 text-violet-600" },
  { name: "Especialista", minHours: 20, maxHours: 40, color: "from-amber-400 to-amber-600", bg: "bg-amber-500/10 text-amber-600" },
  { name: "Mestre", minHours: 40, maxHours: 80, color: "from-red-400 to-red-600", bg: "bg-red-500/10 text-red-600" },
  { name: "Lenda", minHours: 80, maxHours: 999, color: "from-pink-400 to-pink-600", bg: "bg-pink-500/10 text-pink-600" },
];

interface UserLevelProps {
  hours: number;
  compact?: boolean;
}

export function UserLevel({ hours, compact = false }: UserLevelProps) {
  const level = [...LEVELS].reverse().find(l => hours >= l.minHours) || LEVELS[0];
  const levelIndex = LEVELS.findIndex(l => l.name === level.name);
  const nextLevel = LEVELS[levelIndex + 1];
  const progress = nextLevel
    ? ((hours - level.minHours) / (nextLevel.maxHours - level.minHours)) * 100
    : 100;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${level.bg}`}>
        <Shield className="h-3 w-3" />
        Nv.{levelIndex + 1} {level.name}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card rounded-xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center shadow-lg`}>
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-heading font-bold text-foreground">Nível {levelIndex + 1}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${level.bg}`}>
              {level.name}
            </span>
          </div>
          {nextLevel ? (
            <p className="text-[10px] text-muted-foreground">
              {nextLevel.minHours - hours}h para Nível {levelIndex + 2} ({nextLevel.name})
            </p>
          ) : (
            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Nível máximo!
            </p>
          )}
        </div>
      </div>
      {nextLevel && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${level.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1.2, delay: 0.6 }}
          />
        </div>
      )}
    </motion.div>
  );
}
