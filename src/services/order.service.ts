import OrderModel from '../models/Order';
import Parcours from '../models/Parcours';
import Resource from '../models/Resource';
import { OrderCreate } from '../schemas/order.schema';
import { EmailService } from './email.service';
import mongoose from 'mongoose';

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

    // 4. Générer la référence métier (REF-TYPE-YEAR-MATRICULE)
    const reference = `REF-${data.type.toUpperCase()}-${year}-${parcours.student.matricule}`;

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
   * Liste administrative avec filtres
   */
  static async getAdminOrders(filters: {
    type?: string;
    payment?: string;
    matricule?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, payment, matricule, page = 1, limit = 10 } = filters;
    const query: any = {};

    if (type) query.type = type;
    if (payment) query.payment = payment;
    if (matricule) {
      // On doit d'abord trouver le parcours lié au matricule
      const parcours = await Parcours.findOne({ 'student.matricule': matricule });
      if (parcours) query.parcoursId = parcours._id;
      else return { data: [], total: 0, page, limit };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      OrderModel.find(query)
        .populate('parcoursId')
        .populate('ressourceId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      OrderModel.countDocuments(query),
    ]);

    return { data, total, page, limit };
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

    const emails = [
      'nathan@elmes-solution.site',
      'lisongobaita@gmail.com',
      'electromecatronique01@gmail.com',
      'nathan.liosngo@inbtp.ac.cd'
    ];

    await EmailService.sendEmail({
      to: emails,
      subject: `Confirmation de paiement - Commande ${order.orderNumber}`,
      html: `
        <h1>Paiement Confirmé</h1>
        <p>La commande <strong>${order.orderNumber}</strong> (${order.type}) a été payée avec succès.</p>
        <p>Référence : ${order.reference}</p>
        <p>Lien de suivi : <a href="https://elmes-acad.com/orders/${order._id}">Cliquez ici pour suivre votre commande</a></p>
      `
    });
  }
}

