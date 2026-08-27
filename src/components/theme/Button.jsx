import { Loader2 } from 'lucide-react';

/**
 * Shared Button component to centralize typography, border-radius (rounded), 
 * transitions, sizing, and colors across all tools and applications.
 */
export const Button = ({
  variant = 'header-action', // 'header-action' | 'full-action' | 'reset' | 'icon'
  themeColor,
  isLoading = false,
  disabled = false,
  onClick,
  icon: Icon,
  label,
  children,
  className = '',
  style = {},
  title,
  ...props
}) => {
  // Central styling configuration for easy maintenance
  const config = {
    // Sizing and Paddings
    padding: {
      'header-action': 'h-7 px-3',
      'full-action': 'py-2.5 px-4',
      'reset': 'px-2.5 py-1.5',
      'icon': 'p-1.5'
    },
    
    // Border Radius (Rounded style)
    rounded: 'rounded-lg', // Centralize rounded styling here (e.g. rounded-lg, rounded-xl, rounded-md)

    // Typography
    font: {
      'header-action': 'font-bold text-[11px] uppercase tracking-widest',
      'full-action': 'font-bold text-[13px] uppercase tracking-wider',
      'reset': 'font-semibold text-[13px]',
      'icon': 'text-xs'
    },

    // Default CSS Transition & Interactive Scale Behavior
    baseClasses: 'flex items-center justify-center gap-1.5 transition-all duration-200 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed',

    // Specific variants
    variants: {
      'header-action': 'text-white hover:opacity-95 shadow-sm hover:shadow transition-all duration-200',
      'full-action': 'text-white hover:opacity-95 w-full mt-2 shadow-sm hover:shadow transition-all duration-200',
      'reset': 'text-slate-500 transition-colors',
      'icon': 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
    }
  };

  const isPrimaryStyle = variant === 'header-action' || variant === 'full-action';
  
  // Resolve dynamic custom styles/colors based on current persona theme
  const getStyle = () => {
    const finalStyle = { ...style };
    if (disabled || isLoading) {
      if (isPrimaryStyle) {
        return { backgroundColor: '#94a3b8', ...finalStyle }; // Gray disabled state
      }
      return finalStyle;
    }

    if (themeColor) {
      if (isPrimaryStyle) {
        return { backgroundColor: themeColor, ...finalStyle };
      }
      if (variant === 'reset') {
        return {
          '--btn-hover-bg': `color-mix(in srgb, ${themeColor} 10%, transparent)`,
          '--btn-hover-text': themeColor,
          ...finalStyle
        };
      }
    }
    return finalStyle;
  };

  const getClassName = () => {
    const classes = [
      config.baseClasses,
      config.rounded,
      config.padding[variant],
      config.font[variant],
      config.variants[variant],
      variant === 'reset' ? 'hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]' : '',
      className
    ];
    return classes.filter(Boolean).join(' ');
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={getClassName()}
      style={getStyle()}
      title={title}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={variant === 'full-action' ? 16 : 14} className="animate-spin shrink-0" />
      ) : (
        Icon && <Icon size={variant === 'full-action' ? 16 : 14} className="shrink-0" />
      )}
      
      {label || children ? <span>{label || children}</span> : null}
    </button>
  );
};
