import { Router, Request, Response } from 'express';
import DocumentBulletin, { type DocumentBulletinPayload } from '../../../util/pdf/DocumentBulletin';
import { bulletinClientPayloadSchema } from '../../../schemas/bulletin.schema';
import { verificationBase } from '../../../config/verification-base';

const router = Router();

function formatDateCreateFr(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * POST /api/bulletin/generate
 * Body : structure « bulletin » (notes, student, parcour, contact, document, ressource optionnel).
 * Réponse : PDF (application/pdf).
 */
router.post('/generate', async (req: Request, res: Response) => {
  const parsed = bulletinClientPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Payload invalide',
      details: parsed.error.flatten(),
    });
  }

  const body = parsed.data;
  const docMeta = body.document;
  const verifyRef = docMeta?.reference ?? 'bulletin';
  const verificationUrl = `${verificationBase}/api/commandes/verify/${verifyRef}`;

  const bulletinPayload: DocumentBulletinPayload = {
    notes: body.notes,
    student: body.student,
    parcour: body.parcour,
    contact: body.contact,
    document: docMeta
      ? {
          ...docMeta,
          dateCreate: formatDateCreateFr(docMeta.dateCreate) ?? docMeta.dateCreate,
        }
      : undefined,
    ressource: body.ressource,
  };

  try {
    const doc = new DocumentBulletin(bulletinPayload);
    await doc.generate(verificationUrl);
    const buffer = await doc.generateBuffer();

    const filenameSafe = (body.student?.nom ?? 'bulletin')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filenameSafe}.pdf"`);
    res.send(buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du PDF';
    console.error(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
