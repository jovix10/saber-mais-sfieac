import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  Trophy, 
  CheckCircleFill, 
  ClockHistory, 
  StarFill, 
  LightningChargeFill 
} from "react-bootstrap-icons";

interface Achievement {
  id: string;
  user_name: string;
  user_unit: string;
  description: string;
  created_at: string;
}

const FEED_ICONS = [
  Award,
  Trophy,
  StarFill,
  LightningChargeFill,
  CheckCircleFill
];

export function AchievementFeed() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newId, setNewId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("achievements").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      if (data) setAchievements(data as Achievement[]);
    });

    const channel = supabase
      .channel('achievements-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'achievements',
      }, (payload) => {
        const newAch = payload.new as Achievement;
        setAchievements(prev => [newAch, ...prev.slice(0, 19)]);
        setNewId(newAch.id);
        setTimeout(() => setNewId(null), 5000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" /> Atividades Recentes
        </h3>
        {achievements.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {achievements.length} registros
          </span>
        )}
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma conquista registrada no período</p>
          <p className="text-xs text-muted-foreground mt-1">Conclua capacitações para alimentar o feed corporativo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {achievements.map((a, i) => {
              const isNew = a.id === newId;
              const IconItem = FEED_ICONS[i % FEED_ICONS.length];
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    ...(isNew ? { boxShadow: '0 0 0 2px hsl(var(--primary))' } : {}),
                  }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isNew ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-border/50 hover:bg-muted/40'
                  }`}
                >
                  <div className={`h-9 w-9 rounded-full unit-badge-${a.user_unit.toLowerCase()} flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}>
                    {a.user_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{a.user_name}</span>{' '}
                      <span className="text-muted-foreground text-xs sm:text-sm">{a.description}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium unit-badge-${a.user_unit.toLowerCase()}`}>
                        {a.user_unit}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ClockHistory className="h-2.5 w-2.5" />
                        {getTimeAgo(a.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
                    <IconItem className="h-4 w-4 text-primary" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}