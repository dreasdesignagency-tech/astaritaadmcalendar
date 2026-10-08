import type { ReactNode } from "react";

/** Tela cheia no visual do Inbox, para estados fora do layout principal (login, erros, configuração). */
export function InboxScreen({ children }: { children: ReactNode }) {
  return (
    <div className="inbox-theme fixed inset-0 flex items-center justify-center overflow-y-auto bg-background p-4">
      <div className="inbox-surface w-full max-w-md rounded-[2rem] p-6 sm:p-8">{children}</div>
    </div>
  );
}
