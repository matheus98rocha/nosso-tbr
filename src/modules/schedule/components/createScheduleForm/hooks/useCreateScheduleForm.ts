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
import { scheduleSchema } from "@/modules/schedule/components/createScheduleForm/validators/schedule.validator";
import { ChangeEvent, useCallback, useState } from "react";
import { useUserStore } from "@/stores/userStore";

export function useCreateScheduleForm({ id: bookId }: ClientScheduleProps) {
  const scheduleService = new ScheduleUpsertService();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const { user } = useUserStore();

  const form = useForm<ScheduleFormInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      totalChapters: undefined,
      startDate: undefined,
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
      setFormError("Erro ao criar cronograma. Tente novamente.");
      console.error("Erro ao criar cronograma:", error);
    },
  });

  const onSubmit: SubmitHandler<ScheduleFormInput> = async (data) => {
    console.log(data);

    setFormError(null);
    const isInvalidChaptersNumber =
      !data.totalChapters || data.totalChapters <= 0;

    if (isInvalidChaptersNumber) {
      setFormError("Número de capítulos inválido");
      return;
    }
    const isInvalidChaptersPerDay =
      data.chaptersPerDay !== null &&
      data.chaptersPerDay !== undefined &&
      data.chaptersPerDay <= 0;

    if (isInvalidChaptersPerDay) {
      setFormError("Número de capítulos por dia inválido");
      return;
    }

    const schedulePayloads: ScheduleCreateValidator[] = generateBookSchedule(
      data as Required<ScheduleFormInput>,
    ).map((day) => ({
      book_id: bookId,
      date: day.date,
      chapters: day.chapters,
      completed: false,
      chaptersPerDay: data.chaptersPerDay,
      owner: user?.id ?? "",
    }));

    await createScheduleMutation.mutateAsync(schedulePayloads);
  };

  const handleOnChangeIntField = useCallback(
    <T extends FieldValues>(
      field: ControllerRenderProps<T, Path<T>>,
      e: ChangeEvent<HTMLInputElement>,
    ) => {
      const val = e.target.value;
      const parsed = val === "" ? null : Number(val);
      field.onChange(parsed);
    },
    [],
  );

  function normalizeNumberField(value: unknown): number | null {
    const isInvalidValue = value === undefined || value === null;
    if (isInvalidValue) return null;
    return Number(value);
  }

  const isLoading = isSubmitting || createScheduleMutation.isPending;

  return {
    form,
    onSubmit,
    isLoading,
    errors,
    formError,
    register,
    control,
    handleSubmit,
    handleOnChangeIntField,
    normalizeNumberField,
  };
}
