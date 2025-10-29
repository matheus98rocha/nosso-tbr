"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@/types/user.types";
import { create } from "zustand";

type UserStore = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isLoggingOut: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  isLoggingOut: false,

  setUser: (user) => {
    set({ user });
  },

  logout: async () => {
    set({ isLoggingOut: true });
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isLoggingOut: false });
  },
}));
