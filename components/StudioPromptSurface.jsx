'use client';

/**
 * Fork: shared prompt composer shell — theme tokens via studio-surface (light + dark).
 */
export default function StudioPromptSurface({ className = '', children }) {
  return (
    <div
      className={`w-full studio-surface rounded-md p-4 flex flex-col gap-2 shadow-2xl ${className}`.trim()}
    >
      {children}
    </div>
  );
}
