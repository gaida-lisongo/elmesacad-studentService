import { Router, Request, Response } from 'express';
import DocumentLaboratoire, { type DocumentLaboratoirePayload } from '../../../util/pdf/DocumentLaboratoire';
import { laboratoireClientPayloadSchema } from '../../../schemas/laboratoire.schema';
import ResourceModel from '../../../models/Resource';

const router = Router();

function buildVerificationUrl(commandeId: string): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/commandes/verify/${commandeId}`;
}

function formatDateFr(d: Date | undefined): string | undefined {
  if (!d || Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * POST /api/laboratoire/generate
 * Corps : objet unique ou tableau d’un élément (payload boutique).
 * Étudiant et contact : entièrement issus du payload `etudiant`.
 * Vérifie que `produit._id` est une ressource Mongo de catégorie `labo`.
 */
router.post('/generate', async (req: Request, res: Response) => {
  const parsed = laboratoireClientPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Payload invalide',
      details: parsed.error.flatten(),
    });
  }

  const raw = parsed.data;
  const body = Array.isArray(raw) ? raw[0] : raw;

  if (body.commande.ressource.reference !== body.produit._id) {
    return res.status(400).json({
      success: false,
      error: 'commande.ressource.reference doit correspondre à produit._id',
    });
  }

  if (body.ressource.reference !== body.produit._id) {
    return res.status(400).json({
      success: false,
      error: 'ressource.reference doit correspondre à produit._id',
    });
  }

  const resource = await ResourceModel.findById(body.produit._id).lean();
  if (!resource) {
    return res.status(404).json({ success: false, error: 'Ressource (produit) introuvable' });
  }

  const categorie = String((resource as { categorie?: string }).categorie ?? '').toLowerCase();
  if (categorie !== 'labo') {
    return res.status(400).json({
      success: false,
      error: `La ressource doit être de catégorie « labo » (reçu : ${categorie || 'inconnu'})`,
    });
  }

  const sexe = body.etudiant.sexe ?? 'M';
  const ville = body.etudiant.lieuDeNaissance?.trim() || body.etudiant.ville?.trim() || '—';
  const dateNaissance = formatDateFr(body.etudiant.dateDeNaissance);

  const orderRef =
    body.commande.transaction?.orderNumber?.trim() ||
    body.commande.id.slice(-12).toUpperCase();

  const dateCreate = new Date().toLocaleDateString('fr-FR');

  const cycle = body.etudiant.cycle?.trim();
  const diplome = body.etudiant.diplome?.trim();
  const promotionLabel =
    [cycle, diplome].filter(Boolean).join(' — ') ||
    body.promotion?.programmeDesignation?.trim() ||
    '—';

  const descriptionSections = body.produit.description?.filter((s) => s.title || s.contenu?.length);

  const labPayload: DocumentLaboratoirePayload = {
    student: {
      nom: body.etudiant.name,
      sexe,
      ville,
      email: body.etudiant.email,
      telephone: body.etudiant.telephone?.trim() || body.commande.transaction?.phoneNumber?.trim(),
      adresse: body.etudiant.adresse?.trim(),
      nationalite: body.etudiant.nationalite?.trim(),
      dateNaissance,
    },
    parcour: {
      promotion: promotionLabel,
      systeme: 'LMD',
      matricule: body.etudiant.matricule,
      annee: '—',
    },
    contact: {
      email: body.etudiant.email,
      telephone: body.etudiant.telephone?.trim() || body.commande.transaction?.phoneNumber?.trim() || '—',
      adresse: body.etudiant.adresse?.trim() || body.etudiant.ville?.trim() || '—',
    },
    document: {
      type: 'Bon de Laboratoire',
      ressource: body.produit.designation,
      detail: body.produit.designation,
      reference: orderRef,
      dateCreate,
    },
    laboratoire: {
      designation: body.produit.designation,
      montant: body.produit.amount,
      descriptionSections: descriptionSections?.length ? descriptionSections : undefined,
    },
    verificationUrl: buildVerificationUrl(body.commande.id),
  };

  try {
    const doc = new DocumentLaboratoire(labPayload);
    await doc.generate();
    const buffer = await doc.generateBuffer();

    const filenameSafe = body.etudiant.name
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="laboratoire-${filenameSafe}.pdf"`);
    res.send(buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du PDF';
    console.error(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
