import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TypingIndicator() {
  const [phase, setPhase] = useState(0);

  const phases = [
    { text: "memahami konteks..." },
    { text: "mencari di internet..." },
    { text: "menyusun jawaban..." }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 1500);
    const timer2 = setTimeout(() => setPhase(2), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative flex items-center overflow-hidden h-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center text-[var(--color-brand-magenta)]"
        >
          <span className="text-slate-500 dark:text-slate-400 font-normal -translate-y-[1px]">sedang {phases[phase].text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
