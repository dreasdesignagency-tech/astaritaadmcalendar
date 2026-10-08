import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  children,
  className,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  className?: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-10 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "mb-1 flex h-12 w-12 items-center justify-center rounded-full",
          tone === "error" ? "bg-destructive/10 text-destructive" : "bg-accent text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-medium">{title}</p>
      {children && <div className="max-w-xs text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
