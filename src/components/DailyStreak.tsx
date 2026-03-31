import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const MOTIVATIONAL_QUOTES = [
  "O conhecimento é a única riqueza que ninguém pode tirar de você.",
  "Cada hora investida em aprender é um passo para o topo.",
  "Grandes conquistas começam com pequenos passos diários.",
  "Quem aprende mais, lidera melhor.",
  "Sua dedicação de hoje é o sucesso de amanhã.",
  "O aprendizado nunca esgota a mente. — Leonardo da Vinci",
  "Invista em você. O retorno é garantido.",
  "Aprender é a habilidade mais poderosa do século XXI.",
];

export function DailyStreak() {
  const [quote, setQuote] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(0);

  useEffect(() => {
    const today = new Date();
    setDayOfWeek(today.getDay());
    // Pick quote based on day of year for consistency
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    setQuote(MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]);
  }, []);

  const days = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="text-xs font-heading font-bold text-foreground">Frase do Dia</p>
          <p className="text-[10px] text-muted-foreground">Motivação diária</p>
        </div>
      </div>
      <p className="text-xs text-foreground/80 italic leading-relaxed mb-3">"{quote}"</p>
      <div className="flex justify-between gap-1">
        {days.map((d, i) => (
          <div
            key={i}
            className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              i === dayOfWeek
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                : i < dayOfWeek
                ? "bg-orange-500/15 text-orange-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
