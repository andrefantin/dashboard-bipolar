import type { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  /** nível "raised": destaque (card de humor, painéis principais) */
  raised?: boolean;
  className?: string;
  id?: string;
}

export default function GlassPanel({ children, raised = false, className = "", id }: GlassPanelProps) {
  return (
    <div id={id} className={`${raised ? "glass-raised" : "glass"} ${className}`}>
      {children}
    </div>
  );
}
