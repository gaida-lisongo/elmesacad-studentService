import { Router, Request, Response, NextFunction } from 'express';
import { ParcoursService } from '../../../services/parcours.service';
import { 
  parcoursCreateSchema, 
  bulkParcoursCreateSchema, 
  bulkParcoursUpdateSchema,
  parcoursListQuerySchema,
  normalizeBulkParcoursCreateBody,
} from '../../../schemas/parcours.schema';
import { z } from 'zod';

const router = Router();

const studentEmailQuerySchema = z.object({
  email: z
    .string({ required_error: 'Le paramètre email est requis' })
    .min(1)
    .email('Adresse email invalide'),
});

// GET /api/parcours/by-student-email?email=etudiant@ecole.cd
// (déclaré avant GET / pour ne pas être confondu avec une autre route)
router.get('/by-student-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = studentEmailQuerySchema.parse({ email: req.query.email });
    const data = await ParcoursService.findByStudentEmail(email);
    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/parcours — filtres cumulés (ET) : voir parcoursListQuerySchema
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = parcoursListQuerySchema.parse(req.query);
    const programmeClasse = q.programme_classe?.trim() || q.classe?.trim();
    const programmeFiliere = q.programme_filiere?.trim() || q.filiere?.trim();
    const anneeSlug = q.annee_slug?.trim() || q.annee?.trim();

    const result = await ParcoursService.getAll({
      search: q.search?.trim(),
      programmeClasse,
      programmeFiliere,
      anneeSlug,
      status: q.status,
      reference: q.reference?.trim(),
      page: q.page,
      limit: q.limit,
    });
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/parcours (Unitaire ou Bulk — corps : tableau direct ou par erreur `[ [ ... ] ]`)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (Array.isArray(req.body)) {
      const flattened = normalizeBulkParcoursCreateBody(req.body);
      const validatedData = bulkParcoursCreateSchema.parse(flattened);
      const result = await ParcoursService.bulkCreate(validatedData);
      res.status(201).json({ success: true, data: result });
    } else {
      const validatedData = parcoursCreateSchema.parse(req.body);
      const result = await ParcoursService.create(validatedData);
      res.status(201).json({ success: true, data: result });
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/parcours (Bulk update)
router.patch('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = bulkParcoursUpdateSchema.parse(req.body);
    const result = await ParcoursService.bulkUpdate(validatedData);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/parcours (Bulk delete — corps JSON)
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);
    const result = await ParcoursService.bulkDelete(ids);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

const objectIdParam = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Identifiant MongoDB invalide'),
});

// DELETE /api/parcours/:id — suppression unitaire (déclaré après les routes « fixes »)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = objectIdParam.parse(req.params);
    const deleted = await ParcoursService.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Parcours non trouvé' });
    }
    return res.json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
});

export default router;
