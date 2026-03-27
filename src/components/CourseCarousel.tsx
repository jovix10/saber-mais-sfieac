import { mockCourses, type Competence } from "@/lib/mock-data";
import { BookOpen, Leaf, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";

const competenceIcons: Record<Competence, React.ElementType> = {
  Digital: BookOpen,
  Ambiental: Leaf,
  Inclusiva: Users,
};

const competenceColors: Record<Competence, string> = {
  Digital: 'bg-blue-500/10 text-blue-600',
  Ambiental: 'bg-emerald-500/10 text-emerald-600',
  Inclusiva: 'bg-violet-500/10 text-violet-600',
};

export function CourseCarousel() {
  return (
    <div>
      <h3 className="font-heading font-bold text-lg text-foreground mb-4">🔥 Cursos em Alta</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide">
        {mockCourses.map((course, i) => {
          const Icon = competenceIcons[course.competence];
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5 min-w-[260px] max-w-[280px] snap-start cursor-pointer hover:shadow-xl transition-shadow group"
            >
              <div className="h-28 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/15 group-hover:to-primary/10 transition-colors">
                <Icon className="h-10 w-10 text-primary/50" />
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${competenceColors[course.competence]}`}>
                <Icon className="h-3 w-3" />
                {course.competence}
              </div>
              <h4 className="font-heading font-semibold text-sm text-foreground leading-tight mb-2">{course.title}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.hours}h</span>
                <span>{course.provider}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
