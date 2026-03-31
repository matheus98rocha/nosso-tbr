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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/modules/register/hooks/useRegister";
import {
  PASSWORD_RULE_LABELS,
  type PasswordRuleKey,
  getPasswordRuleStatuses,
} from "@/utils/passwordRules";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { useWatch } from "react-hook-form";

const PASSWORD_RULE_ORDER: PasswordRuleKey[] = [
  "minLength",
  "hasLetter",
  "hasNumber",
];

export default function ClientRegister() {
  const { form, onSubmit, isPending, isError, error, isSuccess } =
    useRegister();

  const password = useWatch({ control: form.control, name: "password" });
  const passwordConfirm = useWatch({
    control: form.control,
    name: "password_confirm",
  });

  const ruleStatuses = getPasswordRuleStatuses(password ?? "");
  const passwordsMatch =
    (passwordConfirm?.length ?? 0) > 0 && password === passwordConfirm;

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-muted p-4">
      <Card className="bg-card mx-auto w-full max-w-sm border-border text-card-foreground shadow-sm md:w-96 lg:w-[400px]">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <span
              className="inline-flex size-12 shrink-0 [&>svg]:size-full"
              aria-hidden
            >
              <LogoIcon />
            </span>
            Criar conta
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Junte-se a quem ama contar capítulos, páginas e histórias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                void onSubmit(e);
              }}
              className="space-y-4"
              aria-busy={isPending}
            >
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
                    <ul
                      id="register-password-hints"
                      className="mt-2 space-y-1.5 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                      role="list"
                      aria-label="Password requirements"
                    >
                      {PASSWORD_RULE_ORDER.map((key) => {
                        const ok = ruleStatuses[key];
                        return (
                          <li
                            key={key}
                            className="flex items-center gap-2"
                            role="listitem"
                          >
                            {ok ? (
                              <Check
                                className="size-4 shrink-0 text-chart-2"
                                aria-hidden
                              />
                            ) : (
                              <X
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden
                              />
                            )}
                            <span
                              className={cn(
                                ok && "font-medium text-foreground",
                              )}
                            >
                              {PASSWORD_RULE_LABELS[key]}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
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
                    {(passwordConfirm?.length ?? 0) > 0 ? (
                      <p
                        id="register-password-match-hint"
                        role="status"
                        aria-live="polite"
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          passwordsMatch
                            ? "text-chart-2"
                            : "text-muted-foreground",
                        )}
                      >
                        {passwordsMatch ? (
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
                        )}
                      </p>
                    ) : (
                      <p
                        id="register-password-match-hint"
                        className="text-sm text-muted-foreground"
                      >
                        Digite novamente a mesma senha para confirmar.
                      </p>
                    )}
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
              {isSuccess ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-sm text-chart-2"
                >
                  Cadastro concluído. Verifique seu e-mail se a confirmação
                  estiver ativa.
                </p>
              ) : null}
            </form>
          </Form>
          <div className="mt-6 flex justify-center border-t border-border pt-4">
            <Button
              variant="link"
              className="h-11 min-h-11 cursor-pointer px-2"
              asChild
            >
              <Link href="/auth">
                Já tem conta? Entrar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
