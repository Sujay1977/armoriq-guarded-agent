
import { z } from 'zod';

export const calculatorTool = {
  name: 'calculator',
  description: 'Evaluate simple mathematical expressions.',
  schema: z.object({
    expression: z.string().min(1)
  }),
  execute: async ({ expression }) => {
    try {
      if (!/^[0-9+\-*/\s().]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
      }
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expression}`)();
      return { result };
    } catch (e) {
      throw new Error(`Calculation error: ${e.message}`);
    }
  }
};
