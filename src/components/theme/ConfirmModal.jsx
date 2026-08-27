
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  themeColor
}) => {
  if (!isOpen) return null;

  const confirmBg = variant === "danger" ? "bg-[#e11d48] hover:bg-red-700 text-white" : "bg-[var(--color-primary)] text-white hover:opacity-90";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f0f0f] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-white/10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={themeColor ? { '--color-primary': themeColor } : {}}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 text-left">
          {title}
        </h3>

        <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-8 text-left">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end items-center w-full">
          <button
            onClick={onClose}
            className="px-3 py-2 text-[var(--color-brand-magenta)] font-semibold text-[14px] transition-colors hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg font-semibold text-[14px] transition-all duration-200 active:scale-95 ${confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
