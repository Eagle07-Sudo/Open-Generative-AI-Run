'use client';

export default function SimpleDropdown({ title, options, selected, onSelect, onClose }) {
  return (
    <>
      <div className="text-xs font-medium text-foreground-muted pb-2 border-b border-border-subtle mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <div
            key={String(opt)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opt);
              onClose?.();
            }}
            className="flex items-center justify-between p-2 hover:bg-card-bg rounded-md cursor-pointer transition-all group"
          >
            <span className="text-xs font-bold text-foreground-secondary group-hover:text-foreground">
              {String(opt)}
            </span>
            {selected === opt ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
