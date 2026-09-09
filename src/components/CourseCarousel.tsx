import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Laptop, 
  Tree, 
  People, 
  ShieldCheck, 
  Puzzle, 
  Clock, 
  BoxArrowUpRight, 
  Fire 
} from "react-bootstrap-icons";
import { motion } from "framer-motion";

const competenceIcons: Record<string, React.ElementType> = {
  Digital: Laptop,
  Ambiental: Tree,
  Inclusiva: People,
  Compliance: ShieldCheck,
  Outros: Puzzle,
};

const competenceTheme: Record<string, { badge: string; border: string }> = {
  Digital: { badge: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900', border: 'hover:border-blue-400/50' },
  Ambiental: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900', border: 'hover:border-emerald-400/50' },
  Inclusiva: { badge: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-900', border: 'hover:border-violet-400/50' },
  Compliance: { badge: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900', border: 'hover:border-rose-400/50' },
  Outros: { badge: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800', border: 'hover:border-slate-400/50' },
};

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .eq("active", true)
      .eq("is_compliance", false)
      .then(({ data }) => {
        if (data) setCourses(data as Course[]);
        setLoading(false);
      });
  }, []);

  return (
    <div id="cursos-em-alta" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Fire className="h-5 w-5 text-amber-500" /> Cursos em Destaque
        </h3>
        <span className="text-xs text-muted-foreground">Recomendados para sua trilha</span>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden py-1">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="min-w-[260px] h-52 rounded-xl border border-border/50 bg-card/40 p-4 animate-pulse space-y-3">
              <div className="h-24 rounded-lg bg-muted/60" />
              <div className="h-4 w-20 bg-muted/60 rounded" />
              <div className="h-4 w-40 bg-muted/60 rounded" />
              <div className="h-3 w-16 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card/30">
          <p className="text-sm text-muted-foreground">Nenhuma capacitação recomendada no momento.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
          {courses.map((course, i) => {
            const CompIcon = competenceIcons[course.competence] || Puzzle;
            const theme = competenceTheme[course.competence] || competenceTheme.Outros;

            return (
              <motion.a
                key={course.id}
                href={course.external_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card/70 backdrop-blur-sm border border-border/60 rounded-xl p-4 min-w-[270px] max-w-[290px] snap-start cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group block ${theme.border}`}
              >
                <div className="h-28 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-center mb-3 relative overflow-hidden">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground/40">
                      <CompIcon className="h-8 w-8" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{course.competence}</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <BoxArrowUpRight className="h-3 w-3 text-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${theme.badge}`}>
                    <CompIcon className="h-3 w-3" />
                    {course.competence}
                  </div>
                  <h4 className="font-heading font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                    {course.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1 font-medium"><Clock className="h-3 w-3" />{course.hours}h</span>
                    <span className="truncate max-w-[120px]">{course.provider}</span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
}