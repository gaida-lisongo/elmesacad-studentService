import Parcours, { IParcours } from '../models/Parcours';
import { ParcoursCreate, ParcoursUpdate } from '../schemas/parcours.schema';

export class ParcoursService {
  /**
   * Récupérer les parcours avec pagination et filtres
   */
  static async getAll(filters: {
    search?: string;
    filiere?: string;
    annee?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, filiere, annee, page = 1, limit = 10 } = filters;
    const query: any = {};

    if (search) {
      // Recherche exacte sur matricule ou partielle sur nomComplet
      query.$or = [
        { 'student.matricule': search },
        { 'student.nomComplet': { $regex: search, $options: 'i' } }
      ];
    }

    if (filiere) {
      query['programme.filiere'] = filiere;
    }

    if (annee) {
      query['annee.slug'] = annee;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Parcours.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Parcours.countDocuments(query)
    ]);

    return { data, total, page, limit };
  }

  /**
   * Création unitaire
   */
  static async create(data: ParcoursCreate) {
    return await Parcours.create(data);
  }

  /**
   * Création massive (Bulk)
   */
  static async bulkCreate(data: ParcoursCreate[]) {
    return await Parcours.bulkWrite(
      data.map(p => ({
        insertOne: { document: p }
      })),
      { ordered: false }
    );
  }

  /**
   * Mise à jour massive
   */
  static async bulkUpdate(data: ParcoursUpdate[]) {
    return await Parcours.bulkWrite(
      data.map(p => {
        const { _id, ...updateData } = p;
        return {
          updateOne: {
            filter: { _id },
            update: { $set: updateData },
          }
        };
      }),
      { ordered: false }
    );
  }

  /**
   * Suppression massive
   */
  static async bulkDelete(ids: string[]) {
    return await Parcours.deleteMany({ _id: { $in: ids } });
  }
}
