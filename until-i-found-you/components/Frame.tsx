import type { ReactNode } from "react";
import { Star } from "./ornaments";

/** Cartão branco editorial sobre o fundo vinho. */
export default function Frame({
  children,
  className = "",
  stars = true,
}: {
  children: ReactNode;
  className?: string;
  stars?: boolean;
}) {
  return (
    <div className={`paper relative mx-auto w-full max-w-[560px] overflow-hidden ${className}`}>
      {stars && (
        <>
          <Star className="pointer-events-none absolute -left-5 top-10 h-14 w-14 text-blush/70" />
          <Star className="pointer-events-none absolute -right-6 bottom-24 h-16 w-16 rotate-12 text-blush/60" />
        </>
      )}
      {children}
    </div>
  );
}
