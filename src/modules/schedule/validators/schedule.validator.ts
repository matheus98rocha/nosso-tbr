// validators/schedule.validator.ts
import * as z from "zod";

export const scheduleSchema = z.object({
  totalChapters: z
    .number()
    .min(1, "O livro deve ter pelo menos 1 capítulo")
    .positive("O número de capítulos deve ser positivo"),
  startDate: z
    .date()
    .refine((val) => val instanceof Date && !isNaN(val.getTime()), {
      message: "Data de início é obrigatória",
    }),
  includePrologue: z.boolean().optional(),
  roundUp: z.boolean().optional(),
  includeWeekends: z.boolean().optional(),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;
