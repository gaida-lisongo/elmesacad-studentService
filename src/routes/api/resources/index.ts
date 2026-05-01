import { Router, Request, Response, NextFunction } from 'express';
import { ResourceService } from '../../../services/resource.service';
import { resourceUnionSchema } from '../../../schemas/resource.schema';
import { parseJsonCriteria } from '../../../util/query-filter.util';

const router = Router();

// GET /api/resources - Liste pour étudiants et admin
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as Record<string, unknown>;
    const reservedKeys = new Set([
      'categorie',
      'status',
      'search',
      'designation',
      'page',
      'limit',
      'sortBy',
      'sortOrder',
      'criteria',
    ]);

    const rawCriteria = parseJsonCriteria(query.criteria);
    const dynamicCriteria = Object.fromEntries(
      Object.entries(query).filter(([key, value]) => {
        return !reservedKeys.has(key) && value !== undefined;
      }),
    );

    const filters = {
      categorie: query.categorie as string,
      status: query.status as string,
      search: (query.search as string) || (query.designation as string),
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      sortBy: (query.sortBy as string) || 'createdAt',
      sortOrder: ((query.sortOrder as string) === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
      dynamicCriteria: {
        ...rawCriteria,
        ...dynamicCriteria,
      },
    };
    const result = await ResourceService.getAll(filters);
    res.json({
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
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
