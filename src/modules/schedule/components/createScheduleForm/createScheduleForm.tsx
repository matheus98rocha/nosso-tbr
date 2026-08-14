"use client";

import React from "react";
import { ClientScheduleProps } from "../../types/schedule.types";
import { useCreateScheduleForm } from "./hooks/useCreateScheduleForm";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";

export function CreateScheduleForm({ id: bookId }: ClientScheduleProps) {
  const { form, onSubmit, isLoading, handleOnChangeIntField, control } =
    useCreateScheduleForm({
      id: bookId,
      title: "",
    });

  return (
    <Card className="mx-auto h-fit w-full max-w-2xl gap-0 overflow-hidden rounded-2xl border-zinc-200 py-0 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <CardHeader className="border-b border-zinc-200 bg-zinc-50/80 px-5 py-6 dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          <Sparkles className="size-5 shrink-0 text-zinc-400" aria-hidden />
          Gerar cronograma
        </CardTitle>
        <CardDescription className="text-sm text-zinc-600 dark:text-zinc-400">
          Preencha os dados abaixo para montar um plano de leitura dia a dia.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <FormField
              control={form.control}
              name="totalChapters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="totalChapters">
                    Número de capítulos
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="totalChapters"
                      type="text"
                      inputMode="numeric"
                      className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => handleOnChangeIntField(field, e)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="chaptersPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="chaptersPerDay">
                    Capítulos por dia (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="chaptersPerDay"
                      type="text"
                      inputMode="numeric"
                      className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => handleOnChangeIntField(field, e)}
                    />
                  </FormControl>
                  <FormDescription>
                    Se vazio, usamos a distribuição automática.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="startDate">Data de início</FormLabel>
                  <FormControl>
                    <Input
                      id="startDate"
                      type="date"
                      className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const { value } = e.target;

                        if (value) {
                          const brazilDate = new Date(
                            `${value}T00:00:00-03:00`,
                          );
                          field.onChange(brazilDate);
                        } else {
                          field.onChange(null);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <FormField
                control={form.control}
                name="includePrologue"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        id="includePrologue"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel htmlFor="includePrologue" className="font-normal">
                      Incluir prólogo
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeEpilogue"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        id="includeEpilogue"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel htmlFor="includeEpilogue" className="font-normal">
                      Incluir epílogo
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roundUp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        id="roundUp"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel htmlFor="roundUp" className="font-normal">
                      Arredondar capítulos por dia para cima
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeWeekends"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        id="includeWeekends"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel htmlFor="includeWeekends" className="font-normal">
                      Incluir finais de semana
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="flex justify-end border-0 px-0 pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 cursor-pointer rounded-xl px-6"
              >
                {isLoading ? "Gerando…" : "Gerar cronograma"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
