import { z } from 'zod';

export const SupportedImageMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
] as const;

export const ToolNameSchema = z.enum([
  'create_local_task',
  'append_work_note',
  'mark_task_complete',
]);

export const CreateLocalTaskArgsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(120, 'Task title must be at most 120 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Task description must be at most 500 characters')
    .optional(),
});

export const AppendWorkNoteArgsSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Work note text is required')
    .max(1000, 'Work note text must be at most 1000 characters'),
  category: z
    .enum(['observation', 'action_item', 'debug', 'general'])
    .optional()
    .default('general'),
});

export const MarkTaskCompleteArgsSchema = z.object({
  taskId: z
    .string()
    .trim()
    .min(1, 'Task ID is required')
    .max(50, 'Task ID must be at most 50 characters'),
});

export const PlanStepSchema = z.object({
  id: z.string().trim().min(1, 'Step ID is required'),
  tool: ToolNameSchema,
  args: z.record(z.any()),
  rationale: z
    .string()
    .trim()
    .min(1, 'Step rationale is required')
    .max(300, 'Step rationale must be at most 300 characters'),
});

export const PlanResponseSchema = z.object({
  observation: z
    .string()
    .trim()
    .min(5, 'Visual observation must be at least 5 characters'),
  goalInterpretation: z
    .string()
    .trim()
    .min(5, 'Goal interpretation must be at least 5 characters'),
  steps: z
    .array(PlanStepSchema)
    .min(1, 'Plan must contain at least 1 step')
    .max(4, 'Plan cannot exceed 4 steps (safety cap)'),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .optional()
    .default('high'),
});

export const PlanRequestSchema = z.object({
  imageBase64: z
    .string()
    .min(1, 'Screenshot image is required'),
  mimeType: z
    .string()
    .refine((val) => (SupportedImageMimeTypes as readonly string[]).includes(val.toLowerCase()), {
      message: 'Supported image types are PNG, JPEG, WEBP, and GIF',
    }),
  goal: z
    .string()
    .trim()
    .min(2, 'Goal description must be at least 2 characters')
    .max(500, 'Goal description must be at most 500 characters'),
});

export const ExecuteStepRequestSchema = z.object({
  step: PlanStepSchema,
});

export const ExecutePlanRequestSchema = z.object({
  steps: z.array(PlanStepSchema).min(1).max(4),
});

/**
 * Validates tool arguments strictly based on tool name.
 * Unknown tools or invalid arguments fail closed.
 */
export function validateToolArgs(tool: string, rawArgs: unknown) {
  switch (tool) {
    case 'create_local_task':
      return CreateLocalTaskArgsSchema.safeParse(rawArgs);
    case 'append_work_note':
      return AppendWorkNoteArgsSchema.safeParse(rawArgs);
    case 'mark_task_complete':
      return MarkTaskCompleteArgsSchema.safeParse(rawArgs);
    default:
      return {
        success: false as const,
        error: new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            message: `Unknown or unallowed tool: '${tool}'. Failing closed for safety.`,
            path: ['tool'],
          },
        ]),
      };
  }
}
