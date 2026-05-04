import { Router, Request, Response } from 'express';
import DocumentLaboratoire from '../../../util/pdf/DocumentLaboratoire';
import DocumentMacaron from '../../../util/pdf/DocumentMacaron';
import DocumentStage from '../../../util/pdf/DocumentStage';
import DocumentSujet from '../../../util/pdf/DocumentSujet';
import DocumentReleve from '../../../util/pdf/DocumentReleve';

const router = Router();

router.get('/:document', async (req: Request, res: Response) => {
  const { document } = req.params;
  const verificationUrl = 'http://localhost:3000/api/commandes/verify/mock-id';

  try {
    let docInstance: any;

    const mockStudent = {
      nom: "LISONGO Nathan",
      sexe: "M",
      ville: "Kinshasa",
      matricule: "2026001",
      email: "nathan@example.com",
      telephone: "+243 81 000 0000"
    };

    const mockParcour = {
      promotion: "L3 BTP",
      systeme: "LMD",
      matricule: "2026001",
      annee: "2025-2026",
      programme: { classe: "L3", filiere: "BTP" }
    };

    switch (document) {
      case 'labo':
        docInstance = new DocumentLaboratoire({
          student: { nom: mockStudent.nom, sexe: mockStudent.sexe, ville: mockStudent.ville },
          parcour: { promotion: mockParcour.promotion, systeme: mockParcour.systeme, matricule: mockParcour.matricule, annee: mockParcour.annee },
          contact: { email: mockStudent.email, telephone: mockStudent.telephone, adresse: "Kinshasa/Ngaliema" },
          document: { type: 'Bon de Laboratoire', ressource: 'Physique G1', detail: 'Autorisation accès labo', reference: 'REF-LABO-TEST', dateCreate: new Date().toLocaleDateString('fr-FR') },
          laboratoire: { designation: 'Physique G1', montant: 15 },
          verificationUrl
        });
        await docInstance.generate();
        break;

      case 'macaron':
        docInstance = new DocumentMacaron({
          student: { nom: mockStudent.nom, sexe: mockStudent.sexe, ville: mockStudent.ville },
          parcour: { promotion: mockParcour.promotion, systeme: mockParcour.systeme, matricule: mockParcour.matricule, annee: mockParcour.annee },
          contact: { email: mockStudent.email, telephone: mockStudent.telephone, adresse: '' },
          document: { type: 'Macaron de Session', ressource: 'Session Académique', detail: 'Session 2025-2026', reference: 'REF-MACARON-TEST', dateCreate: new Date().toLocaleDateString('fr-FR') },
          session: { title: 'Session Ordinaire', amount: 50, period: { start: null, end: null } },
          matieres: [{ matiere: 'Mathématiques', dateEpreuve: '12/05/2026' }],
          verificationUrl,
          documentApproval: {
            chef: 'Dr. Ir. KATEMBO',
            email: 'chef.section@inbtp.ac.cd',
            telephone: '+243 850 000 000',
          },
        });
        await docInstance.generate();
        break;

      case 'stage':
        docInstance = new DocumentStage({
          type: 'stage',
          parcoursId: 'mock-parcours-id',
          ressourceId: 'mock-resource-id',
          telephone: mockStudent.telephone,
          payment: 'success',
          delivered: false,
          validationStatus: 'validated',
          stageTitle: 'Stage Chantier BTP',
          recipientName: 'Directeur Général',
          recipientQuality: 'Directeur',
          recipientSex: 'M',
          companyName: 'BTP CONGO SARL',
          companyLocation: 'Kinshasa/Gombe',
          student: { fullName: mockStudent.nom, matricule: mockStudent.matricule, email: mockStudent.email }
        });
        await docInstance.generate(verificationUrl, { nom: 'Dr. Ir. KATEMBO', titre: 'Chef de Section' });
        break;

      case 'sujet':
        docInstance = new DocumentSujet({
          projet: {
            validation: true,
            note: 18,
            titre: 'Étude de la résistance des matériaux locaux',
            directeur: 'Prof. Kabila',
            co_directeur: 'Ir. Lelo',
            thematique: ['Structure'],
            justification: ['Besoin de matériaux durables'],
            problematique: ['Comment optimiser la résistance ?'],
            objectif: ['Définir de nouveaux standards'],
            methodology: [{ section: 'Analyse', content: 'Tests en labo' }],
            resultats: [{ section: 'Attendu', content: 'Rapport complet' }],
            chronogrammes: [{ section: 'Phase 1', content: 'Collecte' }],
            references: [{ section: 'Biblio', content: 'Ouvrages BTP' }],
          },
          student: {
            nom: mockStudent.nom,
            email: mockStudent.email,
            telephone: mockStudent.telephone,
            matricule: mockStudent.matricule,
            programme: mockParcour.promotion,
            annee: mockParcour.annee
          }
        });
        await docInstance.generate(verificationUrl, 'Protocle');
        break;

      case 'releve':
        docInstance = new DocumentReleve({
          studentName: mockStudent.nom,
          studentVille: mockStudent.ville,
          studentDateNaiss: new Date(),
          studentEmail: mockStudent.email,
          studentPhone: mockStudent.telephone,
          matricule: mockStudent.matricule,
          programmeName: mockParcour.promotion,
          anneeAcad: mockParcour.annee,
          orderReference: 'REF-RELEVE-TEST',
          serialNumber: 'SN-123456',
          units: [
            { 
              semestre: 'S1', 
              code: 'MATH101', 
              designation: 'Mathématiques', 
              statut: 'V', 
              credit: 6, 
              moyenne: 13,
              elements: []
            }
          ],
          summary: {
            ncv: 6,
            ncnv: 0,
            totalObtenu: 78,
            totalMax: 120,
            pourcentage: 65,
            mention: 'Assez Bien',
            decision: 'Admis'
          },
          verificationUrl
        });
        await docInstance.generate(verificationUrl, { nom: 'Dr. Ir. KATEMBO', titre: 'Chef de Section' });
        break;

      default:
        return res.status(400).json({ success: false, error: `Type de document '${document}' non supporté pour le test.` });
    }

    const buffer = await docInstance.generateBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=test-${document}.pdf`);
    res.send(buffer);

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
