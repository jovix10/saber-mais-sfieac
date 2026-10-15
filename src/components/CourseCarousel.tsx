import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Leaf, Users, Clock, ExternalLink, Puzzle, Shield, 
  Monitor, Brain, Lightbulb, GraduationCap, Rocket, Target, Zap, 
  Flame, CheckCircle2, Loader2, ChevronLeft, ChevronRight, LayoutGrid, Rows3 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const competenceIcons: Record<string, React.ElementType> = {
  Digital: Monitor,
  Ambiental: Leaf,
  Inclusiva: Users,
  Compliance: Shield,
  Outros: Puzzle,
};

const competenceColors: Record<string, string> = {
  Digital: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  Ambiental: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  Inclusiva: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  Compliance: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
  Outros: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
};

const dynamicGradients = [
  'from-blue-500/20 via-cyan-400/10 to-sky-500/20',
  'from-emerald-500/20 via-teal-400/10 to-green-500/20',
  'from-violet-500/20 via-purple-400/10 to-indigo-500/20',
  'from-amber-500/20 via-yellow-400/10 to-orange-500/20',
  'from-rose-500/20 via-pink-400/10 to-red-500/20',
  'from-sky-500/20 via-blue-400/10 to-indigo-500/20',
  'from-teal-500/20 via-emerald-400/10 to-cyan-500/20',
  'from-fuchsia-500/20 via-pink-400/10 to-purple-500/20',
];

const dynamicIcons = [BookOpen, Brain, Lightbulb, GraduationCap, Rocket, Target, Zap, Monitor];

function hashIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

interface Course {
  id: string;
  title: string;
  competence: string;
  hours: number;
  provider: string;
  external_url: string;
  image_url: string | null;
}

export function CourseCarousel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loadingEnrollment, setLoadingEnrollment] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      // 1. Busca cursos ativos
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("active", true)
        .eq("is_compliance", false);

      if (coursesData) {
        setCourses(coursesData as Course[]);
      }

      // 2. Busca inscrições do usuário logado
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("user_id", userData.user.id);

        if (enrollments) {
          const ids = new Set(enrollments.map((e: { course_id: string }) => e.course_id));
          setEnrolledCourseIds(ids);
        }
      }
    }

    loadData();
  }, []);

  // Inscrição no Supabase + redirecionamento imediato para a URL cadastrada
  const handleEnroll = async (course: Course) => {
    try {
      setLoadingEnrollment(course.id);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Você precisa estar autenticado para se inscrever.");
        return;
      }

      // Insere na tabela de inscrições
      const { error } = await supabase
        .from("enrollments")
        .insert([
          {
            user_id: user.id,
            course_id: course.id,
            course_title: course.title,
            status: "pendente",
            progress: 0,
          },
        ]);

      if (error && error.code !== "23505") {
        toast?.error?.(`Erro: ${error.message}`) || alert(`Erro ao registrar: ${error.message}`);
        return;
      }

      // Atualiza o estado visual
      setEnrolledCourseIds(prev => new Set([...prev, course.id]));
      toast?.success?.("Inscrição confirmada! Abrindo curso...") || alert("Inscrição confirmada!");

      // Abre a URL externa cadastrada em nova aba
      if (course.external_url) {
        window.open(course.external_url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      alert(`Falha ao processar: ${err.message}`);
    } finally {
      setLoadingEnrollment(null);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (courses.length === 0) {
    return (
      <section id="cursos-em-alta" className="w-full my-4">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" /> Cursos em Alta
        </h3>
        <p className="text-sm text-muted-foreground p-6 rounded-xl border border-dashed text-center">
          Nenhum curso disponível no momento.
        </p>
      </section>
    );
  }

  return (
    <section id="cursos-em-alta" className="w-full my-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
          <h3 className="font-heading font-bold text-lg sm:text-xl text-foreground">
            Cursos em Alta
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-semibold border border-orange-500/20">
            {courses.length}
          </span>
        </div>

        {/* Controles de visualização */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="hidden md:flex items-center bg-muted/60 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setViewMode("carousel")}
              className={`p-1.5 rounded-md text-xs flex items-center transition-all ${
                viewMode === "carousel" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Carrossel"
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs flex items-center transition-all ${
                viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {viewMode === "carousel" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll("left")}
                aria-label="Rolar para esquerda"
                className="p-1.5 rounded-lg border border-border/60 bg-card hover:bg-accent text-foreground transition-colors shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label="Rolar para direita"
                className="p-1.5 rounded-lg border border-border/60 bg-card hover:bg-accent text-foreground transition-colors shadow-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid / Carrossel Responsivo */}
      <div
        ref={scrollContainerRef}
        className={
          viewMode === "carousel"
            ? "flex gap-4 overflow-x-auto pb-4 pt-1 px-1 -mx-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 pt-1"
        }
      >
        {courses.map((course, i) => {
          const CompIcon = competenceIcons[course.competence] || Puzzle;
          const gradientIdx = hashIndex(course.id, dynamicGradients.length);
          const iconIdx = hashIndex(course.id + "icon", dynamicIcons.length);
          const DynIcon = dynamicIcons[iconIdx];
          const gradient = dynamicGradients[gradientIdx];
          const isEnrolled = enrolledCourseIds.has(course.id);
          const isLoading = loadingEnrollment === course.id;

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              className={`flex flex-col justify-between rounded-2xl bg-card border border-border/60 p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group ${
                viewMode === "carousel"
                  ? "min-w-[270px] max-w-[290px] sm:min-w-[290px] sm:max-w-[310px] snap-start shrink-0"
                  : "w-full"
              }`}
            >
              <div>
                {/* Imagem / Banner do Curso */}
                <div
                  className={`h-32 w-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 relative overflow-hidden`}
                >
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <DynIcon className="h-10 w-10 text-foreground/30 transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-[10px] font-semibold text-foreground/30 uppercase tracking-widest">
                        {course.competence}
                      </span>
                    </div>
                  )}

                  {course.external_url && (
                    <a
                      href={course.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-md text-foreground/80 hover:text-primary transition-all opacity-90 group-hover:opacity-100 shadow-xs"
                      title="Abrir link do curso"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Badge de Competência */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2.5 ${
                    competenceColors[course.competence] || competenceColors.Outros
                  }`}
                >
                  <CompIcon className="h-3 w-3" />
                  <span>{course.competence}</span>
                </div>

                {/* Título */}
                <h4 className="font-heading font-semibold text-sm sm:text-base text-foreground leading-snug line-clamp-2 min-h-[2.5rem] mb-2">
                  {course.title}
                </h4>

                {/* Detalhes */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    {course.hours}h de duração
                  </span>
                  <span className="truncate max-w-[110px] font-medium" title={course.provider}>
                    {course.provider}
                  </span>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-2 border-t border-border/40">
                {isEnrolled ? (
                  <a
                    href={course.external_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-center"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Inscrito • Acessar Curso</span>
                    <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
                  </a>
                ) : (
                  <button
                    onClick={() => handleEnroll(course)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-4 w-4" />
                        <span>Inscrever-se</span>
                        <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}