import { ScheduleUpsertService } from "@/modules/schedule/services/schedule.service";
import {
  ClientScheduleProps,
  ScheduleCreateValidator,
} from "@/modules/schedule/types/schedule.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScheduleFormInput } from "../types/createScheduleForm.types";
import { SubmitHandler } from "react-hook-form";
import { generateBookSchedule } from "@/modules/schedule/utils/generateBookSchedule";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleSchema } from "@/modules/schedule/validators/schedule.validator";
import { useMemo } from "react";

export function useCreateScheduleForm({
  id: bookId,
  startDate,
}: ClientScheduleProps) {
  const scheduleService = new ScheduleUpsertService();
  const queryClient = useQueryClient();

  const form = useForm<ScheduleFormInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      totalChapters: undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      includePrologue: false,
      roundUp: false,
      includeWeekends: false,
    },
  });

  const {
    formState: { errors, isSubmitting },
    register,
    control,
    handleSubmit,
  } = form;

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

  const startDateMemo = useMemo(
    () => (startDate ? new Date(startDate) : new Date()),
    [startDate]
  );

  return {
    form,
    onSubmit,
    isSubmitting,
    errors,
    register,
    control,
    handleSubmit,
    startDateMemo,
  };
}
