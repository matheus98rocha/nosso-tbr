"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Ticket, X } from "lucide-react";
import { useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AuthBrandPanel, AuthShell } from "@/modules/auth/components";
import { RegisterPasswordHints } from "@/modules/register/components";
import { useRegister } from "@/modules/register/hooks/useRegister";
import type { RegisterFormProps } from "@/modules/register/types";

function RegisterForm({ inviteToken }: RegisterFormProps) {
  const { form, onSubmit, isPending, isError, error } =
    useRegister(inviteToken);

  const password = useWatch({ control: form.control, name: "password" });
  const passwordConfirm = useWatch({
    control: form.control,
    name: "password_confirm",
  });

  const passwordsMatch =
    (passwordConfirm?.length ?? 0) > 0 && password === passwordConfirm;

  return (
    <AuthShell
      brand={
        <AuthBrandPanel
          title="Crie sua conta na estante"
          description="Junte-se a quem ama contar capítulos, páginas e histórias — com convite, no seu ritmo."
          badge={
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm">
              <Ticket className="size-3.5 shrink-0" aria-hidden />
              Convite ativo · válido por 24h
            </span>
          }
        />
      }
    >
      <Card className="border-border/70 bg-card/95 text-card-foreground shadow-[0_18px_50px_-28px_oklch(0.25_0.05_264/0.45)] backdrop-blur-sm">
        <CardHeader className="space-y-2 border-b border-border/60 pb-5">
          <CardTitle className="font-[family-name:var(--font-auth-display)] text-2xl font-semibold tracking-tight">
            Dados do cadastro
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Preencha os campos abaixo. Depois do cadastro, você já entra na
            home.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Form {...form}>
            <form
              onSubmit={(e) => {
                void onSubmit(e);
              }}
              className="space-y-4"
              aria-busy={isPending}
            >
              <input type="hidden" {...form.register("invite")} />
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de exibição</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="name"
                        disabled={isPending}
                        className="min-h-11 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        disabled={isPending}
                        className="min-h-11 text-base"
                        placeholder="exemplo@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        disabled={isPending}
                        className="min-h-11 text-base"
                        aria-describedby="register-password-hints"
                        {...field}
                      />
                    </FormControl>
                    <RegisterPasswordHints password={password ?? ""} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        disabled={isPending}
                        className="min-h-11 text-base"
                        aria-describedby="register-password-match-hint"
                        {...field}
                      />
                    </FormControl>
                    <p
                      id="register-password-match-hint"
                      role={
                        (passwordConfirm?.length ?? 0) > 0
                          ? "status"
                          : undefined
                      }
                      aria-live={
                        (passwordConfirm?.length ?? 0) > 0
                          ? "polite"
                          : undefined
                      }
                      className={cn(
                        "text-sm",
                        (passwordConfirm?.length ?? 0) > 0 &&
                          "flex items-center gap-2",
                        (passwordConfirm?.length ?? 0) > 0
                          ? passwordsMatch
                            ? "text-chart-2"
                            : "text-muted-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {(passwordConfirm?.length ?? 0) > 0 ? (
                        passwordsMatch ? (
                          <>
                            <Check className="size-4 shrink-0" aria-hidden />
                            As senhas coincidem.
                          </>
                        ) : (
                          <>
                            <X className="size-4 shrink-0" aria-hidden />
                            As senhas ainda não coincidem. Confira os dois
                            campos.
                          </>
                        )
                      ) : (
                        "Digite novamente a mesma senha para confirmar."
                      )}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isPending}
                className="h-11 w-full min-h-11 cursor-pointer transition-opacity disabled:opacity-60"
              >
                {isPending ? "Enviando…" : "Cadastrar"}
              </Button>
              {isError && error ? (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-sm text-destructive"
                >
                  {error.message}
                </p>
              ) : null}
            </form>
          </Form>
          <div className="mt-6 flex justify-center border-t border-border/60 pt-4">
            <Button
              variant="link"
              className="h-11 min-h-11 cursor-pointer px-2"
              asChild
            >
              <Link href="/auth">Já tem conta? Entrar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

function RegisterMissingInvite() {
  return (
    <AuthShell
      brand={
        <AuthBrandPanel
          title="Cadastro fechado"
          description="O cadastro só é possível com um link de convite válido e dentro da validade de 24 horas."
        />
      }
    >
      <Card className="border-border/70 bg-card/95 text-card-foreground shadow-[0_18px_50px_-28px_oklch(0.25_0.05_264/0.45)] backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="font-[family-name:var(--font-auth-display)] text-2xl font-semibold tracking-tight">
            Precisa de um convite
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Peça a quem administra o Nosso TBR um novo convite se precisar de
            acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="h-11 w-full min-h-11" asChild variant="secondary">
            <Link href="/auth">Ir para entrar</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function ClientRegister() {
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite")?.trim() ?? "";

  if (!invite) {
    return <RegisterMissingInvite />;
  }

  return <RegisterForm key={invite} inviteToken={invite} />;
}
