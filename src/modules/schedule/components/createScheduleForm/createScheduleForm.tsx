"use client";

import React, { useMemo } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { scheduleSchema } from "../../validators/schedule.validator";
import { ScheduleUpsertService } from "../../services/schedule.service";
import { ScheduleCreateValidator } from "../../types/schedule.types";
import { generateBookSchedule } from "../../utils/generateBookSchedule";
import { ClientScheduleProps } from "../..";

type ScheduleFormInput = {
  totalChapters: number;
  startDate: Date;
  includePrologue?: boolean;
  roundUp?: boolean;
  includeWeekends?: boolean;
};

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
      roundUp: true,
      includeWeekends: true,
    },
  });

  const scheduleService = new ScheduleUpsertService();

  const createScheduleMutation = useMutation({
    mutationFn: (schedules: ScheduleCreateValidator[]) =>
      scheduleService.createMany(schedules),
    onSuccess: () => {
      console.log("Cronograma criado com sucesso!");
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block mb-2">Número de capítulos</label>
        <input
          type="number"
          {...register("totalChapters", { valueAsNumber: true })}
          placeholder="Digite o número de capítulos"
          className="w-full p-2 border rounded"
        />
        {errors.totalChapters && (
          <p className="text-red-500 text-sm">{errors.totalChapters.message}</p>
        )}
      </div>

      <div>
        <label>Data de início</label>
        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <input
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
        {errors.startDate && <p>{errors.startDate.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("includePrologue")}
          className="w-4 h-4"
        />
        <label>Incluir prólogo</label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" {...register("roundUp")} className="w-4 h-4" />
        <label>Arredondar capítulos por dia para cima</label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("includeWeekends")}
          className="w-4 h-4"
        />
        <label>Incluir finais de semana</label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isSubmitting ? "Gerando..." : "Gerar Cronograma"}
      </button>
    </form>
  );
}
