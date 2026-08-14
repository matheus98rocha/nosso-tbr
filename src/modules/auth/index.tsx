"use client";

import LogoIcon from "@/assets/icons/logo";
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
import { useActionState } from "react";
import { LoginState, loginAction } from "./actions/login";
import { useLogin } from "./hooks/useLogin";

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
    <div className="flex min-h-screen w-screen items-center justify-center bg-muted p-4">
      <Card className="mx-auto w-full max-w-sm border-border bg-card text-card-foreground shadow-sm md:w-96 lg:w-[400px]">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <span
              className="inline-flex size-12 shrink-0 [&>svg]:size-full"
              aria-hidden
            >
              <LogoIcon />
            </span>
            Nosso TBR
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sua estante digital: organize leituras, metas e descobertas com
            calma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  );
}
