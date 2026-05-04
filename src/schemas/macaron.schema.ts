import { z } from 'zod';

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Identifiant MongoDB invalide');

const produitSchema = z.object({
  designation: z.string(),
  amount: z.number(),
  currency: z.string().optional(),
  categorie: z.string(),
  status: z.string().optional(),
  _id: objectIdString,
});

const transactionSchema = z.object({
  orderNumber: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  phoneNumber: z.string().optional(),
  microservice: z.record(z.string(), z.unknown()).optional(),
});

const ressourceCommandeSchema = z.object({
  reference: objectIdString,
  produit: z.string().optional(),
  categorie: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const commandeSchema = z.object({
  id: objectIdString,
  status: z.string(),
  ressource: ressourceCommandeSchema,
  transaction: transactionSchema.optional(),
  metadataCommande: z.record(z.string(), z.unknown()).optional(),
});

const promotionSchema = z.object({
  programmeDesignation: z.string().optional(),
  programmeFiliereSlug: z.string().optional(),
  studentCycle: z.string().optional(),
  studentDiplome: z.string().optional(),
  studentName: z.string().optional(),
});

const etudiantSchema = z.object({
  id: objectIdString.optional(),
  name: z.string(),
  matricule: z.string(),
  email: z.string().email(),
  telephone: z.string().optional(),
  ville: z.string().optional(),
  cycle: z.string().optional(),
  diplome: z.string().optional(),
  nationalite: z.string().optional(),
  sexe: z.enum(['M', 'F']).optional(),
});

const coursItemSchema = z.object({
  reference: objectIdString,
  designation: z.string(),
  credit: z.number(),
  /** Si absent, affichage « À définir » sur le macaron. */
  dateEpreuve: z.string().optional(),
});

/** Payload client pour génération du macaron de session (après paiement). */
export const macaronClientPayloadSchema = z.object({
  produit: produitSchema,
  commande: commandeSchema,
  annee: z.record(z.string(), z.unknown()).optional(),
  promotion: promotionSchema.optional(),
  etudiant: etudiantSchema,
  cours: z.array(coursItemSchema).min(1, 'Au moins une matière (cours) est requise'),
});

export type MacaronClientPayload = z.infer<typeof macaronClientPayloadSchema>;
