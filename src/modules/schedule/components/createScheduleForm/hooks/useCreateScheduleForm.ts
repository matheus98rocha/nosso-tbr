import { ScheduleUpsertService } from "@/modules/schedule/services/schedule.service";
import {
  ClientScheduleProps,
  ScheduleCreateValidator,
} from "@/modules/schedule/types/schedule.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScheduleFormInput } from "../types/createScheduleForm.types";
import {
  ControllerRenderProps,
  FieldValues,
  Path,
  SubmitHandler,
} from "react-hook-form";
import { generateBookSchedule } from "@/modules/schedule/utils/generateBookSchedule";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleSchema } from "@/modules/schedule/validators/schedule.validator";
import { ChangeEvent, useCallback, useMemo } from "react";

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
      includeEpilogue: false,
      includeWeekends: false,
      chaptersPerDay: undefined,
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
      chaptersPerDay: data.chaptersPerDay,
    }));

    await createScheduleMutation.mutateAsync(schedulePayloads);
  };

  const startDateMemo = useMemo(
    () => (startDate ? new Date(startDate) : new Date()),
    [startDate]
  );

  const handleOnChangeIntField = useCallback(
    <T extends FieldValues>(
      field: ControllerRenderProps<T, Path<T>>,
      e: ChangeEvent<HTMLInputElement>
    ) => {
      const val = e.target.value;
      const parsed = val === "" ? undefined : Number(val);
      field.onChange(parsed);
    },
    []
  );

  function normalizeNumberField(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    return Number(value);
  }

  const isLoading = isSubmitting || createScheduleMutation.isPending;

  return {
    form,
    onSubmit,
    isLoading,
    errors,
    register,
    control,
    handleSubmit,
    startDateMemo,
    handleOnChangeIntField,
    normalizeNumberField,
  };
}
