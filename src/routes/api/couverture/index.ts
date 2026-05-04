import { Router, Request, Response } from 'express';
import DocumentSujet from '../../../util/pdf/DocumentSujet';
import { couvertureGeneratePayloadSchema } from '../../../schemas/couverture.schema';
import { verificationBase } from '../../../config/verification-base';
import { OrderService } from '../../../services/order.service';

const router = Router();

function buildCycleString(cycle: string, specialisation?: string): string {
  const s = specialisation?.trim();
  if (s) return `${cycle.trim()}:${s}`;
  return cycle.trim();
}

/**
 * POST /api/couverture/generate
 * Body : id (commande sujet), titre, directeur, co_directeur, anneeAcad, cycle [, nom, specialisation].
 * Réponse : PDF (application/pdf).
 */
router.post('/generate', async (req: Request, res: Response) => {
  const parsed = couvertureGeneratePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Payload invalide',
      details: parsed.error.flatten(),
    });
  }

  const body = parsed.data;
  const verificationUrl = `${verificationBase}/api/commandes/verify/${body.id}`;

  let nomEtudiant = body.nom?.trim();
  if (!nomEtudiant) {
    const order = await OrderService.getById(body.id);
    const parcours = order?.parcoursId as { student?: { nomComplet?: string } } | undefined;
    nomEtudiant = parcours?.student?.nomComplet?.trim();
    if (!nomEtudiant) {
      return res.status(404).json({
        success: false,
        error:
          'Impossible de déterminer le nom de l’étudiant : fournissez `nom` dans le corps ou une commande valide avec parcours peuplé.',
      });
    }
  }

  const cyclePdf = buildCycleString(body.cycle, body.specialisation);

  const doc = new DocumentSujet({
    projet: {
      titre: body.titre,
      directeur: body.directeur,
      co_directeur: body.co_directeur,
    },
    student: {
      nom: nomEtudiant,
      annee: body.anneeAcad,
    },
  });

  try {
    await doc.generate(verificationUrl, 'Couverture', cyclePdf);
    const buffer = await doc.generateBuffer();

    const filenameSafe = nomEtudiant
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="couverture-sujet-${filenameSafe}.pdf"`);
    res.send(buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du PDF';
    console.error(error);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
