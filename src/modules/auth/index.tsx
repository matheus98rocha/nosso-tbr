"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, LoginState } from "./actions/login";
import { useActionState } from "react";
import LogoIcon from "@/assets/icons/logo";
import { Skeleton } from "@/components/ui/skeleton";

interface LoginPageProps {
  children?: React.ReactNode;
}

export default function LoginPage({ children }: LoginPageProps) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {
      message: null,
      error: null,
    } as LoginState
  );

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gray-100">
      <Card className="mx-auto w-80 md:w-96 lg:w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 justify-start">
            <LogoIcon className="w-60 h-60" />
            Nosso TBR
          </CardTitle>
          <CardDescription>
            Digite seu email e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              {isPending ? (
                <Skeleton className="h-10 w-full rounded-md" />
              ) : (
                <Input
                  type="email"
                  name="email"
                  placeholder="exemplo@email.com"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              {isPending ? (
                <Skeleton className="h-10 w-full rounded-md" />
              ) : (
                <Input type="password" name="password" required />
              )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {state?.error && !isPending && (
            <p className="mt-4 text-red-500 text-sm">{state.error}</p>
          )}
          {state?.message && !isPending && (
            <p className="mt-4 text-green-500 text-sm">{state.message}</p>
          )}

          {children}
        </CardContent>
      </Card>
    </div>
  );
}
