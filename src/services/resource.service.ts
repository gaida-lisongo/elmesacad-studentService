import ResourceModel from '../models/Resource';

export class ResourceService {
  static async getAll(filters: { categorie?: string; status?: string; search?: string }) {
    const query: any = {};
    if (filters.categorie) query.categorie = filters.categorie;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.designation = { $regex: filters.search, $options: 'i' };
    }
    return await ResourceModel.find(query).sort({ createdAt: -1 });
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
