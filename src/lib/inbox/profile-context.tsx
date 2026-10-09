import { createContext, useContext } from "react";

import type { MyProfile } from "./types";

const ProfileContext = createContext<MyProfile | null>(null);

export const InboxProfileProvider = ProfileContext.Provider;

export function useInboxProfile(): MyProfile {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error("useInboxProfile precisa estar dentro de InboxProfileProvider");
  return profile;
}
