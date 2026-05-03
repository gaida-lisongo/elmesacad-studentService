import { z } from 'zod';

const bulletinNoteElementSchema = z.object({
  designation: z.string(),
  cc: z.number(),
  examen: z.number(),
  rattrage: z.number(),
  credit: z.number(),
});

const bulletinNoteSchema = z.object({
  code: z.string(),
  unite: z.string(),
  credit: z.number(),
  moyenne: z.number(),
  elements: z.array(bulletinNoteElementSchema),
});

/** Payload client pour la génération du bulletin (fiche-validation / relevé consolidé). */
export const bulletinClientPayloadSchema = z.object({
  notes: z.array(bulletinNoteSchema).min(1, 'Au moins une unité d’enseignement est requise'),
  student: z
    .object({
      profile: z.string().optional(),
      nom: z.string(),
      sexe: z.string(),
      ville: z.string(),
    })
    .optional(),
  parcour: z
    .object({
      promotion: z.string(),
      systeme: z.string(),
      matricule: z.string(),
      annee: z.string(),
    })
    .optional(),
  contact: z
    .object({
      email: z.string(),
      telephone: z.string(),
      adresse: z.string(),
    })
    .optional(),
  document: z
    .object({
      type: z.string(),
      ressource: z.string(),
      detail: z.string(),
      reference: z.string(),
      dateCreate: z.string(),
      other: z.string().optional(),
    })
    .optional(),
  ressource: z
    .object({
      produit: z.string().optional(),
      categorie: z.string().optional(),
      reference: z.string().optional(),
      branding: z
        .object({
          institut: z.string().optional(),
          section: z.string().optional(),
          sectionRef: z.string().optional(),
          chef: z.string().optional(),
          contact: z.string().optional(),
          email: z.string().optional(),
          adresse: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type BulletinClientPayload = z.infer<typeof bulletinClientPayloadSchema>;
