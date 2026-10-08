import { useQuery } from "@tanstack/react-query";

import { fetchChannelStatus, type ChannelStatus } from "@/lib/inbox/messaging";

/** Estado real dos canais (WhatsApp e IA), vindo do backend. Nunca assume "conectado" sem confirmação. */
export function useChannelStatus() {
  return useQuery<ChannelStatus>({
    queryKey: ["inbox", "channel-status"],
    queryFn: fetchChannelStatus,
    staleTime: 60_000,
    retry: 1,
  });
}
