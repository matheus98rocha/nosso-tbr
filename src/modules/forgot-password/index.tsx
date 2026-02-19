"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForgotPassword } from "./hooks/useRecoverPassword";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const { sendRecovery, loading, success } = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendRecovery(email);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
        </CardHeader>

        <CardContent>
          {success ? (
            <p className="text-sm">
              If the email exists, you will receive recovery instructions.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send recovery email"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
