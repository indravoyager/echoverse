import { useState, useEffect, useRef, createElement } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export const CustomSelect = ({ value, onChange, options, themeColor }) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div className="relative w-full" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex justify-between items-center bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-lg h-7 px-3 text-[11px] font-bold text-slate-800 dark:text-white transition-all hover:border-[var(--color-brand-primary)]"
				style={{"--color-brand-primary": themeColor}}
			>
				<span className="flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
					{options.find(o => o.value === value)?.icon && createElement(options.find(o => o.value === value).icon, { size: 16, className: "text-slate-500 shrink-0" })}
					<span className="truncate">{options.find(o => o.value === value)?.label || value}</span>
				</span>
				<ChevronDown 
					size={16} 
					className={clsx("transition-transform duration-200 shrink-0 ml-2", isOpen ? "rotate-180" : "text-slate-400")} 
					style={isOpen ? {color: themeColor} : {}} 
				/>
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
					<div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
						{options.map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => {
									onChange(opt.value);
									setIsOpen(false);
								}}
								className={clsx(
									"w-full text-left px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-between mb-0.5 last:mb-0",
									value === opt.value 
										? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]" 
										: "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[var(--color-brand-primary)]"
								)}
								style={{"--color-brand-primary": themeColor}}
							>
								<span className="flex items-center gap-2">
									{opt.icon && createElement(opt.icon, { size: 16 })}
									<span>{opt.label}</span>
								</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
