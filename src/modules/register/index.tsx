"use client";

import { Button } from "@/components/ui/button";
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

export default function ClientRegister() {
  const { form, onSubmit, isPending, isError, error, isSuccess } =
    useRegister();

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="space-y-4 w-full max-w-sm"
        aria-label="User registration form"
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
                  aria-label="Display name"
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
                  aria-label="Email"
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
                  aria-label="Password"
                  minLength={8}
                  {...field}
                />
              </FormControl>
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
                  aria-label="Confirm password"
                  minLength={8}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending}
          className="w-full min-h-11 cursor-pointer transition-opacity disabled:opacity-60"
          aria-label="Submit registration"
        >
          {isPending ? "Enviando…" : "Cadastrar"}
        </Button>
        {isError && error ? (
          <p role="alert" aria-live="polite" className="text-sm text-red-600">
            {error.message}
          </p>
        ) : null}
        {isSuccess ? (
          <p role="status" aria-live="polite" className="text-sm text-green-700">
            Cadastro concluído. Verifique seu e-mail se a confirmação estiver
            ativa.
          </p>
        ) : null}
      </form>
    </Form>
  );
}
