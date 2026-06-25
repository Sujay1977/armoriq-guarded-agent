
import { z } from 'zod';

const knowledgeBase = {
  "company policy": "Our company policy mandates a security-first approach, regular audits, and zero-trust architecture.",
  "refund policy": "Refunds are processed within 7-10 business days for eligible transactions.",
  "contact": "You can reach support at support@armoriq.com"
};

export const knowledgeTool = {
  name: 'knowledge',
  description: 'Retrieve answers from local knowledge base',
  schema: z.object({
    query: z.string().min(1)
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();
    for (const [key, value] of Object.entries(knowledgeBase)) {
      if (q.includes(key)) {
        return { answer: value };
      }
    }
    return { answer: "I could not find an answer to your query in the knowledge base." };
  }
};
