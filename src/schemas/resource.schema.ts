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
});

const matiereSchema = z.object({
  reference: z.string(),
  designation: z.string(),
  credit: z.string(),
});

const userRefSchema = z.object({
  reference: z.string(),
  email: z.string().email(),
  matricule: z.string(),
  nom: z.string(),
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
    debut: z.string(),
    fin: z.string(),
    slug: z.string(),
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
