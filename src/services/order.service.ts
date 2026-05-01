import OrderModel from '../models/Order';
import Parcours from '../models/Parcours';
import Resource from '../models/Resource';
import { OrderCreate } from '../schemas/order.schema';
import { EmailService } from './email.service';
import mongoose from 'mongoose';
import { buildMongoQueryFromDynamicCriteria } from '../util/query-filter.util';

export type OrderListFilters = {
  type?: string;
  payment?: string;
  matricule?: string;
  designation?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dynamicCriteria?: Record<string, unknown>;
};

export class OrderService {
  /**
   * Création d'une commande avec validation métier
   */
  static async create(data: OrderCreate) {
    // 1. Valider le parcours
    const parcours = await Parcours.findById(data.parcoursId);
    if (!parcours) throw new Error('Parcours non trouvé');
    if (parcours.status === 'abandon' || parcours.status === 'suspendu') {
      throw new Error(`Impossible de commander avec un parcours au statut : ${parcours.status}`);
    }

    // 2. Valider la ressource
    const ressource = await Resource.findById(data.ressourceId);
    if (!ressource) throw new Error('Ressource non trouvée');

    // 3. Générer orderNumber (CMD-YYYY-RANDOM)
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CMD-${year}-${random}`;

    // 4. Générer la référence métier (REF-TYPE-YEAR-MATRICULE-RESOURCE_ID_SUFFIX)
    // On ajoute les 4 derniers caractères de l'ID de la ressource pour permettre plusieurs commandes de même type
    const ressourceIdSuffix = data.ressourceId.toString().slice(-4);
    const reference = `REF-${data.type.toUpperCase()}-${year}-${parcours.student.matricule}-${ressourceIdSuffix}`;

    // 5. Créer la commande
    const order = await OrderModel.create({
      ...data,
      orderNumber,
      reference,
    });

    // Si le paiement est déjà success à la création (rare mais possible)
    if (order.payment === 'success') {
      await this.triggerOrderWorkflow(order._id.toString());
    }

    return order;
  }

  /**
   * Liste des commandes pour un parcours (non-admin) : même filtres que l’admin,
   * mais limité au `parcoursId` fourni (impersonation côté client : prévoir auth en amont).
   */
  static async getOrdersForParcours(parcoursId: string, filters: OrderListFilters) {
    return this.listOrders(filters, { parcoursScope: parcoursId });
  }

  /**
   * Liste administrative avec filtres
   */
  static async getAdminOrders(filters: OrderListFilters) {
    return this.listOrders(filters, {});
  }

  private static async listOrders(
    filters: OrderListFilters,
    options: { parcoursScope?: string } = {},
  ) {
    const {
      type,
      payment,
      matricule,
      designation,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dynamicCriteria: rawDynamic = {},
    } = filters;

    const dynamicCriteria = { ...rawDynamic };
    if (options.parcoursScope) {
      delete dynamicCriteria.parcoursId;
    }

    const query: Record<string, unknown> = {
      ...buildMongoQueryFromDynamicCriteria(dynamicCriteria),
    };

    if (options.parcoursScope) {
      const scopeId = options.parcoursScope.trim();
      if (!mongoose.Types.ObjectId.isValid(scopeId)) {
        const error = new Error('Le paramètre parcoursId doit être un ObjectId valide.');
        (error as Error & { status?: number }).status = 400;
        throw error;
      }
      const parcoursDoc = await Parcours.findById(scopeId);
      if (!parcoursDoc) {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 10;
        return { data: [], total: 0, page: safePage, limit: safeLimit };
      }
      query.parcoursId = new mongoose.Types.ObjectId(scopeId);
      if (type) query.type = type;
      if (payment) query.payment = payment;
      // `matricule` est ignoré quand le périmètre parcours est imposé
    } else {
      if (type) query.type = type;
      if (payment) query.payment = payment;
      if (matricule) {
        const parcours = await Parcours.findOne({ 'student.matricule': matricule });
        if (parcours) query.parcoursId = parcours._id;
        else {
          const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
          const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 10;
          return { data: [], total: 0, page: safePage, limit: safeLimit };
        }
      }
    }

    const designationSearch = designation?.trim() || search?.trim();
    if (designationSearch) {
      const matchingResources = await Resource.find({
        designation: { $regex: designationSearch, $options: 'i' },
      }).select('_id');
      const resourceIds = matchingResources.map((resource) => resource._id);

      if (!resourceIds.length) {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 10;
        return { data: [], total: 0, page: safePage, limit: safeLimit };
      }

      const existingRessourceFilter = query.ressourceId;
      if (existingRessourceFilter) {
        query.$and = [
          { ressourceId: existingRessourceFilter },
          { ressourceId: { $in: resourceIds } },
        ];
        delete query.ressourceId;
      } else {
        query.ressourceId = { $in: resourceIds };
      }
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 10;
    const skip = (safePage - 1) * safeLimit;
    const sortDirection: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
    const sort: [string, 1 | -1][] = [[sortBy, sortDirection]];

    const [data, total] = await Promise.all([
      OrderModel.find(query)
        .populate('parcoursId')
        .populate('ressourceId')
        .skip(skip)
        .limit(safeLimit)
        .sort(sort),
      OrderModel.countDocuments(query),
    ]);

    return { data, total, page: safePage, limit: safeLimit };
  }

  /**
   * Détails d'une commande
   */
  static async getById(id: string) {
    return await OrderModel.findById(id)
      .populate('parcoursId')
      .populate('ressourceId');
  }

  /**
   * Mise à jour administrative (Validation, Note, Livraison)
   */
  static async updateOrder(id: string, updateData: any) {
    const order = await OrderModel.findById(id);
    if (!order) throw new Error('Commande non trouvée');

    const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, { new: true });
    
    // Déclenchement du workflow si le paiement passe à success
    if (updateData.payment === 'success' && order.payment !== 'success') {
      await this.triggerOrderWorkflow(id);
    }

    return updatedOrder;
  }

  /**
   * Workflow de traitement après paiement réussi
   */
  private static async triggerOrderWorkflow(orderId: string) {
    const order = await OrderModel.findById(orderId).populate('parcoursId ressourceId');
    if (!order) return;

    const student = (order.parcoursId as any).student;
    const ressource = (order.ressourceId as any);
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const downloadUrl = `${appUrl}/api/commandes/${order._id}/download`;
    const verificationUrl = `${appUrl}/api/commandes/verify/${order._id}`;

    // Envoi de l'email stylisé à l'étudiant
    await EmailService.sendDocumentReadyEmail(
      student.email,
      student.nomComplet,
      ressource.designation || order.type,
      downloadUrl,
      verificationUrl
    );

    // Notification aux administrateurs (optionnel, on garde les emails demandés)
    const adminEmails = [
      'nathan@elmes-solution.site',
      'lisongobaita@gmail.com',
      'electromecatronique01@gmail.com',
      'nathan.liosngo@inbtp.ac.cd'
    ];

    await EmailService.sendEmail({
      to: adminEmails,
      subject: `Notification : Document prêt - ${student.nomComplet}`,
      html: `
        <h1>Document Prêt</h1>
        <p>L'étudiant <strong>${student.nomComplet}</strong> (${student.matricule}) a payé pour le document : <strong>${ressource.designation}</strong>.</p>
        <p>Référence : ${order.reference}</p>
        <p>Lien de téléchargement : <a href="${downloadUrl}">${downloadUrl}</a></p>
      `
    });
  }
}

