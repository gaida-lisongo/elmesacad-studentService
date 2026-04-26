import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from './index';
import mongoose from 'mongoose';

describe('Comprehensive Order Workflow Scenario', () => {
  let parcoursId: string;
  let resourceId: string;
  let orderId: string;

  it('Step 1: Create Parcours and Resource', async () => {
    const p = await request(app).post('/api/parcours').send({
      student: { email: 'student1@test.com', matricule: 'MAT001', sexe: 'M', nomComplet: 'Student One' },
      programme: { classe: 'L1', filiere: 'BTP', credits: 60 },
      annee: { debut: '2025', fin: '2026', slug: '2025-2026' },
      status: 'inscrit',
      reference: '2025-2026-MAT001'
    });
    if (p.status !== 201) console.log('PARCOURS ERROR:', JSON.stringify(p.body, null, 2));
    expect(p.status).toBe(201);
    parcoursId = p.body.data._id;

    const r = await request(app).post('/api/resources').send({
      type: 'labo', designation: 'Laboratoire de Physique', category: 'labo', amount: 100, status: 'active',
      reference: 'REF-LABO-TEST',
      branding: {
        institut: 'INBTP',
        section: 'BTP',
        chef: 'Dr. Test',
        contact: '081',
        email: 'test@test.com',
        adresse: 'Kinshasa'
      }
    });
    if (r.status !== 201) console.log('RESOURCE ERROR:', JSON.stringify(r.body, null, 2));
    expect(r.status).toBe(201);
    resourceId = r.body.data._id;
  }, 20000);

  it('Step 2: Student places an Order', async () => {
    const res = await request(app).post('/api/commandes').send({
      type: 'labo',
      parcoursId,
      ressourceId: resourceId,
      telephone: '0810000001',
      cote: 0,
      observation: 'En attente'
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    orderId = res.body.data._id;
  }, 20000);

  it('Step 3: Admin performs Manual Validation and Payment Success', async () => {
    const res = await request(app).patch(`/api/commandes/admin/${orderId}`).send({
      payment: 'success',
      validationStatus: 'validated',
      validationDate: new Date(),
      validatedBy: 'Admin_Section',
      cote: 18,
      observation: 'Excellent travail, document validé.'
    });
    expect(res.status).toBe(200);
    expect(res.body.data.payment).toBe('success');
    expect(res.body.data.validationStatus).toBe('validated');
  }, 20000);

  it('Step 4: Verify Document Authentication Endpoint', async () => {
    const res = await request(app).get(`/api/commandes/verify/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toBeDefined();
  }, 20000);

  it('Step 5: Verify PDF Download (Document Generation)', async () => {
    const res = await request(app).get(`/api/commandes/${orderId}/download`);
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/pdf');
  }, 30000);
});
