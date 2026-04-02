import { AppLayout } from "@/components/AppLayout";
import { ProgressCard } from "@/components/ProgressCard";
import { CourseCarousel } from "@/components/CourseCarousel";
import { AchievementFeed } from "@/components/AchievementFeed";
import { LearningTrailMap } from "@/components/LearningTrailMap";
import { DailyStreak } from "@/components/DailyStreak";
import { UserLevel } from "@/components/UserLevel";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Award, BookOpen, Clock, Trophy, Star, TrendingUp, ClipboardList, CheckCircle, Upload as UploadIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Unit } from "@/lib/mock-data";

interface TeamTask {
  id: string;
  title: string;
  description: string;
  task_type: string;
  status: string;
  due_date: string | null;
  evidence_url: string | null;
  evidence_note: string | null;
  assigned_by: string;
}

const BADGE_LEVELS = [
  { name: 'Explorador', hours: 5 },
  { name: 'Dedicado', hours: 10 },
  { name: 'Especialista', hours: 20 },
  { name: 'Mestre do Saber', hours: 40 },
  { name: 'Lenda', hours: 80 },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [certCount, setCertCount] = useState(0);
  const [rankPosition, setRankPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "approved").then(({ count }) => {
      setCertCount(count ?? 0);
    });
    supabase.from("profiles").select("id, total_hours").eq("visible_in_ranking", true).order("total_hours", { ascending: false }).then(({ data }) => {
      if (data) {
        const pos = data.findIndex(p => p.id === profile.id);
        setRankPosition(pos >= 0 ? pos + 1 : null);
      }
    });
  }, [profile]);

  if (!profile) return null;

  const hours = Number(profile.total_hours) || 0;
  const badgeCount = BADGE_LEVELS.filter(b => hours >= b.hours).length;
  const currentBadge = [...BADGE_LEVELS].reverse().find(b => hours >= b.hours);
  const nextBadge = BADGE_LEVELS.find(b => hours < b.hours);

  const stats = [
    { label: 'Certificados', value: certCount.toString(), icon: BookOpen, color: 'bg-blue-500/10 text-blue-600', onClick: () => navigate('/certificates') },
    { label: 'Conquistas', value: `${badgeCount}/${BADGE_LEVELS.length}`, icon: Award, color: 'bg-amber-500/10 text-amber-600', onClick: () => navigate('/badges') },
    { label: 'Horas Total', value: `${hours}h`, icon: Clock, color: 'bg-emerald-500/10 text-emerald-600', onClick: undefined },
    { label: 'Ranking', value: rankPosition ? `#${rankPosition}` : '—', icon: Trophy, color: 'bg-violet-500/10 text-violet-600', onClick: () => navigate('/leaderboard') },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <ProgressCard unit={profile.unit as Unit} currentHours={hours} userName={profile.name.split(' ')[0]} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              onClick={s.onClick}
              className={`glass-card rounded-xl p-4 text-center ${s.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            >
              <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="font-heading font-bold text-xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Level + Daily streak row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UserLevel hours={hours} />
          <DailyStreak />
        </div>

        {/* Next badge teaser */}
        {nextBadge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-xl p-4 flex items-center gap-4 border-l-4"
            style={{ borderLeftColor: 'hsl(var(--accent))' }}
          >
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Star className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold text-foreground">
                Próxima conquista: {nextBadge.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Faltam <span className="font-bold text-foreground">{nextBadge.hours - hours}h</span> para desbloquear
              </p>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden max-w-xs">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((hours - (currentBadge?.hours || 0)) / (nextBadge.hours - (currentBadge?.hours || 0))) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
            </div>
            <div className="text-2xl shrink-0">🔒</div>
          </motion.div>
        )}

        {currentBadge && !nextBadge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-xl p-4 flex items-center gap-4 border-l-4 border-l-amber-500"
          >
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-sm font-heading font-bold text-foreground">Nível Máximo: {currentBadge.name}</p>
              <p className="text-xs text-amber-600 font-medium">Você é uma lenda do Saber+!</p>
            </div>
          </motion.div>
        )}

        {/* Learning trail map */}
        <LearningTrailMap />

        <CourseCarousel />
        <AchievementFeed />
      </div>
    </AppLayout>
  );
}
