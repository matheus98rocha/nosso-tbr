import { createClient } from "@/lib/supabase/client";
import { User } from "@/types/user.types";
import { create } from "zustand";

type UserStore = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isLoggingOut: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  isLoggingOut: false,

  fetchUser: async () => {
    set({ loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      set({ error: error.message, user: null, loading: false });
    } else {
      set({ user: data.user as unknown as User, loading: false });
    }
  },

  logout: async () => {
    set({ isLoggingOut: true });
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isLoggingOut: false });
  },
}));
