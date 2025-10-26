import * as z from "zod";

export const scheduleSchema = z.object({
  totalChapters: z
    .number({
      message: "O número de capítulos é obrigatório",
    })
    .int("O número de páginas deve ser inteiro")
    .positive("O número de capítulos deve ser positivo"),
  startDate: z
    .date()
    .refine((val) => val instanceof Date && !isNaN(val.getTime()), {
      message: "Data de início é obrigatória",
    }),
  includePrologue: z.boolean().optional(),
  chaptersPerDay: z
    .number()
    .int("O número de capítulos por dia deve ser inteiro")
    .positive("O número de capítulos por dia deve ser positivo")
    .optional(),
  includeEpilogue: z.boolean().optional(),
  roundUp: z.boolean().optional(),
  includeWeekends: z.boolean().optional(),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;
