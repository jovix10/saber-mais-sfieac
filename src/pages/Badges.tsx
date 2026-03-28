import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Lock, Compass, Flame, Award, Crown, Star, Gem, Zap, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const allBadges = [
  { id: '1', name: 'Explorador', description: 'Complete 5 horas de capacitação', icon: Compass, requiredHours: 5, color: '#3B82F6' },
  { id: '2', name: 'Dedicado', description: 'Complete 10 horas de capacitação', icon: Flame, requiredHours: 10, color: '#8B5CF6' },
  { id: '3', name: 'Especialista', description: 'Complete 20 horas de capacitação', icon: Award, requiredHours: 20, color: '#F59E0B' },
  { id: '4', name: 'Mestre do Saber', description: 'Complete 40 horas de capacitação', icon: Crown, requiredHours: 40, color: '#EF4444' },
  { id: '5', name: 'Lenda', description: 'Complete 80 horas de capacitação', icon: Star, requiredHours: 80, color: '#EC4899' },
  { id: '6', name: 'Curioso Digital', description: 'Complete 3 cursos na competência Digital', icon: Zap, requiredHours: -1, color: '#06B6D4' },
  { id: '7', name: 'Guardião Verde', description: 'Complete 3 cursos na competência Ambiental', icon: Heart, requiredHours: -1, color: '#10B981' },
  { id: '8', name: 'Diversidade+', description: 'Complete 3 cursos na competência Inclusiva', icon: Gem, requiredHours: -1, color: '#A855F7' },
];

export default function Badges() {
  const { profile, user } = useAuth();
  const [competenceCounts, setCompetenceCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("certificates").select("competence").eq("user_id", user.id).eq("status", "approved").then(({ data }) => {
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((c: any) => { counts[c.competence] = (counts[c.competence] || 0) + 1; });
        setCompetenceCounts(counts);
      }
    });
  }, [user]);

  const hours = Number(profile?.total_hours) || 0;

  const isUnlocked = (badge: typeof allBadges[0]) => {
    if (badge.requiredHours > 0) return hours >= badge.requiredHours;
    if (badge.id === '6') return (competenceCounts['Digital'] || 0) >= 3;
    if (badge.id === '7') return (competenceCounts['Ambiental'] || 0) >= 3;
    if (badge.id === '8') return (competenceCounts['Inclusiva'] || 0) >= 3;
    return false;
  };

  const unlockedCount = allBadges.filter(isUnlocked).length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">🏅 Conquistas</h2>
          <p className="text-muted-foreground text-sm">
            {unlockedCount} de {allBadges.length} badges desbloqueados
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allBadges.map((badge, i) => {
            const unlocked = isUnlocked(badge);
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`glass-card rounded-2xl p-6 text-center transition-all ${unlocked ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-40 grayscale'}`}
              >
                <div
                  className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: unlocked ? badge.color + '15' : undefined,
                    borderColor: unlocked ? badge.color : undefined,
                    borderWidth: unlocked ? 2 : 0,
                  }}
                >
                  {unlocked ? <Icon className="h-8 w-8" style={{ color: badge.color }} /> : <Lock className="h-6 w-6 text-muted-foreground" />}
                </div>
                <h4 className="font-heading font-bold text-sm text-foreground">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                {unlocked && (
                  <span className="inline-block mt-3 px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium">✓ Desbloqueado</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
