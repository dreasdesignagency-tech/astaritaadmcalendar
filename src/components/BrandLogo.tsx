import { useState } from "react";
import logoAsset from "@/assets/astarita-symbol.png";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, showName = false }: { className?: string; showName?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {failed ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
          A
        </span>
      ) : (
        <img
          src={logoAsset}
          alt="Astarita"
          className="h-11 w-11 shrink-0 object-contain"
          onError={() => setFailed(true)}
        />
      )}
      {showName && (
        <div>
          <p className="font-display text-base font-bold text-current">Astarita</p>
          <p className="text-[10px] font-semibold uppercase text-current/55">Planejamento de conteúdo</p>
        </div>
      )}
    </div>
  );
}
