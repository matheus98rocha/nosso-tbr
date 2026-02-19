"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "./hooks/useResetPassword";

export default function ResetPasswordClient() {
  const supabase = createClient();
  const { updatePassword, loading, success } = useResetPassword();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      }
    };

    init();
  }, [supabase.auth]);

  if (!ready && !success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Validating link...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>

        <CardContent>
          {success ? (
            <p className="text-sm">
              Password updated successfully. You can now log in.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePassword(password);
              }}
              className="flex flex-col gap-4"
            >
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
