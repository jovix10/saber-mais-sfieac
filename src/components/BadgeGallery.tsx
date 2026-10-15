import { motion } from "framer-motion";
import { 
  LockFill, 
  Award, 
  Compass, 
  LightningCharge, 
  TrophyFill, 
  CheckCircleFill 
} from "react-bootstrap-icons";

const badgeIcons: Record<string, React.ElementType> = {
  compass: Compass,
  flame: LightningCharge,
  award: Award,
  crown: TrophyFill,
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredHours: number;
  unlocked: boolean;
}

interface BadgeGalleryProps {
  badges?: Badge[];
  currentHours?: number;
}

export function BadgeGallery({ badges = [], currentHours = 0 }: BadgeGalleryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {badges.map((badge, i) => {
        const Icon = badgeIcons[badge.icon] || Award;
        const progressPct = Math.min(Math.round((currentHours / (badge.requiredHours || 1)) * 100), 100);

        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
              badge.unlocked
                ? 'bg-card/90 border-border/80 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                : 'bg-card/30 border-border/40 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  badge.unlocked 
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {badge.unlocked ? <Icon className="h-6 w-6" /> : <LockFill className="h-5 w-5" />}
                </div>

                {badge.unlocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircleFill className="h-3 w-3" /> Conquistado
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Meta: {badge.requiredHours}h
                  </span>
                )}
              </div>

              <h4 className="font-heading font-bold text-sm text-foreground">{badge.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{badge.description}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-border/40">
              {!badge.unlocked ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Progresso</span>
                    <span className="font-medium text-foreground">{progressPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/70 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">Requisito concluído</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}