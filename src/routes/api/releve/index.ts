import { Router, Request, Response } from 'express';
import DocumentReleve, { type DocumentRelevePayload } from '../../../util/pdf/DocumentReleve';
import { releveClientPayloadSchema } from '../../../schemas/releve.schema';
import { formatAnneeAcademiqueFromSlug } from '../../../util/pdf/Document';

const router = Router();

function buildVerificationUrl(orderReference: string): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/api/commandes/verify/${orderReference}`;
}

/**
 * POST /api/releve/generate
 * Body : un objet relevé ou un tableau d’un seul objet (payload client).
 * L’URL de vérification est toujours construite côté serveur à partir de `orderReference`.
 * Réponse : PDF (application/pdf).
 */
router.post('/generate', async (req: Request, res: Response) => {
  const parsed = releveClientPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Payload invalide',
      details: parsed.error.flatten(),
    });
  }

  const raw = parsed.data;
  const body = Array.isArray(raw) ? raw[0] : raw;

  const verificationUrl = buildVerificationUrl(body.orderReference);
  const anneeAffichee = formatAnneeAcademiqueFromSlug(body.anneeAcad);

  const docPayload: DocumentRelevePayload = {
    studentName: body.studentName,
    studentVille: body.studentVille,
    studentDateNaiss: body.studentDateNaiss,
    studentEmail: body.studentEmail ?? null,
    studentPhone: body.studentPhone ?? null,
    matricule: body.matricule,
    programmeName: body.programmeName,
    anneeAcad: anneeAffichee,
    orderReference: body.orderReference,
    serialNumber: body.serialNumber,
    units: body.units,
    summary: body.summary,
    verificationUrl,
  };

  const signatureNom = body.branding?.chef?.trim() || 'Le Chef de Section';
  const signatureTitre = body.branding?.chefTitre?.trim() || 'Chef de Section';

  try {
    const doc = new DocumentReleve(docPayload);
    await doc.generate(verificationUrl, { nom: signatureNom, titre: signatureTitre });
    const buffer = await doc.generateBuffer();

    const filenameSafe = body.studentName
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="releve-${filenameSafe}.pdf"`);
    res.send(buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du PDF';
    console.error(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
