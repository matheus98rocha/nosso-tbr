"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginState, loginAction } from "@/modules/auth/actions/login";
import { AuthBrandPanel, AuthShell } from "@/modules/auth/components";
import { useLogin } from "@/modules/auth/hooks/useLogin";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {
      message: null,
      error: null,
    } as LoginState,
  );

  const { handleRecoverPassword } = useLogin();

  return (
    <AuthShell
      brand={
        <AuthBrandPanel
          title="Bem-vindo de volta à estante"
          description="Organize leituras, metas e descobertas com calma — sua biblioteca digital está aqui."
        />
      }
    >
      <Card className="border-border/70 bg-card/95 text-card-foreground shadow-[0_18px_50px_-28px_oklch(0.25_0.05_264/0.45)] backdrop-blur-sm">
        <CardHeader className="space-y-2 border-b border-border/60 pb-5">
          <CardTitle className="font-[family-name:var(--font-auth-display)] text-2xl font-semibold tracking-tight">
            Entrar
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Use seu e-mail e senha para acessar a conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <form action={formAction} className="space-y-4" aria-label="Sign in">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail</Label>
              {isPending ? (
                <Skeleton className="h-11 w-full rounded-md" />
              ) : (
                <Input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="exemplo@email.com"
                  required
                  className="min-h-11 text-base"
                  aria-label="Email"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              {isPending ? (
                <Skeleton className="h-11 w-full rounded-md" />
              ) : (
                <Input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className="min-h-11 text-base"
                  aria-label="Password"
                />
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-11 min-h-11 w-full cursor-pointer transition-opacity disabled:opacity-60"
              aria-label="Submit sign in"
            >
              {isPending ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          {state?.error && !isPending ? (
            <p
              role="alert"
              aria-live="polite"
              className="text-sm text-destructive"
            >
              {state.error}
            </p>
          ) : null}
          {state?.message && !isPending ? (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-chart-2"
            >
              {state.message}
            </p>
          ) : null}

          <Separator />

          <div className="flex flex-col items-stretch gap-1 sm:items-center">
            <Button
              type="button"
              variant="link"
              className="h-11 min-h-11 cursor-pointer text-foreground"
              onClick={() => handleRecoverPassword()}
              aria-label="Forgot password"
            >
              Esqueci a senha
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
