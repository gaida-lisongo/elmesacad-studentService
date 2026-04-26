import { z } from 'zod';

export const studentSchema = z.object({
  email: z.string().email(),
  matricule: z.string().min(1),
  sexe: z.enum(['M', 'F']),
  photo: z.string().url().optional(),
  nomComplet: z.string().min(1),
  nationalite: z.string().optional(),
  date_naissance: z.string().optional(),
  lieu_naissance: z.string().optional(),
});

export const programmeSchema = z.object({
  classe: z.string().min(1),
  filiere: z.string().min(1),
  credits: z.number().nonnegative(),
});

export const anneeSchema = z.object({
  debut: z.string().length(4),
  fin: z.string().length(4),
  slug: z.string().min(1),
});

export const parcoursCreateSchema = z.object({
  student: studentSchema,
  programme: programmeSchema,
  annee: anneeSchema,
  status: z.enum(['inscrit', 'suspendu', 'abandon', 'diplômé']).default('inscrit'),
  ncv: z.number().nonnegative().optional(),
  reference: z.string().min(1),
});

export const parcoursUpdateSchema = parcoursCreateSchema.partial().extend({
  _id: z.string(),
});

export const bulkParcoursCreateSchema = z.array(parcoursCreateSchema);
export const bulkParcoursUpdateSchema = z.array(parcoursUpdateSchema);

export type ParcoursCreate = z.infer<typeof parcoursCreateSchema>;
export type ParcoursUpdate = z.infer<typeof parcoursUpdateSchema>;
