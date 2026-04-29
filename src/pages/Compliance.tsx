import { AppLayout } from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, ExternalLink, Scale, FileCheck, AlertTriangle, Lock, Eye, Gavel, BookOpen, Calendar, Trophy, Star, Users, GraduationCap, Clock, Award, Lightbulb, Heart, Sparkles, Crown, Medal, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  shield: ShieldCheck, lock: Lock, gavel: Gavel, clock: Clock,
  'graduation-cap': GraduationCap, 'shield-check': ShieldCheck, scale: Scale,
  users: Users, sparkles: Sparkles, heart: Heart,
};

const monthNames = ['','Janeiro Branco','Fevereiro','Março','Abril Verde','Maio','Junho','Julho','Agosto','Setembro','Outubro Rosa','Novembro Azul','Dezembro'];
const monthColors: Record<number, string> = {
  1: 'from-slate-100 to-white border-slate-300',
  4: 'from-emerald-100 to-emerald-50 border-emerald-300',
  10: 'from-pink-100 to-rose-50 border-pink-300',
  11: 'from-blue-100 to-sky-50 border-blue-300',
};

const categoryLabels: Record<string, { label: string; color: string; icon: any }> = {
  introdutorio: { label: 'Introdutório', color: 'bg-blue-500/10 text-blue-700', icon: Lightbulb },
  obrigatorio: { label: 'Obrigatório', color: 'bg-red-500/10 text-red-700', icon: ShieldAlert },
  campanha: { label: 'Campanha', color: 'bg-purple-500/10 text-purple-700', icon: Calendar },
};

interface Course {
  id: string; title: string; description: string | null; competence: string; hours: number;
  provider: string | null; external_url: string; image_url: string | null;
  compliance_category: string | null; campaign_month: number | null;
}
interface BadgeRow {
  id: string; code: string; name: string; description: string; icon: string; color: string;
  rule_type: string; rule_value: string | null; required_count: number;
}
interface RankRow {
  user_id: string; name: string; avatar_url: string | null; medals: number;
  total_hours: number; latest_cert_at: string | null;
}

export default function Compliance() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [evalCourse, setEvalCourse] = useState<Course | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [evaluatedIds, setEvaluatedIds] = useState<Set<string>>(new Set());

  const fetchAll = async () => {
    if (!user) return;
    const [coursesRes, badgesRes, mineRes, evalRes] = await Promise.all([
      supabase.from("courses").select("*").eq("active", true).eq("is_compliance", true).order("created_at", { ascending: false }),
      supabase.from("compliance_badges").select("*"),
      supabase.from("user_compliance_badges").select("badge_id").eq("user_id", user.id),
      supabase.from("course_evaluations").select("course_id").eq("user_id", user.id),
    ]);
    if (coursesRes.data) setCourses(coursesRes.data as Course[]);
    if (badgesRes.data) setBadges(badgesRes.data as BadgeRow[]);
    if (mineRes.data) setUnlockedIds(new Set(mineRes.data.map((r: any) => r.badge_id)));
    if (evalRes.data) setEvaluatedIds(new Set(evalRes.data.map((r: any) => r.course_id).filter(Boolean)));

    // Ranking: aggregate medals per user, join with profiles
    const { data: allUnlocks } = await supabase.from("user_compliance_badges").select("user_id, unlocked_at");
    const { data: profs } = await supabase.from("profiles").select("id, name, avatar_url, total_hours, visible_in_ranking");
    const { data: certs } = await supabase.from("certificates").select("user_id, created_at").eq("status", "approved");

    if (allUnlocks && profs) {
      const counts: Record<string, { medals: number; latest: string }> = {};
      allUnlocks.forEach((u: any) => {
        if (!counts[u.user_id]) counts[u.user_id] = { medals: 0, latest: u.unlocked_at };
        counts[u.user_id].medals++;
        if (u.unlocked_at > counts[u.user_id].latest) counts[u.user_id].latest = u.unlocked_at;
      });
      const latestCert: Record<string, string> = {};
      (certs || []).forEach((c: any) => {
        if (!latestCert[c.user_id] || c.created_at > latestCert[c.user_id]) latestCert[c.user_id] = c.created_at;
      });
      const rows: RankRow[] = profs
        .filter((p: any) => p.visible_in_ranking !== false && counts[p.id])
        .map((p: any) => ({
          user_id: p.id, name: p.name, avatar_url: p.avatar_url,
          medals: counts[p.id].medals, total_hours: Number(p.total_hours || 0),
          latest_cert_at: latestCert[p.id] || counts[p.id].latest,
        }))
        .sort((a, b) => {
          // Tiebreakers: medals → latest cert (earlier wins) → total hours
          if (b.medals !== a.medals) return b.medals - a.medals;
          if (a.latest_cert_at && b.latest_cert_at && a.latest_cert_at !== b.latest_cert_at)
            return a.latest_cert_at.localeCompare(b.latest_cert_at);
          return b.total_hours - a.total_hours;
        })
        .slice(0, 5);
      setRanking(rows);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const submitEvaluation = async () => {
    if (!user || !evalCourse || rating === 0) { toast.error("Selecione uma nota"); return; }
    const { error } = await supabase.from("course_evaluations").insert({
      user_id: user.id, course_id: evalCourse.id, rating, comment,
    });
    if (error) { toast.error("Erro ao enviar avaliação"); return; }
    toast.success("Obrigado pelo feedback! 🌟");
    setEvaluatedIds(new Set([...evaluatedIds, evalCourse.id]));
    setEvalCourse(null); setRating(0); setComment("");
  };

  const obrigatorios = courses.filter(c => c.compliance_category === 'obrigatorio');
  const introdutorios = courses.filter(c => c.compliance_category === 'introdutorio');
  const campanhas = courses.filter(c => c.compliance_category === 'campanha');
  const semCategoria = courses.filter(c => !c.compliance_category);

  const renderCourseCard = (course: Course, i: number) => {
    const cat = course.compliance_category ? categoryLabels[course.compliance_category] : null;
    const CatIcon = cat?.icon || ShieldCheck;
    return (
      <motion.div
        key={course.id}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
        className="glass-card rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all group"
      >
        <a href={course.external_url} target="_blank" rel="noopener noreferrer" className="block">
          {course.image_url ? (
            <img src={course.image_url} alt={course.title} className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-amber-500/20 via-orange-400/10 to-red-500/20 flex items-center justify-center">
              <CatIcon className="h-12 w-12 text-foreground/20" />
            </div>
          )}
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading font-bold text-sm text-foreground line-clamp-2">{course.title}</h3>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {cat && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cat.color}`}>
                  <CatIcon className="h-3 w-3" /> {cat.label}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{course.hours}h</span>
              {course.provider && <span className="text-xs text-muted-foreground">· {course.provider}</span>}
            </div>
          </div>
        </a>
        <div className="px-4 pb-4">
          {evaluatedIds.has(course.id) ? (
            <div className="text-xs text-emerald-600 flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> Avaliado</div>
          ) : (
            <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => setEvalCourse(course)}>
              <Star className="h-3 w-3 mr-1" /> Avaliar curso
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  const campanhasByMonth: Record<number, Course[]> = {};
  campanhas.forEach(c => {
    const m = c.campaign_month || 0;
    if (!campanhasByMonth[m]) campanhasByMonth[m] = [];
    campanhasByMonth[m].push(c);
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">Trilha de Compliance 2026</h2>
            <p className="text-sm text-muted-foreground">Plano de Treinamento de Compliance · Sistema FIEAC</p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && (
          <>
            {/* Catálogo de Medalhas */}
            <section>
              <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-500" /> Medalhas de Compliance
                <span className="text-sm font-normal text-muted-foreground">
                  ({unlockedIds.size}/{badges.length} conquistadas)
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {badges.map((b, i) => {
                  const Icon = iconMap[b.icon] || ShieldCheck;
                  const unlocked = unlockedIds.has(b.id);
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className={`glass-card rounded-xl p-3 text-center transition-all ${unlocked ? 'shadow-lg hover:-translate-y-1' : 'opacity-50 grayscale'}`}
                      title={b.description}
                    >
                      <div
                        className="h-12 w-12 mx-auto rounded-xl flex items-center justify-center mb-2"
                        style={{
                          backgroundColor: unlocked ? b.color + '20' : 'hsl(var(--muted))',
                          borderWidth: unlocked ? 2 : 0, borderColor: b.color,
                        }}
                      >
                        <Icon className="h-6 w-6" style={{ color: unlocked ? b.color : undefined }} />
                      </div>
                      <p className="font-heading font-bold text-xs text-foreground leading-tight">{b.name}</p>
                      {unlocked && <p className="text-[10px] text-emerald-600 mt-1">✓ Desbloqueada</p>}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Top 5 Ranking */}
            {ranking.length > 0 && (
              <section className="glass-card rounded-2xl p-6 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5">
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Top 5 Compliance
                  <span className="text-xs font-normal text-muted-foreground">por medalhas</span>
                </h3>
                <div className="space-y-2">
                  {ranking.map((r, i) => (
                    <motion.div
                      key={r.user_id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-gradient-to-r from-amber-500/15 to-transparent' : 'bg-muted/30'}`}
                    >
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-amber-500 text-white' :
                        i === 1 ? 'bg-slate-400 text-white' :
                        i === 2 ? 'bg-orange-700 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                      </div>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.name} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.total_hours}h totais</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 font-bold">
                        <Medal className="h-4 w-4" />{r.medals}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Trilhas: Introdutório */}
            {introdutorios.length > 0 && (
              <section>
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" /> Trilha Introdutória
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {introdutorios.map(renderCourseCard)}
                </div>
              </section>
            )}

            {/* Obrigatórios */}
            {obrigatorios.length > 0 && (
              <section>
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" /> Cursos Obrigatórios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {obrigatorios.map(renderCourseCard)}
                </div>
              </section>
            )}

            {/* Campanhas mensais */}
            {campanhas.length > 0 && (
              <section>
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" /> Calendário de Campanhas
                </h3>
                <div className="space-y-6">
                  {Object.keys(campanhasByMonth).map(Number).sort((a,b)=>a-b).map(m => (
                    <div key={m} className={`rounded-2xl p-4 border-2 bg-gradient-to-br ${monthColors[m] || 'from-purple-50 to-white border-purple-200'}`}>
                      <h4 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> {monthNames[m] || `Mês ${m}`}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {campanhasByMonth[m].map(renderCourseCard)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sem categoria — fallback */}
            {semCategoria.length > 0 && (
              <section>
                <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" /> Outros Cursos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {semCategoria.map(renderCourseCard)}
                </div>
              </section>
            )}

            {courses.length === 0 && (
              <div className="text-center py-16 glass-card rounded-2xl">
                <ShieldCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum curso de compliance disponível ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">Os administradores podem cadastrar cursos no painel Admin.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Evaluation Modal */}
      <Dialog open={!!evalCourse} onOpenChange={(o) => !o && setEvalCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliação de Reação</DialogTitle>
            <DialogDescription>{evalCourse?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Como você avalia este curso?</p>
              <div className="flex gap-2 justify-center">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
                    <Star className={`h-10 w-10 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {rating <= 2 ? '😕 Pode melhorar' : rating === 3 ? '🙂 Bom' : rating === 4 ? '😃 Muito bom' : '🤩 Excelente!'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Comentário (opcional)</p>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Conte o que achou do curso..." rows={3} />
            </div>
            <Button onClick={submitEvaluation} disabled={rating === 0} className="w-full">
              Enviar avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
