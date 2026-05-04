import { Router, Request, Response } from 'express';
import DocumentMacaron, { type DocumentMacaronPayload } from '../../../util/pdf/DocumentMacaron';
import type { StudentDocumentApproval } from '../../../util/pdf/Document';
import { macaronClientPayloadSchema } from '../../../schemas/macaron.schema';
import { ParcoursService } from '../../../services/parcours.service';
import ResourceModel from '../../../models/Resource';

const router = Router();

function buildVerificationUrl(commandeId: string): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/commandes/verify/${commandeId}`;
}

function metadataSectionRef(metadata: Record<string, unknown> | undefined): string | undefined {
  const raw = metadata?.sectionRef;
  return typeof raw === 'string' ? raw : undefined;
}

type ResourceBrandingLean = {
  chef?: string;
  contact?: string;
  email?: string;
  adresse?: string;
  institut?: string;
  section?: string;
  sectionRef?: string;
};

function approvalFromBranding(b: ResourceBrandingLean | undefined): StudentDocumentApproval {
  if (!b) return {};
  return {
    chef: b.chef?.trim() || undefined,
    email: b.email?.trim() || undefined,
    telephone: b.contact?.trim() || undefined,
  };
}

/**
 * Choisit un parcours : priorité au statut « inscrit », sinon le plus récent (déjà trié par le service).
 * Si `sectionRef` est fourni, tente d’abord un parcours dont la filière « ressemble » au slug (mots-clés communs).
 */
function pickParcours(
  rows: Awaited<ReturnType<typeof ParcoursService.findByStudentEmail>>,
  sectionRef?: string,
): (typeof rows)[0] | null {
  if (!rows.length) return null;

  const tokens = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2);

  const refTokens = sectionRef ? tokens(sectionRef) : [];

  if (refTokens.length) {
    const scored = rows.map((p) => {
      const fil = String((p as { programme?: { filiere?: string } }).programme?.filiere ?? '');
      const filTokens = new Set(tokens(fil));
      let score = 0;
      for (const t of refTokens) {
        if (filTokens.has(t)) score += 2;
        else if (fil.toLowerCase().includes(t)) score += 1;
      }
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    if (scored[0].score > 0) return scored[0].p as (typeof rows)[0];
  }

  const inscrit = rows.find((p) => (p as { status?: string }).status === 'inscrit');
  return (inscrit ?? rows[0]) as (typeof rows)[0];
}

/**
 * POST /api/macaron/generate
 * Corps : payload boutique (produit, commande, etudiant, cours, …).
 * Résout le parcours via l’email de l’étudiant, vérifie que la ressource `produit._id` existe et est une session.
 * Réponse : PDF (application/pdf).
 */
router.post('/generate', async (req: Request, res: Response) => {
  const parsed = macaronClientPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Payload invalide',
      details: parsed.error.flatten(),
    });
  }

  const body = parsed.data;
  if (body.commande.ressource.reference !== body.produit._id) {
    return res.status(400).json({
      success: false,
      error: 'commande.ressource.reference doit correspondre à produit._id',
    });
  }

  const email = body.etudiant.email.trim();

  const [parcoursRows, resource] = await Promise.all([
    ParcoursService.findByStudentEmail(email),
    ResourceModel.findById(body.produit._id).lean(),
  ]);

  const parcours = pickParcours(
    parcoursRows,
    metadataSectionRef(body.commande.metadataCommande as Record<string, unknown> | undefined) ??
      metadataSectionRef(body.commande.ressource.metadata as Record<string, unknown> | undefined),
  );

  if (!parcours) {
    return res.status(404).json({
      success: false,
      error: 'Aucun parcours trouvé pour cet email étudiant',
    });
  }

  if (!resource) {
    return res.status(404).json({
      success: false,
      error: 'Ressource (produit) introuvable',
    });
  }

  const categorie = String((resource as { categorie?: string }).categorie ?? '').toLowerCase();
  if (categorie !== 'session') {
    return res.status(400).json({
      success: false,
      error: `La ressource doit être de catégorie « session » (reçu : ${categorie || 'inconnu'})`,
    });
  }

  const pStudent = (parcours as { student: { nomComplet: string; sexe: string; email?: string; matricule: string; photo?: string; lieu_naissance?: string } }).student;
  const pProgramme = (parcours as { programme: { classe: string; filiere: string } }).programme;
  const pAnnee = (parcours as { annee: { slug: string; debut?: string; fin?: string } }).annee;

  const sexe = body.etudiant.sexe ?? pStudent.sexe;
  const verificationUrl = buildVerificationUrl(body.commande.id);
  const orderRef =
    body.commande.transaction?.orderNumber?.trim() ||
    body.commande.id.slice(-12).toUpperCase();

  const dateCreate = new Date().toLocaleDateString('fr-FR');
  const phone =
    body.etudiant.telephone?.trim() ||
    body.commande.transaction?.phoneNumber?.trim() ||
    '—';

  const rb = (resource as { branding?: ResourceBrandingLean }).branding;
  const fromResource = approvalFromBranding(rb);
  const fromClient = approvalFromBranding(body.branding);
  const documentApproval: StudentDocumentApproval = {
    chef: fromClient.chef ?? fromResource.chef,
    email: fromClient.email ?? fromResource.email,
    telephone: fromClient.telephone ?? fromResource.telephone,
  };

  const macaronPayload: DocumentMacaronPayload = {
    student: {
      nom: pStudent.nomComplet || body.etudiant.name,
      sexe,
      ville: body.etudiant.ville?.trim() || pStudent.lieu_naissance || '—',
      profile: pStudent.photo,
    },
    parcour: {
      promotion: pProgramme.classe,
      systeme: 'LMD',
      matricule: pStudent.matricule || body.etudiant.matricule,
      annee: pAnnee.slug,
    },
    contact: {
      email,
      telephone: phone,
      adresse: body.etudiant.ville?.trim() || pStudent.lieu_naissance || '',
    },
    document: {
      type: 'Macaron de Session',
      ressource: 'Session académique',
      detail: body.produit.designation,
      reference: orderRef,
      dateCreate,
    },
    session: {
      title: body.produit.designation,
      amount: body.produit.amount,
      period: {
        start: pAnnee.debut ?? null,
        end: pAnnee.fin ?? null,
      },
    },
    matieres: body.cours.map((c) => ({
      matiere: c.designation,
      dateEpreuve: (c.dateEpreuve && c.dateEpreuve.trim()) || 'À définir',
    })),
    verificationUrl,
    documentApproval,
  };

  try {
    const doc = new DocumentMacaron(macaronPayload);
    await doc.generate();
    const buffer = await doc.generateBuffer();

    const filenameSafe = (pStudent.nomComplet || body.etudiant.name)
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="macaron-${filenameSafe}.pdf"`);
    res.send(buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du PDF';
    console.error(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
