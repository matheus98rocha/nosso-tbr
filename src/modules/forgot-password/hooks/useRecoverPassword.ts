import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useForgotPassword() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const sendRecovery = async (email: string) => {
    try {
      setLoading(true);

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl.replace(/\/$/, "")}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return { sendRecovery, loading, success };
}
