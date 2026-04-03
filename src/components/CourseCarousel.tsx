import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Leaf, Users, Clock, ExternalLink, Puzzle, Shield, Monitor, Brain, Lightbulb, GraduationCap, Rocket, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

const competenceIcons: Record<string, React.ElementType> = {
  Digital: Monitor,
  Ambiental: Leaf,
  Inclusiva: Users,
  Compliance: Shield,
  Outros: Puzzle,
};

const competenceColors: Record<string, string> = {
  Digital: 'bg-blue-500/10 text-blue-600',
  Ambiental: 'bg-emerald-500/10 text-emerald-600',
  Inclusiva: 'bg-violet-500/10 text-violet-600',
  Compliance: 'bg-red-500/10 text-red-600',
  Outros: 'bg-orange-500/10 text-orange-600',
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

// Simple hash to get a consistent index from a string
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

  useEffect(() => {
    supabase.from("courses").select("*").eq("active", true).eq("is_compliance", false).then(({ data }) => {
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
          const CompIcon = competenceIcons[course.competence] || Puzzle;
          const gradientIdx = hashIndex(course.id, dynamicGradients.length);
          const iconIdx = hashIndex(course.id + 'icon', dynamicIcons.length);
          const DynIcon = dynamicIcons[iconIdx];
          const gradient = dynamicGradients[gradientIdx];

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
              <div className={`h-28 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 transition-colors relative overflow-hidden`}>
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <DynIcon className="h-10 w-10 text-foreground/25" />
                    <span className="text-[10px] font-medium text-foreground/20 uppercase tracking-wider">{course.competence}</span>
                  </div>
                )}
                <ExternalLink className="h-4 w-4 text-foreground/20 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${competenceColors[course.competence] || competenceColors.Outros}`}>
                <CompIcon className="h-3 w-3" />
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
