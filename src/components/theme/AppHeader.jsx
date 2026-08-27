import { ArrowLeft, RotateCcw, Leaf, Cpu } from 'lucide-react';
import { Button } from './Button';

export const AppHeader = ({ persona, onOpenSidebar, onOpenPersonaInfo, onReset, resetLabel = "Reset Form" }) => {
	return (
		<div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
			<div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
				<button onClick={onOpenSidebar} className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
					<ArrowLeft size={24} />
				</button>
				<img
					src={persona.avatar}
					alt={persona.name}
					onClick={onOpenPersonaInfo}
					className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
					style={{
						borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)`,
                        boxShadow: `0 0 15px color-mix(in srgb, ${persona.theme.primary} 15%, transparent)`
					}}
				/>
				<div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
					<h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
						<span className="truncate">{persona.name}</span>
						{persona.isOnDevice && ((persona.appId === 'bgremover' || persona.id === 'app_bgremover') ? <Cpu size={16} className="text-green-500 fill-green-500/20 shrink-0" /> : <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />)}
					</h2>
					<div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
						<span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
						<span className="-translate-y-[1px]">Online</span>
					</div>
				</div>
			</div>
			{onReset && (
				<Button 
					onClick={onReset} 
					variant="reset"
					themeColor={persona.theme.primary}
					title={resetLabel}
					icon={RotateCcw}
				>
					<span className="hidden md:inline">{resetLabel}</span>
				</Button>
			)}
		</div>
	);
};
