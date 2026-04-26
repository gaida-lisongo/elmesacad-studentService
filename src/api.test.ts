import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('API Tests', () => {
  it('should return 200 for the root endpoint', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Student Service API is running');
  });

  it('should return 200 for GET /api/parcours', async () => {
    const res = await request(app).get('/api/parcours');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should create a new Labo resource', async () => {
    const laboResource = {
      categorie: 'labo',
      designation: 'Analyse des sols',
      description: [{ title: 'Objectif', contenu: ['Mesurer la porosité'] }],
      amount: 50,
      currency: 'USD',
      status: 'active',
      matiere: { reference: 'MAT001', designation: 'Géotechnique', credit: '5' },
      titulaire: { reference: 'PROF001', email: 'prof@inbtp.ac.cd', matricule: 'M123', nom: 'Jean Dupont' }
    };
    const res = await request(app).post('/api/resources').send(laboResource);
    expect(res.status).toBe(201);
    expect(res.body.data.categorie).toBe('labo');
  });
});
