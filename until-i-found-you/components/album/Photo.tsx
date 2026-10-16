"use client";

import { useState } from "react";
import Image from "next/image";

const PLACEHOLDER = "/photos/placeholder.svg";

/** Foto com moldura fina em vinho. Se o arquivo não existir, mostra o placeholder. */
export default function Photo({
  src,
  alt,
  grayscale,
  priority = false,
  sizes,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  grayscale: boolean;
  priority?: boolean;
  sizes: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const usePlaceholder = failed;

  return (
    <div className={`relative border-2 border-wine bg-sand ${className}`}>
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={usePlaceholder ? PLACEHOLDER : src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          unoptimized={usePlaceholder}
          onError={() => setFailed(true)}
          className={`object-cover ${grayscale && !usePlaceholder ? "grayscale" : ""}`}
        />
      </div>
      {children}
    </div>
  );
}
