import { AppLayout } from "@/components/AppLayout";
import { BadgeGallery } from "@/components/BadgeGallery";
import { mockUser, unitGoals, mockBadges } from "@/lib/mock-data";

export default function Badges() {
  const unlockedCount = mockBadges.filter(b => b.unlocked).length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Conquistas</h2>
          <p className="text-muted-foreground text-sm">
            {unlockedCount} de {mockBadges.length} badges desbloqueados
          </p>
        </div>
        <BadgeGallery />
      </div>
    </AppLayout>
  );
}
