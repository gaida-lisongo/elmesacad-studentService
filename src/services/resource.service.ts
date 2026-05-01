import ResourceModel from '../models/Resource';
import { buildMongoQueryFromDynamicCriteria } from '../util/query-filter.util';

export class ResourceService {
  static async getAll(filters: {
    categorie?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    dynamicCriteria?: Record<string, unknown>;
  }) {
    const {
      categorie,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dynamicCriteria = {},
    } = filters;

    const query: Record<string, unknown> = {
      ...buildMongoQueryFromDynamicCriteria(dynamicCriteria),
    };

    if (categorie?.trim()) query.categorie = categorie.trim();
    if (status?.trim()) query.status = status.trim();
    if (search?.trim()) {
      query.designation = { $regex: search.trim(), $options: 'i' };
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 10;
    const skip = (safePage - 1) * safeLimit;
    const sortDirection: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
    const sort: [string, 1 | -1][] = [[sortBy, sortDirection]];

    const [data, total] = await Promise.all([
      ResourceModel.find(query).sort(sort).skip(skip).limit(safeLimit),
      ResourceModel.countDocuments(query),
    ]);

    return { data, total, page: safePage, limit: safeLimit };
  }

  static async getById(id: string) {
    return await ResourceModel.findById(id);
  }

  static async create(data: any) {
    return await ResourceModel.create(data);
  }

  static async update(id: string, data: any) {
    return await ResourceModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string) {
    return await ResourceModel.findByIdAndDelete(id);
  }
}
