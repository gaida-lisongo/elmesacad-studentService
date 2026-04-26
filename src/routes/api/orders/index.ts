import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../../../services/order.service';
import { EmailService } from '../../../services/email.service';
import { orderUnionSchema } from '../../../schemas/order.schema';

import { DocumentMappingService } from '../../../services/document-mapping.service';

const router = Router();

// --- Routes Étudiants ---

// GET /api/commandes/verify/:id - Vérification publique
router.get('/verify/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await OrderService.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    
    // On renvoie les infos essentielles pour la vérification
    res.json({
      success: true,
      verified: true,
      data: {
        orderNumber: order.orderNumber,
        reference: order.reference,
        type: order.type,
        student: order.parcoursId.student.nomComplet,
        status: order.payment,
        delivered: order.delivered
      }
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
    res.setHeader('Content-Disposition', `attachment; filename=${order.orderNumber}.pdf`);
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
    const filters = {
      type: req.query.type as string,
      payment: req.query.payment as string,
      matricule: req.query.matricule as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };
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
