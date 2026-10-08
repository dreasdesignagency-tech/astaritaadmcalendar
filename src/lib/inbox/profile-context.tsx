import { createContext, useContext } from "react";

import type { InboxProfile } from "./types";

const ProfileContext = createContext<InboxProfile | null>(null);

export const InboxProfileProvider = ProfileContext.Provider;

export function useInboxProfile(): InboxProfile {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error("useInboxProfile precisa estar dentro de InboxProfileProvider");
  return profile;
}
