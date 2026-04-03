import { AppLayout } from "@/components/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ExternalLink, Scale, FileCheck, AlertTriangle, Lock, Eye, Gavel, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const complianceGradients = [
  'from-amber-500/20 via-yellow-400/10 to-orange-500/20',
  'from-red-500/20 via-rose-400/10 to-pink-500/20',
  'from-orange-500/20 via-amber-400/10 to-yellow-500/20',
  'from-rose-500/20 via-red-400/10 to-orange-500/20',
  'from-yellow-500/20 via-amber-400/10 to-red-500/20',
  'from-pink-500/20 via-rose-400/10 to-red-500/20',
];

const complianceIcons = [ShieldCheck, Scale, FileCheck, AlertTriangle, Lock, Eye, Gavel, BookOpen];

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
  description: string | null;
  competence: string;
  hours: number;
  provider: string | null;
  external_url: string;
  image_url: string | null;
}

export default function Compliance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("courses").select("*").eq("active", true).eq("is_compliance", true).order("created_at", { ascending: false });
      if (data) setCourses(data as Course[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-foreground">Compliance</h2>
            <p className="text-sm text-muted-foreground">Cursos obrigatórios e treinamentos de conformidade</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum curso de compliance disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, i) => {
              const gradientIdx = hashIndex(course.id, complianceGradients.length);
              const iconIdx = hashIndex(course.id + 'ic', complianceIcons.length);
              const DynIcon = complianceIcons[iconIdx];
              const gradient = complianceGradients[gradientIdx];

              return (
                <motion.a
                  key={course.id}
                  href={course.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all group cursor-pointer"
                >
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-36 object-cover" />
                  ) : (
                    <div className={`w-full h-36 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1`}>
                      <DynIcon className="h-12 w-12 text-foreground/20" />
                      <span className="text-[10px] font-semibold text-foreground/15 uppercase tracking-widest">Compliance</span>
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading font-bold text-sm text-foreground line-clamp-2">{course.title}</h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {course.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-medium">Compliance</span>
                      <span className="text-xs text-muted-foreground">{course.hours}h</span>
                      {course.provider && <span className="text-xs text-muted-foreground">· {course.provider}</span>}
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
