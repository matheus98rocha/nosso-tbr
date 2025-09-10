"use client";

import React from "react";
import { Controller } from "react-hook-form";
import { ClientScheduleProps } from "../../types/schedule.types";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateScheduleForm } from "./hooks/useCreateScheduleForm";

export function CreateScheduleForm({
  id: bookId,
  startDate,
}: ClientScheduleProps) {
  const { onSubmit, isSubmitting, errors, register, control, handleSubmit } =
    useCreateScheduleForm({ id: bookId, startDate, title: "" });

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl h-fit">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Gerar Cronograma</CardTitle>
        <CardDescription>
          Preencha as informações abaixo para criar o cronograma de leitura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalChapters">Número de capítulos</Label>
            <Input
              id="totalChapters"
              type="number"
              {...register("totalChapters", {
                setValueAs: (val) => (val === "" ? undefined : Number(val)),
              })}
              placeholder="Digite o número de capítulos"
            />

            {errors.totalChapters && (
              <p className="text-red-500 text-sm">
                {errors.totalChapters.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data de início</Label>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <Input
                  id="startDate"
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
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              {...register("includePrologue")}
              className="w-4 h-4"
            />
            <Label htmlFor="includePrologue">Incluir prólogo</Label>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              {...register("includeEpilogue")}
              className="w-4 h-4"
            />
            <Label htmlFor="includeEpilogue">Incluir epilogo</Label>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              {...register("roundUp")}
              className="w-4 h-4"
            />
            <Label htmlFor="roundUp">
              Arredondar capítulos por dia para cima
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              {...register("includeWeekends")}
              className="w-4 h-4"
            />
            <Label htmlFor="includeWeekends">Incluir finais de semana</Label>
          </div>

          <CardFooter className="flex justify-end px-0">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Gerando..." : "Gerar Cronograma"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
