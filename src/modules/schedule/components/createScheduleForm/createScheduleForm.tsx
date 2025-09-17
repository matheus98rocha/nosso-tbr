"use client";

import React from "react";
import { ClientScheduleProps } from "../../types/schedule.types";
import { useCreateScheduleForm } from "./hooks/useCreateScheduleForm";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

export function CreateScheduleForm({
  id: bookId,
  startDate,
}: ClientScheduleProps) {
  const {
    form,
    onSubmit,
    isLoading,
    handleOnChangeIntField,
    control,
    normalizeNumberField,
  } = useCreateScheduleForm({
    id: bookId,
    startDate,
    title: "",
  });

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl h-fit">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Gerar Cronograma</CardTitle>
        <CardDescription>
          Preencha as informações abaixo para criar o cronograma de leitura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="totalChapters"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Número de capítulos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={normalizeNumberField(field.value) ?? ""}
                        onChange={(e) => handleOnChangeIntField(field, e)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={control}
              name="chaptersPerDay"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>
                      Número de capítulos por dia (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={normalizeNumberField(field.value) ?? ""}
                        onChange={(e) => handleOnChangeIntField(field, e)}
                      />
                    </FormControl>
                    <FormDescription>
                      Se não informado, será usado o cálculo automático.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de início</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const { value } = e.target;
                        field.onChange(value ? new Date(value) : null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includePrologue"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Incluir prólogo</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeEpilogue"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Incluir epílogo</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roundUp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Arredondar capítulos por dia para cima</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeWeekends"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Incluir finais de semana</FormLabel>
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-end px-0">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? "Gerando..." : "Gerar Cronograma"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
