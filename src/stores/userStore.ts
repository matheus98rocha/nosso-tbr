"use client";

import { createClient } from "@/lib/supabase/client";
import type { UserTier } from "@/lib/auth/userTier";
import { User } from "@/types/user.types";
import { create } from "zustand";

type UserStore = {
  user: User | null;
  tier: UserTier | null;
  loading: boolean;
  error: string | null;
  isLoggingOut: boolean;
  sessionReady: boolean;
  setUser: (user: User | null) => void;
  setTier: (tier: UserTier | null) => void;
  setSession: (user: User | null, tier: UserTier | null) => void;
  logout: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  tier: null,
  loading: false,
  error: null,
  isLoggingOut: false,
  sessionReady: false,

  setUser: (user) => {
    set({ user });
  },

  setTier: (tier) => {
    set({ tier });
  },

  setSession: (user, tier) => {
    set({ user, tier, sessionReady: true });
  },

  logout: async () => {
    set({ isLoggingOut: true });
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, tier: null, isLoggingOut: false });
  },
}));
