import { z } from 'zod';

export const parcoursStatusValues = ['inscrit', 'suspendu', 'abandon', 'diplômé'] as const;

export const studentSchema = z.object({
  email: z.string().email(),
  matricule: z.string().min(1),
  sexe: z.enum(['M', 'F']),
  /** Chaîne vide acceptée (souvent import Excel) — traitée comme absence de photo. */
  photo: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().url().optional(),
  ),
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
  status: z.enum(parcoursStatusValues).default('inscrit'),
  ncv: z.number().nonnegative().optional(),
  reference: z.string().min(1),
});

export const parcoursUpdateSchema = parcoursCreateSchema.partial().extend({
  _id: z.string(),
});

/** Corps attendu : `[ Parcours, ... ]`. Un seul niveau de tableau. */
export const bulkParcoursCreateSchema = z.array(parcoursCreateSchema);

/**
 * Accepte aussi le format par erreur client `[[ Parcours, ... ]]` (tableau doublement wrappé).
 */
export function normalizeBulkParcoursCreateBody(body: unknown): unknown {
  if (!Array.isArray(body)) return body;
  if (body.length === 1 && Array.isArray(body[0])) {
    return body[0];
  }
  return body;
}
export const bulkParcoursUpdateSchema = z.array(parcoursUpdateSchema);

/** Query string pour GET /api/parcours — filtres cumulés (ET), pagination optionnelle. */
export const parcoursListQuerySchema = z.object({
  search: z.string().optional(),
  /** Filtre `programme.classe` — alias accepté : `programme_classe`. */
  classe: z.string().optional(),
  programme_classe: z.string().optional(),
  /** `programme.filiere` — alias legacy : `filiere`. */
  filiere: z.string().optional(),
  programme_filiere: z.string().optional(),
  /** Slug année (`annee.slug`) — alias : `annee_slug`. */
  annee: z.string().optional(),
  annee_slug: z.string().optional(),
  status: z.enum(parcoursStatusValues).optional(),
  reference: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type ParcoursCreate = z.infer<typeof parcoursCreateSchema>;
export type ParcoursUpdate = z.infer<typeof parcoursUpdateSchema>;
