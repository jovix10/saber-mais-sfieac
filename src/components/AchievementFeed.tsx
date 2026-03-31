import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Flame } from "lucide-react";

interface Achievement {
  id: string;
  user_name: string;
  user_unit: string;
  description: string;
  created_at: string;
}

const EMOJIS = ['🏅', '🎯', '⭐', '🏆', '💪', '🔥', '🚀'];

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
          <Sparkles className="h-5 w-5 text-amber-500" /> Conquistas Recentes
        </h3>
        {achievements.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {achievements.length} conquistas
          </span>
        )}
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma conquista registrada ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Complete cursos para aparecer aqui!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {achievements.map((a, i) => {
              const isNew = a.id === newId;
              const emoji = EMOJIS[i % EMOJIS.length];
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    ...(isNew ? { boxShadow: '0 0 0 2px hsl(45, 93%, 47%)' } : {}),
                  }}
                  exit={{ opacity: 0, x: 30, scale: 0.9 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isNew ? 'bg-amber-500/10 border border-amber-400/30' : 'bg-muted/40 hover:bg-muted/70'}`}
                >
                  <div className={`h-10 w-10 rounded-full unit-badge-${a.user_unit.toLowerCase()} flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ring-2 ring-white/20`}>
                    {a.user_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-bold">{a.user_name}</span>{' '}
                      <span className="text-muted-foreground">{a.description}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded unit-badge-${a.user_unit.toLowerCase()}`}>
                        {a.user_unit}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{getTimeAgo(a.created_at)}</span>
                    </div>
                  </div>
                  <span className="text-xl shrink-0">{isNew ? '🎉' : emoji}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
