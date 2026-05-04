import { Router, Request, Response, NextFunction } from 'express';
import { OrderService, type OrderListFilters } from '../../../services/order.service';
import { EmailService } from '../../../services/email.service';
import { orderUnionSchema } from '../../../schemas/order.schema';

import { DocumentMappingService } from '../../../services/document-mapping.service';
import { parseJsonCriteria } from '../../../util/query-filter.util';
import {
  buildVerificationOrderView,
  renderVerificationNotFoundPage,
  renderVerificationOrderPage,
} from '../../../util/verification-order-page';

const router = Router();

const ORDER_LIST_QUERY_RESERVED = new Set([
  'type',
  'payment',
  'matricule',
  'search',
  'designation',
  'page',
  'limit',
  'sortBy',
  'sortOrder',
  'criteria',
]);

function buildOrderListFilters(
  query: Record<string, unknown>,
  reservedKeys: Set<string>,
): OrderListFilters {
  const rawCriteria = parseJsonCriteria(query.criteria);
  const dynamicCriteria = Object.fromEntries(
    Object.entries(query).filter(([key, value]) => {
      return !reservedKeys.has(key) && value !== undefined;
    }),
  );

  return {
    type: query.type as string,
    payment: query.payment as string,
    matricule: query.matricule as string,
    search: query.search as string,
    designation: query.designation as string,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
    sortBy: (query.sortBy as string) || 'createdAt',
    sortOrder: ((query.sortOrder as string) === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
    dynamicCriteria: {
      ...rawCriteria,
      ...dynamicCriteria,
    },
  };
}

// --- Routes Étudiants ---

// GET /api/commandes/verify/:id - Vérification publique (JSON pour intégrations, HTML pour navigateur)
router.get('/verify/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getById(req.params.id);
    if (!order) {
      return res.status(404).format({
        'application/json': () =>
          res.json({ success: false, error: 'Commande non trouvée' }),
        'text/html': () => res.type('html').send(renderVerificationNotFoundPage()),
        default: () => res.json({ success: false, error: 'Commande non trouvée' }),
      });
    }

    const verificationJson = {
      success: true,
      verified: true,
      data: {
        orderNumber: order.orderNumber,
        reference: order.reference,
        type: order.type,
        student: order.parcoursId.student.nomComplet,
        status: order.payment,
        delivered: order.delivered,
      },
    };

    res.format({
      'application/json': () => res.json(verificationJson),
      'text/html': () => {
        const view = buildVerificationOrderView(order);
        res.type('html').send(renderVerificationOrderPage(view));
      },
      default: () => res.json(verificationJson),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/commandes/:id/download - Téléchargement du document
router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    if (order.payment !== 'success') return res.status(403).json({ success: false, error: 'Paiement non confirmé' });

    const buffer = await DocumentMappingService.generateDocumentBuffer(order);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${order.orderNumber}.pdf`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// POST /api/commandes - Soumission d'une commande
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = orderUnionSchema.parse(req.body);
    const order = await OrderService.create(validatedData);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// Route de test pour l'envoi de mail manuel
// Placée AVANT /:id pour éviter que "test" ne soit pris pour un ID
router.post('/test/email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emails = [
      'nathan@elmes-solution.site',
      'lisongobaita@gmail.com',
      'electromecatronique01@gmail.com',
      'nathan.liosngo@inbtp.ac.cd'
    ];
    
    const result = await EmailService.sendEmail({
      to: emails,
      subject: "Test Envoi de Mail - Student Service",
      html: "<h1>Test Réussi</h1><p>Ceci est un test manuel d'envoi de mail groupé.</p>"
    });
    
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// GET /api/commandes - Liste paginée (non-admin) : filtrée par parcours
// Déclarée AVANT /:id pour ne pas confondre avec un identifiant.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as Record<string, unknown>;
    const parcoursId = (query.parcoursId as string)?.trim();
    if (!parcoursId) {
      return res.status(400).json({
        success: false,
        error: 'Le paramètre query parcoursId est obligatoire pour lister les commandes.',
      });
    }

    const reserved = new Set(ORDER_LIST_QUERY_RESERVED);
    reserved.add('parcoursId');

    const filters = buildOrderListFilters(query, reserved);
    const result = await OrderService.getOrdersForParcours(parcoursId, filters);
    res.json({
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/commandes/:id - Détails d'une commande
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// --- Routes Admin ---

// GET /api/commandes/admin/list - Liste administrative
router.get('/admin/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as Record<string, unknown>;
    const filters = buildOrderListFilters(query, ORDER_LIST_QUERY_RESERVED);
    const result = await OrderService.getAdminOrders(filters);
    res.json({
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/commandes/admin/:id - Mise à jour (Validation, Note, Livraison)
router.patch('/admin/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.updateOrder(req.params.id, req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export default router;
