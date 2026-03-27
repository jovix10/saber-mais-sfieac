import { AppLayout } from "@/components/AppLayout";
import { ProgressCard } from "@/components/ProgressCard";
import { CourseCarousel } from "@/components/CourseCarousel";
import { AchievementFeed } from "@/components/AchievementFeed";
import { mockUser, mockBadges } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Award, BookOpen, Clock } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { label: 'Certificados', value: '3', icon: BookOpen, color: 'text-blue-500' },
    { label: 'Badges', value: mockBadges.filter(b => b.unlocked).length.toString(), icon: Award, color: 'text-amber-500' },
    { label: 'Horas este mês', value: '6h', icon: Clock, color: 'text-emerald-500' },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <ProgressCard unit={mockUser.unit} currentHours={mockUser.totalHours} userName={mockUser.name.split(' ')[0]} />

        <div className="grid grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="font-heading font-bold text-xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <CourseCarousel />

        <AchievementFeed />
      </div>
    </AppLayout>
  );
}
