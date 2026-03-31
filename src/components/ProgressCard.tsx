import { motion } from "framer-motion";
import { type Unit } from "@/lib/mock-data";
import { Target, Flame, Trophy, Zap, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

interface ProgressCardProps {
  unit: Unit;
  currentHours: number;
  userName: string;
}

const MILESTONES = [
  { pct: 25, label: "Aquecendo!", emoji: "🔥", icon: Flame },
  { pct: 50, label: "Metade do caminho!", emoji: "⚡", icon: Zap },
  { pct: 75, label: "Quase lá!", emoji: "🚀", icon: TrendingUp },
  { pct: 100, label: "Meta atingida!", emoji: "🏆", icon: Trophy },
];

export function ProgressCard({ unit, currentHours, userName }: ProgressCardProps) {
  const [goal, setGoal] = useState(20);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    supabase.from("unit_goals").select("goal_hours").eq("unit", unit).single().then(({ data }) => {
      if (data) setGoal(data.goal_hours);
    });
  }, [unit]);

  const percentage = Math.min((currentHours / goal) * 100, 100);
  const exceeded = currentHours > goal;
  const remaining = Math.max(goal - currentHours, 0);
  const currentMilestone = [...MILESTONES].reverse().find(m => percentage >= m.pct);
  const nextMilestone = MILESTONES.find(m => percentage < m.pct);

  // Confetti celebration when reaching 100%
  useEffect(() => {
    if (percentage >= 100 && !celebrated) {
      setCelebrated(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#1e3a5f', '#3b82f6', '#f59e0b', '#10b981'] });
    }
  }, [percentage, celebrated]);

  const unitColorMap: Record<string, string> = {
    SESI: 'hsl(210, 90%, 50%)',
    SENAI: 'hsl(0, 78%, 52%)',
    FIEAC: 'hsl(220, 62%, 24%)',
    IEL: 'hsl(152, 58%, 38%)',
  };

  const progressColor = unitColorMap[unit] || 'hsl(var(--primary))';

  // Circular progress for mobile
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 md:p-8 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-[0.04]" style={{ background: progressColor }} />
      <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full opacity-[0.03]" style={{ background: progressColor }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <p className="text-muted-foreground text-sm">
            Olá, <span className="font-semibold text-foreground">{userName}</span> 👋
          </p>
          <h2 className="font-heading font-bold text-lg md:text-2xl text-foreground mt-0.5">
            Progresso {new Date().getFullYear()}
          </h2>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold unit-badge-${unit.toLowerCase()} shadow-sm`}>
          {unit}
        </div>
      </div>

      {/* Mobile: Circular progress + info / Desktop: Bar progress */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
        {/* Circular progress (mobile) */}
        <div className="flex items-center gap-5 md:hidden">
          <div className="relative shrink-0">
            <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <motion.circle
                cx="64" cy="64" r={radius} fill="none"
                stroke={progressColor}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading font-bold text-2xl text-foreground">{currentHours}h</span>
              <span className="text-[10px] text-muted-foreground">de {goal}h</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {currentMilestone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600"
              >
                <span>{currentMilestone.emoji}</span> {currentMilestone.label}
              </motion.div>
            )}
            {remaining > 0 ? (
              <p className="text-xs text-muted-foreground">
                Faltam <span className="font-bold text-foreground">{remaining}h</span> para sua meta
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-600">
                🎉 Parabéns! Meta superada em +{currentHours - goal}h
              </p>
            )}
            {nextMilestone && (
              <p className="text-[10px] text-muted-foreground">
                Próximo marco: {nextMilestone.label} ({Math.ceil(goal * nextMilestone.pct / 100)}h)
              </p>
            )}
          </div>
        </div>

        {/* Bar progress (desktop) */}
        <div className="hidden md:block flex-1 w-full">
          <div className="flex items-end justify-between mb-3">
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Meta: <span className="font-semibold text-foreground">{goal}h</span>
                {exceeded && <span className="ml-2 text-emerald-600 font-semibold">(+{currentHours - goal}h excedidas!)</span>}
              </span>
              {currentMilestone && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600"
                >
                  {currentMilestone.emoji} {currentMilestone.label}
                </motion.span>
              )}
            </div>
            <span className="font-heading font-bold text-3xl text-foreground">{currentHours}h</span>
          </div>

          {/* Progress bar with milestone markers */}
          <div className="relative">
            <div className="h-5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full relative"
                style={{ background: `linear-gradient(90deg, ${progressColor}, ${progressColor}dd)` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                {percentage > 8 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-sm">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </motion.div>
            </div>
            {/* Milestone dots */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center">
              {MILESTONES.slice(0, -1).map(m => (
                <div
                  key={m.pct}
                  className="absolute h-5 w-0.5 bg-white/40"
                  style={{ left: `${m.pct}%` }}
                  title={m.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-2">
            {MILESTONES.map(m => (
              <span
                key={m.pct}
                className={`text-[10px] ${percentage >= m.pct ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                style={{ width: '25%', textAlign: m.pct === 100 ? 'right' : m.pct === 25 ? 'left' : 'center' }}
              >
                {m.emoji} {m.pct}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
