import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useResetPassword() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updatePassword = async (password: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return { updatePassword, loading, success };
}
