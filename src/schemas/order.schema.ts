import { z } from 'zod';

const sectionSchema = z.object({
  title: z.string().min(1),
  contenu: z.array(z.string()).min(1),
});

export const baseOrderSchema = z.object({
  parcoursId: z.string().min(1),
  ressourceId: z.string().min(1),
  telephone: z.string().min(1),
  payment: z.enum(['success', 'pending', 'failed']).default('pending'),
  delivered: z.boolean().default(false),
  validationStatus: z.enum(['pending', 'validated', 'rejected']).default('pending'),
  validationDate: z.string().optional(),
  validatedBy: z.string().optional(),
  type: z.enum(['labo', 'stage', 'sujet', 'session', 'resultat']),
});

export const orderLaboSchema = baseOrderSchema.extend({
  type: z.literal('labo'),
  cote: z.number().min(0).max(20).optional(),
  observation: z.string().optional(),
});

export const orderStageSchema = baseOrderSchema.extend({
  type: z.literal('stage'),
  stageTitle: z.string().min(1),
  recipientName: z.string().min(1),
  recipientQuality: z.string().min(1),
  recipientSex: z.enum(['M', 'F']),
  companyName: z.string().min(1),
  companyLocation: z.string().min(1),
  documentReference: z.string().optional(),
});

export type DocumentStagePayload = z.infer<typeof orderStageSchema> & {
    student: {
        fullName: string;
        matricule: string;
        email: string;
    }
};


export const orderSujetSchema = baseOrderSchema.extend({
  type: z.literal('sujet'),
  titre: z.string().min(1),
  directeur: z.string().min(1),
  co_directeur: z.string().min(1),
  thematique: z.string().min(1),
  justification: z.array(z.string()).min(1),
  problematique: z.array(z.string()).min(1),
  objectif: z.array(z.string()).min(1),
  methodologie: z.array(sectionSchema).min(1),
  resultats_attendus: z.array(sectionSchema).min(1),
  chronogrammes: z.array(sectionSchema).min(1),
  references: z.array(sectionSchema).min(1),
  note: z.number().nullable().optional(),
  validation: z.boolean().nullable().optional(),
  observations: z.any().optional(),
});

export const orderSessionSchema = baseOrderSchema.extend({
  type: z.literal('session'),
  bulletin: z.boolean().default(false),
  recoursIds: z.array(z.string()).default([]),
});

export const orderResultatSchema = baseOrderSchema.extend({
  type: z.literal('resultat'),
});

export const orderUnionSchema = z.discriminatedUnion('type', [
  orderLaboSchema,
  orderStageSchema,
  orderSujetSchema,
  orderSessionSchema,
  orderResultatSchema,
]);

export type OrderCreate = z.infer<typeof orderUnionSchema>;
