import { Router, Request, Response, NextFunction } from 'express';
import { ResourceService } from '../../../services/resource.service';
import { resourceUnionSchema } from '../../../schemas/resource.schema';

const router = Router();

// GET /api/resources - Liste pour étudiants et admin
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      categorie: req.query.categorie as string,
      status: req.query.status as string,
      search: req.query.search as string,
    };
    const resources = await ResourceService.getAll(filters);
    res.json({ success: true, data: resources });
  } catch (error) {
    next(error);
  }
});

// GET /api/resources/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resource = await ResourceService.getById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
});

// POST /api/resources - Admin CRUD
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = resourceUnionSchema.parse(req.body);
    const resource = await ResourceService.create(validatedData);
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/resources/:id - Admin CRUD
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Note: Pour le patch, on pourrait utiliser un schéma partiel si besoin
    const resource = await ResourceService.update(req.params.id, req.body);
    res.json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/resources/:id - Admin CRUD
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ResourceService.delete(req.params.id);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
