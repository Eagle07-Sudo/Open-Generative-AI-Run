'use client';

export default function OgModalShell({ title, description, children, footer, onClose, tabs }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up p-4">
      <div className="og-modal rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 pb-0 flex-shrink-0">
          {title && <h2 className="text-foreground font-bold text-lg mb-2">{title}</h2>}
          {description && <p className="text-foreground-muted text-[13px] mb-4">{description}</p>}
          {tabs}
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>
        {footer && <div className="p-6 pt-0 flex-shrink-0 border-t border-border-subtle">{footer}</div>}
      </div>
    </div>
  );
}
