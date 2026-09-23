import logoAsset from "@/assets/astarita-symbol.png";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, showName = false }: { className?: string; showName?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img src={logoAsset} alt="Astarita" className="h-11 w-11 shrink-0 object-contain" />
      {showName && (
        <div>
          <p className="font-display text-base font-bold text-current">Astarita</p>
          <p className="text-[10px] font-semibold uppercase text-current/55">Planejamento de conteúdo</p>
        </div>
      )}
    </div>
  );
}