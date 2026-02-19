import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useForgotPassword() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const sendRecovery = async (email: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
        redirectTo: "http://localhost:3000/reset-password",
      });

      if (error) throw error;

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return { sendRecovery, loading, success };
}
