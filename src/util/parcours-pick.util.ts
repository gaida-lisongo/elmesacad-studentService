/**
 * Sélection d’un parcours parmi ceux d’un étudiant (email) — logique partagée macaron / laboratoire.
 */

export function metadataSectionRef(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  const raw = (metadata as Record<string, unknown>).sectionRef;
  return typeof raw === 'string' ? raw : undefined;
}

type ParcoursRow = {
  status?: string;
  programme?: { filiere?: string; classe?: string };
};

/**
 * Choisit un parcours : score sur `sectionRef` vs filière, sinon statut « inscrit », sinon le plus récent (ordre des `rows` imposé par l’appelant, ex. createdAt desc).
 */
export function pickParcours<T extends ParcoursRow>(rows: T[], sectionRef?: string): T | null {
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
      const fil = String(p.programme?.filiere ?? '');
      const filTokens = new Set(tokens(fil));
      let score = 0;
      for (const t of refTokens) {
        if (filTokens.has(t)) score += 2;
        else if (fil.toLowerCase().includes(t)) score += 1;
      }
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    if (scored[0].score > 0) return scored[0].p;
  }

  const inscrit = rows.find((p) => p.status === 'inscrit');
  return inscrit ?? rows[0];
}
