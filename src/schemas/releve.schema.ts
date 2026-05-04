import { z } from 'zod';

const releveElementSchema = z.object({
  designation: z.string(),
  credit: z.number(),
  cc: z.number(),
  examen: z.number(),
  noteSession: z.number(),
  rattrapage: z.number(),
  rachat: z.number(),
  noteFinale: z.number(),
});

const releveUnitSchema = z.object({
  semestre: z.string(),
  code: z.string(),
  designation: z.string(),
  statut: z.enum(['V', 'NV']),
  credit: z.number(),
  moyenne: z.number(),
  elements: z.array(releveElementSchema),
});

const releveSummarySchema = z.object({
  ncv: z.number(),
  ncnv: z.number(),
  totalObtenu: z.number(),
  totalMax: z.number(),
  pourcentage: z.number(),
  mention: z.string(),
  decision: z.string(),
});

const releveBrandingSchema = z.object({
  institut: z.string().optional(),
  section: z.string().optional(),
  sectionRef: z.string().optional(),
  chef: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  adresse: z.string().optional(),
  /** Titre affiché sous la signature (ex. « Chef de Section »). */
  chefTitre: z.string().optional(),
});

/** Un relevé (fiche envoyée par le client). `verificationUrl` est ignorée si présente — construite côté serveur. */
export const releveSingleClientSchema = z.object({
  studentName: z.string(),
  studentVille: z.string(),
  studentDateNaiss: z.coerce.date(),
  studentEmail: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  studentPhone: z.union([z.string(), z.literal(''), z.null()]).optional(),
  matricule: z.string(),
  programmeName: z.string(),
  anneeAcad: z.string(),
  orderReference: z.string().min(1, 'orderReference requis pour la vérification'),
  serialNumber: z.string(),
  units: z.array(releveUnitSchema).min(1, 'Au moins une unité est requise'),
  summary: releveSummarySchema,
  verificationUrl: z.string().url().optional(),
  branding: releveBrandingSchema.optional(),
});

export const releveClientPayloadSchema = z.union([
  releveSingleClientSchema,
  z
    .array(releveSingleClientSchema)
    .length(1, 'Le tableau doit contenir exactement un relevé'),
]);

export type ReleveSingleClientPayload = z.infer<typeof releveSingleClientSchema>;
export type ReleveClientPayload = z.infer<typeof releveClientPayloadSchema>;
