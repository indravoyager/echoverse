import { clsx } from 'clsx';

/**
 * Reusable SegmentedControl component to render sliding/tab selector switches
 * for settings and inputs with a small number of choices.
 * Standardized to have identical height (h-9) and layout styles across all apps.
 */
export const SegmentedControl = ({ value, onChange, options, className }) => {
  const selectedIndex = options.findIndex(o => o.value === value);
  const activeIndex = selectedIndex !== -1 ? selectedIndex : 0;

  return (
    <div className={clsx(
      "relative flex w-full bg-slate-100 dark:bg-white/5 rounded-lg p-1 border border-slate-200/20 dark:border-white/5 select-none shrink-0 h-9 items-center",
      className
    )}>
      {/* Sliding Active Indicator */}
      <div 
        className="absolute top-1 bottom-1 bg-white dark:bg-[#2a2a2a] rounded-md shadow-sm transition-all duration-300 ease-out border border-slate-200/20 dark:border-white/5"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`
        }}
      />
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.title || opt.label}
            className={clsx(
              "flex-1 relative z-10 text-[10px] md:text-[11px] font-bold h-7 transition-colors duration-300 uppercase tracking-wider flex items-center justify-center gap-1.5 focus:outline-none",
              isSelected 
                ? "text-slate-800 dark:text-white" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {Icon && <Icon size={14} className="shrink-0 opacity-80" />}
            {opt.label && <span className="truncate">{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
