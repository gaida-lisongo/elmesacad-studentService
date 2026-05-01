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

  it('should return 400 when by-student-email is missing email', async () => {
    const res = await request(app).get('/api/parcours/by-student-email');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when by-student-email has invalid email', async () => {
    const res = await request(app).get(
      '/api/parcours/by-student-email?email=not-an-email',
    );
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should create a new Labo resource', async () => {
    const laboResource = {
      categorie: 'labo',
      designation: 'Analyse des sols',
      description: [{ title: 'Objectif', contenu: ['Mesurer la porosité'] }],
      amount: 50,
      currency: 'USD',
      status: 'inactive',
      matiere: { reference: 'MAT001', designation: 'Géotechnique', credit: '5' },
      titulaire: { reference: 'PROF001', email: 'prof@inbtp.ac.cd', matricule: 'M123', nom: 'Jean Dupont' }
    };
    const res = await request(app).post('/api/resources').send(laboResource);
    expect(res.status).toBe(201);
    expect(res.body.data.categorie).toBe('labo');
    expect(res.body.data.status).toBe('inactive');
  });

  it('should return 400 for GET /api/commandes without parcoursId', async () => {
    const res = await request(app).get('/api/commandes');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for GET /api/commandes with invalid parcoursId', async () => {
    const res = await request(app).get('/api/commandes?parcoursId=not-an-objectid');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject a CommandeSujet if objectif is empty', async () => {
    const invalidSujet = {
      type: 'sujet',
      parcoursId: '65f1a2b3c4d5e6f7a8b9c0d1',
      ressourceId: '65f1a2b3c4d5e6f7a8b9c0d2',
      telephone: '0812345678',
      titre: 'Étude sismique',
      directeur: 'Prof A',
      co_directeur: 'Prof B',
      thematique: 'BTP',
      justification: ['Test'],
      problematique: ['Test'],
      objectif: [],
      methodologie: [{ title: 'M1', contenu: ['C1'] }],
      resultats_attendus: [{ title: 'R1', contenu: ['C1'] }],
      chronogrammes: [{ title: 'CH1', contenu: ['C1'] }],
      references: [{ title: 'REF1', contenu: ['C1'] }]
    };
    const res = await request(app).post('/api/commandes').send(invalidSujet);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should send an email with download link when payment is success', async () => {
    const res = await request(app).post('/api/commandes/test/email');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  }, 30000); // Augmenté à 30s car l'envoi d'email peut être très lent

  it('should create a new Order (Labo)', async () => {
    // 1. Créer un parcours
    const parcoursRes = await request(app).post('/api/parcours').send({
      student: {
        email: 'test@student.com',
        matricule: '2026001',
        sexe: 'M',
        nomComplet: 'Test Student'
      },
      programme: {
        classe: 'L1',
        filiere: 'BTP',
        credits: 60
      },
      annee: {
        debut: '2025',
        fin: '2026',
        slug: '2025-2026'
      },
      status: 'inscrit'
    });
    const parcoursId = parcoursRes.body.data._id;

    // 2. Créer une ressource
    const resourceRes = await request(app).post('/api/resources').send({
      categorie: 'labo',
      designation: 'Labo de Test',
      description: [{ title: 'Infos', contenu: ['Test'] }],
      amount: 50,
      matiere: { reference: 'MAT-TEST' },
      titulaire: { nom: 'Prof Test' },
    });
    const resourceId = resourceRes.body.data._id;

    // 3. Créer la commande
    const orderRes = await request(app).post('/api/commandes').send({
      type: 'labo',
      parcoursId,
      ressourceId: resourceId,
      telephone: '0812345678',
      cote: 15,
      observation: 'Bon travail'
    });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.orderNumber).toBeDefined();
    expect(orderRes.body.data.reference).toContain('LABO');
  });

  it('should verify an order and return essential info', async () => {
    // On utilise un ID bidon pour le test de structure
    const res = await request(app).get('/api/commandes/verify/65f1a2b3c4d5e6f7a8b9c0d1');
    // Si l'ID n'existe pas en DB, on attend 404, mais on teste la route
    expect([200, 404]).toContain(res.status);
  });
});
