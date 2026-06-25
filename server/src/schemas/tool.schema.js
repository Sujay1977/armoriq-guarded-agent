/**
 * @fileoverview Tool Validation Schemas
 */
import { z } from 'zod';
export const toolExecutionSchema = z.object({
  toolName: z.string(),
  parameters: z.record(z.any()),
});
