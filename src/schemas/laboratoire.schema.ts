import { z } from 'zod';

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Identifiant MongoDB invalide');

/** Placeholders type GraphQL cache (`$0:0:…`) : ignorés à la validation. */
const looseMetadata = z.union([z.record(z.string(), z.unknown()), z.string()]).optional();

const descriptionSectionSchema = z.object({
  title: z.string(),
  contenu: z.array(z.string()),
});

const produitLaboSchema = z.object({
  _id: objectIdString,
  designation: z.string(),
  description: z.array(descriptionSectionSchema).optional(),
  amount: z.number(),
  currency: z.string().optional(),
  categorie: z.string(),
  status: z.string().optional(),
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
  metadata: looseMetadata,
});

const commandeLaboSchema = z.object({
  id: objectIdString,
  status: z.string(),
  ressource: ressourceCommandeSchema,
  transaction: transactionSchema.optional(),
  metadataCommande: looseMetadata,
});

const promotionLaboSchema = z.object({
  programmeDesignation: z.string().optional(),
  programmeFiliereSlug: z.string().optional(),
  studentCycle: z.string().optional(),
  studentDiplome: z.string().optional(),
  studentName: z.string().optional(),
});

const etudiantLaboSchema = z.object({
  id: objectIdString.optional(),
  name: z.string(),
  matricule: z.string(),
  email: z.string().email(),
  telephone: z.string().optional(),
  ville: z.string().optional(),
  cycle: z.string().optional(),
  diplome: z.string().optional(),
  nationalite: z.string().optional(),
  lieuDeNaissance: z.string().optional(),
  dateDeNaissance: z.coerce.date().optional(),
  adresse: z.string().optional(),
  status: z.string().optional(),
  sexe: z.enum(['M', 'F']).optional(),
});

const brandingLaboSchema = z.object({
  institut: z.string().optional(),
  section: z.string().optional(),
  sectionRef: z.string().optional(),
  chef: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  adresse: z.string().optional(),
});

const ressourceClientSchema = z.object({
  produit: z.string(),
  categorie: z.string(),
  reference: objectIdString,
  branding: z.union([brandingLaboSchema, z.string()]).optional(),
});

export const laboratoireSingleClientSchema = z.object({
  commande: commandeLaboSchema,
  produit: produitLaboSchema,
  promotion: promotionLaboSchema.optional(),
  etudiant: etudiantLaboSchema,
  /** Conservé pour alignement avec le client ; le PDF labo n’affiche pas encore ce bloc séparément. */
  branding: brandingLaboSchema.optional(),
  ressource: ressourceClientSchema,
});

export const laboratoireClientPayloadSchema = z.union([
  laboratoireSingleClientSchema,
  z.array(laboratoireSingleClientSchema).length(1, 'Le tableau doit contenir exactement un bon de laboratoire'),
]);

export type LaboratoireSingleClientPayload = z.infer<typeof laboratoireSingleClientSchema>;
export type LaboratoireClientPayload = z.infer<typeof laboratoireClientPayloadSchema>;
