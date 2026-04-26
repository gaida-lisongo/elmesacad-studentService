import { Router, Request, Response, NextFunction } from 'express';
import { ParcoursService } from '../../../services/parcours.service';
import { 
  parcoursCreateSchema, 
  bulkParcoursCreateSchema, 
  bulkParcoursUpdateSchema 
} from '../../../schemas/parcours.schema';
import { z } from 'zod';

const router = Router();

// GET /api/parcours
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      search: req.query.search as string,
      filiere: req.query.filiere as string,
      annee: req.query.annee as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const result = await ParcoursService.getAll(filters);
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

// POST /api/parcours (Unitaire ou Bulk)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (Array.isArray(req.body)) {
      const validatedData = bulkParcoursCreateSchema.parse(req.body);
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

// DELETE /api/parcours (Bulk delete)
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);
    const result = await ParcoursService.bulkDelete(ids);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
