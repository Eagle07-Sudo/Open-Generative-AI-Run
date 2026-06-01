'use client';

/**
 * Compact chip + popover slot for model input controls (quality, resolution, duration).
 * @param {{
 *   chipClassName?: string,
 *   icon?: React.ReactNode,
 *   label: string,
 *   open: boolean,
 *   onToggle: (e: React.MouseEvent) => void,
 *   popoverClassName?: string,
 *   children: React.ReactNode,
 * }}
 */
export default function ModelInputChipRow({
  chipClassName = '',
  icon,
  label,
  open,
  onToggle,
  popoverClassName = '',
  children,
}) {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} className={chipClassName}>
        {icon}
        <span className="text-[11px] font-semibold text-white/70 group-hover:text-primary transition-colors">
          {label}
        </span>
      </button>
      {open ? (
        <div onClick={(e) => e.stopPropagation()} className={popoverClassName}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
