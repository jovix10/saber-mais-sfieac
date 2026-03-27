import { AppLayout } from "@/components/AppLayout";
import { ProgressCard } from "@/components/ProgressCard";
import { CourseCarousel } from "@/components/CourseCarousel";
import { AchievementFeed } from "@/components/AchievementFeed";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Award, BookOpen, Clock } from "lucide-react";
import type { Unit } from "@/lib/mock-data";

export default function Dashboard() {
  const { profile } = useAuth();
  const [certCount, setCertCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "approved").then(({ count }) => {
      setCertCount(count ?? 0);
    });
    // Badge count based on hours
    const hours = Number(profile.total_hours) || 0;
    let badges = 0;
    if (hours >= 5) badges++;
    if (hours >= 10) badges++;
    if (hours >= 20) badges++;
    if (hours >= 40) badges++;
    setBadgeCount(badges);
  }, [profile]);

  if (!profile) return null;

  const stats = [
    { label: 'Certificados', value: certCount.toString(), icon: BookOpen, color: 'text-blue-500' },
    { label: 'Badges', value: badgeCount.toString(), icon: Award, color: 'text-amber-500' },
    { label: 'Horas Total', value: `${Number(profile.total_hours)}h`, icon: Clock, color: 'text-emerald-500' },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <ProgressCard unit={profile.unit as Unit} currentHours={Number(profile.total_hours)} userName={profile.name.split(' ')[0]} />

        <div className="grid grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="glass-card rounded-xl p-4 text-center">
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
