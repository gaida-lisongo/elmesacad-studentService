import { z } from 'zod';

export const sectionSchema = z.object({
  title: z.string().min(1),
  contenu: z.array(z.string()),
});

export const baseResourceSchema = z.object({
  categorie: z.string().min(1),
  designation: z.string().min(1),
  description: z.array(sectionSchema),
  amount: z.number().nonnegative(),
  currency: z.string().default('USD'),
  status: z.string().default('active'),
  branding: z.object({
    institut: z.string().default('INBTP'),
    section: z.string().optional().default(''),
    sectionRef: z.string().optional().default(''),
    chef: z.string().optional().default(''),
    contact: z.string().optional().default(''),
    email: z.string().optional().default(''),
    adresse: z.string().optional().default(''),
  }).optional().default({}),
});

const matiereSchema = z.object({
  reference: z.string().min(1),
  designation: z.string().optional().default(''),
  credit: z.string().optional().default(''),
});

const userRefSchema = z.object({
  reference: z.string().optional().default(''),
  email: z.string().optional().default(''),
  matricule: z.string().optional().default(''),
  nom: z.string().min(1),
});

export const resourceLaboSchema = baseResourceSchema.extend({
  matiere: matiereSchema,
  titulaire: userRefSchema,
  note: z.number().optional(),
});

export const resourceStageSchema = baseResourceSchema.extend({
  matiere: matiereSchema,
  titulaire: userRefSchema,
  note: z.number().optional(),
});

export const resourceSujetSchema = baseResourceSchema.extend({
  matiere: matiereSchema.omit({ designation: true }),
  lecteurs: z.array(userRefSchema),
  note: z.number().optional(),
});

export const resourceSessionSchema = baseResourceSchema.extend({
  matieres: z.array(matiereSchema),
});

export const resourceResultatSchema = baseResourceSchema.extend({
  programme: z.object({
    classe: z.string(),
    filiere: z.string(),
    credits: z.number(),
  }),
  annee: z.object({
    debut: z.string().optional().default(''),
    fin: z.string().optional().default(''),
    slug: z.string().min(1),
  }),
  categorie: z.enum(['validation', 'releve']),
});

export const resourceUnionSchema = z.discriminatedUnion('categorie', [
  resourceLaboSchema.extend({ categorie: z.literal('labo') }),
  resourceStageSchema.extend({ categorie: z.literal('stage') }),
  resourceSujetSchema.extend({ categorie: z.literal('sujet') }),
  resourceSessionSchema.extend({ categorie: z.literal('session') }),
  resourceResultatSchema.extend({ categorie: z.literal('validation') }),
  resourceResultatSchema.extend({ categorie: z.literal('releve') }),
]);
