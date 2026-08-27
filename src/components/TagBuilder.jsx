import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function TagBuilder({ onSave, onCancel, initialData, personas }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    members: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const toggleMember = (personaId) => {
    setFormData(prev => {
      const isMember = prev.members.includes(personaId);
      if (isMember) {
        return { ...prev, members: prev.members.filter(id => id !== personaId) };
      } else {
        return { ...prev, members: [...prev.members, personaId] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const tagToSave = {
      ...formData,
      id: formData.id || `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    onSave(tagToSave);
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-4 shrink-0 -mt-1 pr-2">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white">
          {initialData ? 'Edit Tag' : 'New Tag'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-5 pb-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Tag Name</h3>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Coding Tools"
            className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white text-[13px] font-medium focus:outline-none focus:border-[var(--color-brand-magenta)] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Included Personas & Tools</h3>
          <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] overflow-hidden">
            <div className="flex flex-col gap-2 p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
              {personas.map(persona => {
                const isSelected = formData.members.includes(persona.id);
                return (
                  <button
                    key={persona.id}
                    onClick={() => toggleMember(persona.id)}
                    className={clsx(
                      "flex items-center gap-3 p-2 rounded-md transition-colors border text-left",
                      isSelected 
                        ? "bg-white dark:bg-white/10 border-[var(--color-brand-magenta)]/30" 
                        : "bg-transparent border-transparent hover:bg-white dark:hover:bg-white/5"
                    )}
                  >
                    <div className="relative shrink-0">
                      <img 
                        src={persona.avatar} 
                        alt={persona.name} 
                        className="w-10 h-10 rounded-full object-cover bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-[#0f0f0f] rounded-full flex items-center justify-center">
                        {isSelected ? (
                          <CheckCircle2 size={14} className="text-[var(--color-brand-magenta)]" />
                        ) : (
                          <Circle size={14} className="text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                        {persona.name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 truncate">
                        {persona.role || (persona.isApp ? 'Tool' : 'Persona')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            className="px-5 py-2 bg-[var(--color-brand-magenta)] hover:bg-[var(--color-brand-magenta)]/90 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} /> {initialData ? 'Save Changes' : 'Save New Tag'}
          </button>
        </div>

      </div>
    </div>
  );
}
