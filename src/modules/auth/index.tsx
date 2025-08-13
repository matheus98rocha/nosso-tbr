"use client";

import { useLogin } from "./hooks/useLogin";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const { form, onSubmit, isLoading, isError, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gray-100">
      <Card className="mx-auto w-80 md:w-96 lg:w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Nosso TBR - Login
          </CardTitle>
          <CardDescription>
            Digite seu email e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                {...register("email", { required: "Email é obrigatório" })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...register("password", { required: "Senha é obrigatória" })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>

            {isError && error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
