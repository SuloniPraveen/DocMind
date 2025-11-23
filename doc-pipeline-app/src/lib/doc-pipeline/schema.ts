import { z } from 'zod';

export const ExtractionSchema = z.object({
  documentType: z.string().min(1),
  authors: z.array(z.string().min(1)),
  date: z.string().min(1),
  contentSummary: z.string().min(1),
  methodsSummary: z.string().min(1),
  findingsSummary: z.string().min(1),
  conclusionsSummary: z.string().min(1),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
