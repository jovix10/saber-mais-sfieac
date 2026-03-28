import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Achievement {
  id: string;
  user_name: string;
  user_unit: string;
  description: string;
  created_at: string;
}

export function AchievementFeed() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    supabase.from("achievements").select("*").order("created_at", { ascending: false }).limit(15).then(({ data }) => {
      if (data) setAchievements(data as Achievement[]);
    });

    // Realtime
    const channel = supabase
      .channel('achievements-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'achievements',
      }, (payload) => {
        const newAch = payload.new as Achievement;
        setAchievements(prev => [newAch, ...prev.slice(0, 14)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (achievements.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" /> Conquistas Recentes
        </h3>
        <p className="text-sm text-muted-foreground">Nenhuma conquista registrada ainda</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" /> Conquistas Recentes
      </h3>
      <div className="space-y-3">
        <AnimatePresence>
          {achievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors border-l-4 border-l-amber-400/50"
            >
              <div className={`h-9 w-9 rounded-full unit-badge-${a.user_unit.toLowerCase()} flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}>
                {a.user_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  <span className="font-semibold">{a.user_name}</span>{' '}
                  <span className="text-muted-foreground">{a.description}</span>
                </p>
                <p className="text-xs text-muted-foreground">{a.user_unit} · {new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <span className="text-lg shrink-0">🏅</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
