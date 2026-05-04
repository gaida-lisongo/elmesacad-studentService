import { z } from 'zod';
import mongoose from 'mongoose';

/** Payload pour la génération PDF de la couverture de sujet (protocole / mémoire). */
export const couvertureGeneratePayloadSchema = z.object({
  id: z
    .string()
    .min(1)
    .refine((id) => mongoose.Types.ObjectId.isValid(id), {
      message: 'id doit être un identifiant de commande (ObjectId) valide',
    }),
  titre: z.string().min(1),
  directeur: z.string().min(1),
  co_directeur: z.string().min(1),
  anneeAcad: z.string().min(1),
  /** Ex. `Licence` ou `Master` — utilisé par `DocumentSujet.generateText`. */
  cycle: z.string().min(1),
  /** Si absent, le nom est lu sur la commande `id` (parcours étudiant). */
  nom: z.string().min(1).optional(),
  /** Si renseignée, le cycle passé au PDF est `cycle` + `:` + `specialisation`. */
  specialisation: z.string().min(1).optional(),
});

export type CouvertureGeneratePayload = z.infer<typeof couvertureGeneratePayloadSchema>;
