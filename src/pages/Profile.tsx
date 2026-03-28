import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const BADGE_LEVELS = [
  { name: 'Explorador', hours: 5, color: '#3B82F6', ring: 'ring-blue-500' },
  { name: 'Dedicado', hours: 10, color: '#8B5CF6', ring: 'ring-violet-500' },
  { name: 'Especialista', hours: 20, color: '#F59E0B', ring: 'ring-amber-500' },
  { name: 'Mestre do Saber', hours: 40, color: '#EF4444', ring: 'ring-red-500' },
  { name: 'Lenda', hours: 80, color: '#EC4899', ring: 'ring-pink-500' },
];

export default function Profile() {
  const { profile, refreshProfile, user } = useAuth();
  const [uploading, setUploading] = useState(false);

  if (!profile || !user) return null;

  const hours = Number(profile.total_hours) || 0;
  const currentLevel = BADGE_LEVELS.filter(b => hours >= b.hours).pop();
  const nextLevel = BADGE_LEVELS.find(b => hours < b.hours);
  const ringColor = currentLevel?.ring || 'ring-muted';
  const ringGradient = currentLevel?.color || '#94A3B8';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error("Erro ao enviar foto"); setUploading(false); return; }
    
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    await refreshProfile();
    toast.success("Foto atualizada!");
    setUploading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-8 text-center">
          {/* Avatar with achievement ring */}
          <div className="relative inline-block mb-4">
            <div
              className={`h-28 w-28 rounded-full p-1 mx-auto`}
              style={{
                background: `conic-gradient(${ringGradient} ${Math.min((hours / (nextLevel?.hours || 100)) * 100, 100)}%, transparent 0)`,
                padding: '4px',
              }}
            >
              <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <span className="font-heading font-bold text-3xl text-foreground">{profile.name.charAt(0)}</span>
                )}
              </div>
            </div>
            <label className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
              <Camera className="h-4 w-4 text-primary-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>

          <h2 className="font-heading font-bold text-xl text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium unit-badge-${profile.unit.toLowerCase()}`}>{profile.unit}</span>
            {profile.area && <span className="text-xs text-muted-foreground">{profile.area}</span>}
          </div>

          {/* Level info */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50">
            {currentLevel ? (
              <div>
                <p className="text-sm font-heading font-semibold text-foreground">
                  🏅 {currentLevel.name}
                </p>
                {nextLevel && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Faltam <span className="font-bold text-foreground">{nextLevel.hours - hours}h</span> para "{nextLevel.name}"
                    </p>
                    <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: nextLevel.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((hours - (currentLevel.hours)) / (nextLevel.hours - currentLevel.hours)) * 100}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                )}
                {!nextLevel && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">🎉 Nível máximo atingido!</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">
                  Faltam <span className="font-bold text-foreground">{5 - hours}h</span> para "Explorador"
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="font-heading font-bold text-2xl text-foreground">{hours}h</p>
            <p className="text-xs text-muted-foreground">Total de Horas</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="font-heading font-bold text-2xl text-foreground">{BADGE_LEVELS.filter(b => hours >= b.hours).length}</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="font-heading font-bold text-2xl text-foreground">{profile.unit}</p>
            <p className="text-xs text-muted-foreground">Unidade</p>
          </div>
        </div>

        {/* All badges */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4">Suas Conquistas</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {BADGE_LEVELS.map(b => {
              const unlocked = hours >= b.hours;
              return (
                <motion.div
                  key={b.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-xl p-3 text-center transition-all ${unlocked ? 'glass-card hover:shadow-lg' : 'opacity-40 bg-muted/30 rounded-xl'}`}
                >
                  <div
                    className={`h-12 w-12 mx-auto rounded-full flex items-center justify-center mb-2 ${unlocked ? 'shadow-lg' : ''}`}
                    style={{ backgroundColor: unlocked ? b.color + '20' : undefined, borderColor: unlocked ? b.color : undefined, borderWidth: unlocked ? 2 : 0 }}
                  >
                    <span className="text-lg">{unlocked ? '🏅' : '🔒'}</span>
                  </div>
                  <p className="text-xs font-heading font-semibold text-foreground">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.hours}h</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
