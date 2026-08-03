import { ReactNode } from "react";

export default function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl2 border border-home-border bg-home-card p-4 shadow-soft transition-colors hover:bg-home-cardHover ${className}`}
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-home-dim">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
