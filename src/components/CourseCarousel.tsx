import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Leaf, Users, Clock, ExternalLink, Puzzle } from "lucide-react";
import { motion } from "framer-motion";

const competenceIcons: Record<string, React.ElementType> = {
  Digital: BookOpen,
  Ambiental: Leaf,
  Inclusiva: Users,
  Compliance: BookOpen,
  Outros: Puzzle,
};

const competenceColors: Record<string, string> = {
  Digital: 'bg-blue-500/10 text-blue-600',
  Ambiental: 'bg-emerald-500/10 text-emerald-600',
  Inclusiva: 'bg-violet-500/10 text-violet-600',
  Compliance: 'bg-red-500/10 text-red-600',
  Outros: 'bg-orange-500/10 text-orange-600',
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

  useEffect(() => {
    supabase.from("courses").select("*").eq("active", true).then(({ data }) => {
      if (data) setCourses(data as Course[]);
    });
  }, []);

  if (courses.length === 0) {
    return (
      <div>
        <h3 className="font-heading font-bold text-lg text-foreground mb-4">🔥 Cursos em Alta</h3>
        <p className="text-sm text-muted-foreground">Nenhum curso disponível no momento</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-heading font-bold text-lg text-foreground mb-4">🔥 Cursos em Alta</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide">
        {courses.map((course, i) => {
          const Icon = competenceIcons[course.competence] || Puzzle;
          return (
            <motion.a
              key={course.id}
              href={course.external_url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5 min-w-[260px] max-w-[280px] snap-start cursor-pointer hover:shadow-xl transition-shadow group block"
            >
              <div className="h-28 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/15 group-hover:to-primary/10 transition-colors relative overflow-hidden">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <Icon className="h-10 w-10 text-primary/50" />
                )}
                <ExternalLink className="h-4 w-4 text-primary/30 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${competenceColors[course.competence] || competenceColors.Outros}`}>
                <Icon className="h-3 w-3" />
                {course.competence}
              </div>
              <h4 className="font-heading font-semibold text-sm text-foreground leading-tight mb-2">{course.title}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.hours}h</span>
                <span>{course.provider}</span>
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
