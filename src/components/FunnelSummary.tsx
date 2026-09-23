import { FUNNEL_CLASSES, FUNNEL_LABEL, FUNNEL_STAGES, type Content } from "@/lib/planner";

export function FunnelSummary({
  title,
  subtitle,
  contents,
}: {
  title: string;
  subtitle: string;
  contents: Content[];
}) {
  const total = contents.length;
  const counts = FUNNEL_STAGES.map((stage) => ({
    stage,
    count: contents.filter((c) => c.funnel_stage === stage).length,
  }));

  return (
    <section className="glass-soft rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-primary">Resumo do funil</h2>
          <p className="text-xs font-medium text-muted-foreground">{title} · {subtitle}</p>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? "conteúdo" : "conteúdos"}
        </span>
      </div>

      <div className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {counts.map(({ stage, count }) => (
          <div
            key={stage}
            className={FUNNEL_CLASSES[stage].bar}
            style={{ width: total ? `${(count / total) * 100}%` : "0%" }}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        {counts.map(({ stage, count }) => (
          <div key={stage} className="rounded-2xl bg-card/50 p-3 text-center">
            <span className={`h-2 w-2 rounded-full ${FUNNEL_CLASSES[stage].dot}`} />
            <span className="mt-2 block text-[10px] font-semibold uppercase text-muted-foreground">{FUNNEL_LABEL[stage]}</span>
            <span className="font-display block text-2xl font-bold text-primary">{count}</span>
            <span className="block text-[10px] text-muted-foreground">
              {total ? Math.round((count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
