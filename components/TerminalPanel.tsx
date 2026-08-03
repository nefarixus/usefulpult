import { ReactNode } from "react";

export default function TerminalPanel({
  command,
  children,
  className = "",
}: {
  command: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative border border-console-border bg-console-panel/80 backdrop-blur-sm p-4 sm:p-5 ${className}`}
    >
      {/* corner brackets — the recurring "viewfinder" motif tying every panel together */}
      <span
        aria-hidden
        className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 border-console-amber"
      />
      <span
        aria-hidden
        className="absolute -top-px -right-px h-3 w-3 border-t-2 border-r-2 border-console-amber"
      />
      <span
        aria-hidden
        className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-console-amber"
      />
      <span
        aria-hidden
        className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-console-amber"
      />

      <div className="mb-4 flex items-center gap-2 text-xs text-console-dim">
        <span className="text-console-green">$</span>
        <span className="tracking-wide">{command}</span>
      </div>

      {children}
    </section>
  );
}
