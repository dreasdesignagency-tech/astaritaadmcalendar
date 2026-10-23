import { Heart } from "@/components/ornaments";

export default function Page() {
  return (
    <main className="wine-bg flex min-h-dvh items-center justify-center px-6 text-center text-paper">
      <div>
        <Heart className="mx-auto h-6 w-6 text-paper/80" />
        <h1 className="mt-6 font-serif text-[2.4rem] font-medium italic leading-[1.1] sm:text-5xl">
          Vem coisa por aí, <span className="script whitespace-nowrap not-italic">meu amor.</span>
        </h1>
        <p className="mt-5 text-[0.75rem] tracking-[0.28em]">FIQUE LIGADA!</p>
      </div>
    </main>
  );
}
