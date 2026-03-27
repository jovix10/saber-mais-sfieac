import { AppLayout } from "@/components/AppLayout";
import { BadgeGallery } from "@/components/BadgeGallery";
import { useAuth } from "@/hooks/useAuth";
import { mockBadges } from "@/lib/mock-data";

export default function Badges() {
  const { profile } = useAuth();
  const hours = Number(profile?.total_hours) || 0;

  const badges = mockBadges.map(b => ({
    ...b,
    unlocked: hours >= b.requiredHours,
  }));

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Conquistas</h2>
          <p className="text-muted-foreground text-sm">
            {unlockedCount} de {badges.length} badges desbloqueados
          </p>
        </div>
        <BadgeGallery badges={badges} />
      </div>
    </AppLayout>
  );
}
