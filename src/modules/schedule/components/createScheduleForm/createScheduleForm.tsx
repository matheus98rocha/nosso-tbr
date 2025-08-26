"use client";

import React, { useMemo } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleSchema } from "../../validators/schedule.validator";
import { ScheduleUpsertService } from "../../services/schedule.service";
import {
  ClientScheduleProps,
  ScheduleCreateValidator,
} from "../../types/schedule.types";
import { generateBookSchedule } from "../../utils/generateBookSchedule";
import { ScheduleFormInput } from "./types/createScheduleForm.types";

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

export function CreateScheduleForm({
  id: bookId,
  startDate,
}: ClientScheduleProps) {
  const startDateMemo = useMemo(
    () => (startDate ? new Date(startDate) : new Date()),
    [startDate]
  );

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ScheduleFormInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      totalChapters: undefined,
      startDate: startDateMemo,
      includePrologue: false,
      roundUp: false,
      includeWeekends: false,
    },
  });

  const scheduleService = new ScheduleUpsertService();
  const queryClient = useQueryClient();

  const createScheduleMutation = useMutation({
    mutationFn: (schedules: ScheduleCreateValidator[]) =>
      scheduleService.createMany(schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
    onError: (error) => {
      console.error("Erro ao criar cronograma:", error);
    },
  });

  const onSubmit: SubmitHandler<ScheduleFormInput> = async (data) => {
    if (!data.totalChapters || data.totalChapters <= 0) {
      console.error("Número de capítulos inválido");
      return;
    }

    const schedulePayloads: ScheduleCreateValidator[] = generateBookSchedule(
      data as Required<ScheduleFormInput>
    ).map((day) => ({
      book_id: bookId,
      date: day.date,
      chapters: day.chapters,
      completed: false,
    }));

    await createScheduleMutation.mutateAsync(schedulePayloads);
  };

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
                    const value = e.target.value;
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
