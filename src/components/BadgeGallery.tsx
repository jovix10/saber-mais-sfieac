import { motion } from "framer-motion";
import { Compass, Flame, Award, Crown, Lock } from "lucide-react";
import { mockBadges, type Badge } from "@/lib/mock-data";

const badgeIcons: Record<string, React.ElementType> = {
  compass: Compass,
  flame: Flame,
  award: Award,
  crown: Crown,
};

interface BadgeGalleryProps {
  badges?: Badge[];
}

export function BadgeGallery({ badges }: BadgeGalleryProps) {
  const items = badges || mockBadges;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((badge, i) => {
        const Icon = badgeIcons[badge.icon] || Award;
        return (
          <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            className={`glass-card rounded-2xl p-6 text-center transition-all ${badge.unlocked ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-50 grayscale'}`}>
            <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center mb-3 ${badge.unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {badge.unlocked ? <Icon className="h-8 w-8" /> : <Lock className="h-6 w-6" />}
            </div>
            <h4 className="font-heading font-bold text-sm text-foreground">{badge.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
            {badge.unlocked && (
              <span className="inline-block mt-3 px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium">✓ Desbloqueado</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
