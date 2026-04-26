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

  it('should reject a CommandeSujet if objectif is empty', async () => {
    const invalidSujet = {
      type: 'sujet',
      parcoursId: '65f1a2b3c4d5e6f7a8b9c0d1', // Fake ID
      ressourceId: '65f1a2b3c4d5e6f7a8b9c0d2', // Fake ID
      telephone: '0812345678',
      titre: 'Étude sismique',
      directeur: 'Prof A',
      co_directeur: 'Prof B',
      thematique: 'BTP',
      justification: ['Test'],
      problematique: ['Test'],
      objectif: [], // VIDE -> Doit échouer
      methodologie: [{ title: 'M1', contenu: ['C1'] }],
      resultats_attendus: [{ title: 'R1', contenu: ['C1'] }],
      chronogrammes: [{ title: 'CH1', contenu: ['C1'] }],
      references: [{ title: 'REF1', contenu: ['C1'] }]
    };
    const res = await request(app).post('/api/commandes').send(invalidSujet);
    expect(res.status).toBe(400); // Validation Error
    expect(res.body.error).toBe('Validation Error');
  });
});
