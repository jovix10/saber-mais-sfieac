import { useState, useEffect } from "react";
import { Accessibility, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('saber-dark-mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('saber-dark-mode', String(darkMode));
  }, [darkMode]);

  const changeFontSize = (delta: number) => {
    const next = Math.max(80, Math.min(140, fontSize + delta));
    setFontSize(next);
    document.documentElement.style.fontSize = `${next}%`;
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast');
  };

  const reset = () => {
    setFontSize(100);
    setHighContrast(false);
    setDarkMode(false);
    document.documentElement.style.fontSize = '100%';
    document.documentElement.classList.remove('high-contrast');
    document.documentElement.classList.remove('dark');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Acessibilidade"
      >
        <Accessibility className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-14 left-0 bg-card border rounded-xl shadow-xl p-4 space-y-3 min-w-[220px]"
          >
            <p className="text-xs font-heading font-bold text-foreground">Acessibilidade</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Tamanho da fonte</span>
              <div className="flex gap-1">
                <button onClick={() => changeFontSize(-10)} className="h-7 w-7 rounded bg-muted text-foreground text-sm font-bold hover:bg-muted/80">A-</button>
                <button onClick={() => changeFontSize(10)} className="h-7 w-7 rounded bg-muted text-foreground text-sm font-bold hover:bg-muted/80">A+</button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Modo escuro</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 ${darkMode ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}
              >
                {darkMode ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                {darkMode ? 'Ligado' : 'Desligado'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Alto contraste</span>
              <button onClick={toggleContrast} className={`h-7 px-3 rounded text-xs font-medium ${highContrast ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}>
                {highContrast ? 'Ligado' : 'Desligado'}
              </button>
            </div>
            <button onClick={reset} className="w-full text-xs text-primary hover:underline">Restaurar padrão</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
