import type { CSSProperties } from "react";

export function Star({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" fill="currentColor">
      <path d="M50 2 C53 30 70 47 98 50 C70 53 53 70 50 98 C47 70 30 53 2 50 C30 47 47 30 50 2Z" />
    </svg>
  );
}

export function Heart({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true" fill="currentColor">
      <path d="M32 56C12 40 6 30 6 21 6 13 12 8 19 8c5 0 10 3 13 8 3-5 8-8 13-8 7 0 13 5 13 13 0 9-6 19-26 35z" />
    </svg>
  );
}

/** Divide o texto por *palavras* em caligrafia e \n em quebras de linha. */
export function Rich({ text, scriptClass = "text-wine" }: { text: string; scriptClass?: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <span key={i} className="block">
          {line.split(/(\*[^*]+\*)/g).map((part, j) =>
            part.startsWith("*") && part.endsWith("*") ? (
              <span key={j} className={`script ${scriptClass}`}>
                {part.slice(1, -1)}
              </span>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}
