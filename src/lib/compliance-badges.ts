import { supabase } from "@/integrations/supabase/client";

interface ComplianceBadge {
  id: string;
  code: string;
  name: string;
  rule_type: string;
  rule_value: string | null;
  required_count: number;
}

/**
 * Checks all compliance badges for a user and unlocks any newly-earned ones.
 * Returns the list of newly unlocked badge names (for toast/notification).
 */
export async function checkAndUnlockComplianceBadges(userId: string): Promise<string[]> {
  // Fetch catalog, current unlocked, approved certs and total hours
  const [catalogRes, unlockedRes, certsRes, profileRes] = await Promise.all([
    supabase.from("compliance_badges").select("*"),
    supabase.from("user_compliance_badges").select("badge_id").eq("user_id", userId),
    supabase.from("certificates").select("competence,title").eq("user_id", userId).eq("status", "approved"),
    supabase.from("profiles").select("total_hours").eq("id", userId).single(),
  ]);

  const catalog = (catalogRes.data || []) as ComplianceBadge[];
  const unlockedIds = new Set((unlockedRes.data || []).map((b: any) => b.badge_id));
  const certs = (certsRes.data || []) as { competence: string; title: string }[];
  const totalHours = Number(profileRes.data?.total_hours || 0);

  const newlyUnlocked: { id: string; name: string }[] = [];

  for (const badge of catalog) {
    if (unlockedIds.has(badge.id)) continue;

    let earned = false;
    if (badge.rule_type === 'total_hours') {
      earned = totalHours >= badge.required_count;
    } else if (badge.rule_type === 'course_count') {
      earned = certs.length >= badge.required_count;
    } else if (badge.rule_type === 'category_count' && badge.rule_value) {
      const target = badge.rule_value.toLowerCase();
      const count = certs.filter(c => {
        const t = (c.title || '').toLowerCase();
        const comp = (c.competence || '').toLowerCase();
        return comp.includes(target) || t.includes(target) ||
          (target === 'lgpd' && (t.includes('lgpd') || t.includes('dados') || t.includes('privacidade'))) ||
          (target === 'anticorrupcao' && (t.includes('corrupção') || t.includes('lavagem'))) ||
          (target === 'assedio' && (t.includes('assédio') || t.includes('assedio'))) ||
          (target === 'etica' && (t.includes('ética') || t.includes('etica') || t.includes('conduta'))) ||
          (target === 'inclusiva' && (comp.includes('inclusiva') || t.includes('inclusão') || t.includes('inclusao')));
      }).length;
      earned = count >= badge.required_count;
    }

    if (earned) {
      const { error } = await supabase.from("user_compliance_badges").insert({ user_id: userId, badge_id: badge.id });
      if (!error) {
        newlyUnlocked.push({ id: badge.id, name: badge.name });
        await supabase.from("notifications").insert({
          user_id: userId,
          title: '🏅 Nova medalha de Compliance!',
          message: `Você desbloqueou: ${badge.name}`,
          type: 'success',
        });
      }
    }
  }

  return newlyUnlocked.map(b => b.name);
}
