import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X } from "lucide-react";
import confetti from "canvas-confetti";

interface AchievementNotif {
  id: string;
  title: string;
  message: string;
}

export function AchievementPopup() {
  const { user } = useAuth();
  const [popup, setPopup] = useState<AchievementNotif | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('achievement-popup')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const notif = payload.new as any;
        if (notif.type === 'achievement' || notif.type === 'success') {
          setPopup({ id: notif.id, title: notif.title, message: notif.message });
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF6B35', '#00D4AA', '#4F46E5'],
          });
          setTimeout(() => setPopup(null), 5000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="glass-card-dark rounded-2xl p-5 shadow-2xl border border-amber-500/30">
            <button onClick={() => setPopup(null)} className="absolute top-2 right-2 text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                <Award className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-heading font-bold text-white text-sm">{popup.title}</p>
                <p className="text-white/70 text-xs mt-1">{popup.message}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
