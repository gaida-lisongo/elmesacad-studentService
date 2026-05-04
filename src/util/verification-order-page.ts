/**
 * Page HTML publique de vérification d’authenticité d’une commande (QR, lien partagé).
 * Toutes les valeurs dynamiques passent par escapeHtml.
 */

import type { IOrder } from '../models/Order';

const TYPE_LABELS: Record<string, string> = {
  labo: 'Travail de laboratoire',
  stage: 'Rapport de stage',
  sujet: 'Sujet de mémoire / PFE',
  session: 'Session / bulletin',
  resultat: 'Résultat / relevé',
};

const PAYMENT_LABELS: Record<string, string> = {
  success: 'Paiement confirmé',
  pending: 'Paiement en attente',
  failed: 'Paiement refusé ou annulé',
};

const VALIDATION_LABELS: Record<string, string> = {
  pending: 'Validation en cours',
  validated: 'Demande validée',
  rejected: 'Demande refusée',
};

export type VerificationOrderView = {
  orderNumber: string;
  reference: string;
  typeLabel: string;
  student: string;
  matricule?: string;
  designation?: string;
  programmeClasse?: string;
  programmeFiliere?: string;
  paymentLabel: string;
  paymentVariant: 'success' | 'pending' | 'failed';
  delivered: boolean;
  deliveredLabel: string;
  validationLabel: string;
  validationVariant: 'pending' | 'validated' | 'rejected';
  createdAtLabel: string;
};

/** Construit le modèle d’affichage à partir d’une commande peuplée (parcoursId, ressourceId). */
export function buildVerificationOrderView(order: IOrder): VerificationOrderView {
  const parcours = order.parcoursId as unknown as {
    student?: { nomComplet?: string; matricule?: string };
    programme?: { classe?: string; filiere?: string };
  } | null;
  const ressource = order.ressourceId as unknown as { designation?: string } | null;

  const student = parcours?.student?.nomComplet ?? '—';
  const matricule = parcours?.student?.matricule;
  const programmeClasse = parcours?.programme?.classe;
  const programmeFiliere = parcours?.programme?.filiere;
  const designation = ressource?.designation;

  const payment = order.payment ?? 'pending';
  const validation = order.validationStatus ?? 'pending';

  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  const createdAtLabel = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(created);

  return {
    orderNumber: order.orderNumber,
    reference: order.reference,
    typeLabel: TYPE_LABELS[order.type] ?? order.type,
    student,
    matricule,
    designation,
    programmeClasse,
    programmeFiliere,
    paymentLabel: PAYMENT_LABELS[payment] ?? payment,
    paymentVariant: payment === 'success' || payment === 'pending' || payment === 'failed' ? payment : 'pending',
    delivered: Boolean(order.delivered),
    deliveredLabel: order.delivered ? 'Document livré' : 'Document non livré',
    validationLabel: VALIDATION_LABELS[validation] ?? validation,
    validationVariant:
      validation === 'validated' || validation === 'rejected' || validation === 'pending'
        ? validation
        : 'pending',
    createdAtLabel,
  };
}

function escapeHtml(s: string | undefined | null): string {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function row(label: string, value: string, options?: { mono?: boolean; emphasize?: boolean }): string {
  const v = escapeHtml(value) || '—';
  const cls = ['row__value'];
  if (options?.mono) cls.push('row__value--mono');
  if (options?.emphasize) cls.push('row__value--strong');
  return `
    <div class="row" role="row">
      <div class="row__label">${escapeHtml(label)}</div>
      <div class="${cls.join(' ')}">${v}</div>
    </div>`;
}

export function renderVerificationOrderPage(data: VerificationOrderView): string {
  const d = data;
  const badges = `
    <div class="badges" aria-label="Statuts">
      <span class="badge badge--pay badge--pay-${d.paymentVariant}">${escapeHtml(d.paymentLabel)}</span>
      <span class="badge badge--delivered ${d.delivered ? 'badge--delivered-yes' : 'badge--delivered-no'}">${escapeHtml(d.deliveredLabel)}</span>
      <span class="badge badge--validation badge--validation-${d.validationVariant}">${escapeHtml(d.validationLabel)}</span>
    </div>`;

  const rows = [
    row('N° de commande', d.orderNumber, { mono: true, emphasize: true }),
    row('Référence', d.reference, { mono: true }),
    row('Type de demande', d.typeLabel),
    row('Document / prestation', d.designation || '—'),
    row('Étudiant', d.student),
    row('Matricule', d.matricule || '—', { mono: true }),
    row('Classe', d.programmeClasse || '—'),
    row('Filière', d.programmeFiliere || '—'),
    row('Enregistrée le', d.createdAtLabel),
  ].join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex, nofollow"/>
  <meta name="color-scheme" content="light dark"/>
  <title>Vérification — ${escapeHtml(d.orderNumber)}</title>
  <style>
    :root {
      --bg: #f4f7fb;
      --surface: #ffffff;
      --text: #142032;
      --muted: #5a6b82;
      --border: rgba(20, 32, 50, 0.08);
      --accent: #0d5c7f;
      --accent-soft: rgba(13, 92, 127, 0.12);
      --success: #0d7a52;
      --success-bg: rgba(13, 122, 82, 0.12);
      --warn: #b45309;
      --warn-bg: rgba(180, 83, 9, 0.12);
      --danger: #b42318;
      --danger-bg: rgba(180, 35, 24, 0.12);
      --radius: 16px;
      --radius-sm: 10px;
      --shadow: 0 12px 40px rgba(15, 35, 55, 0.08);
      --font: ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f1419;
        --surface: #1a222c;
        --text: #e8eef5;
        --muted: #9aacbf;
        --border: rgba(232, 238, 245, 0.08);
        --accent-soft: rgba(72, 186, 220, 0.15);
        --shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font);
      background: radial-gradient(1200px 600px at 10% -10%, var(--accent-soft), transparent 55%),
                  radial-gradient(900px 500px at 100% 0%, rgba(13, 92, 127, 0.06), transparent 50%),
                  var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .wrap {
      max-width: 640px;
      margin: 0 auto;
      padding: clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 4vw, 1.5rem) 3rem;
    }
    .topbar {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 1.75rem;
    }
    .mark {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(145deg, var(--accent), #0a4a66);
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
      font-size: 0.7rem;
      letter-spacing: 0.04em;
      box-shadow: 0 4px 14px rgba(13, 92, 127, 0.35);
    }
    .topbar__text small {
      display: block;
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 500;
    }
    .topbar__text strong {
      font-size: 1rem;
      font-weight: 700;
    }
    .hero {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .seal {
      width: 72px;
      height: 72px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      background: var(--success-bg);
      border: 2px solid rgba(13, 122, 82, 0.35);
      display: grid;
      place-items: center;
      font-size: 2rem;
      line-height: 1;
    }
    .hero h1 {
      margin: 0 0 0.5rem;
      font-size: clamp(1.35rem, 4vw, 1.65rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .hero p {
      margin: 0 auto;
      max-width: 34ch;
      color: var(--muted);
      font-size: 0.95rem;
    }
    .card {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .card__head {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
    }
    .card__body { padding: 0.35rem 0; }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 34%) 1fr;
      gap: 0.5rem 1rem;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .row:last-child { border-bottom: none; }
    @media (max-width: 480px) {
      .row {
        grid-template-columns: 1fr;
        gap: 0.2rem;
        padding: 0.75rem 1rem;
      }
    }
    .row__label {
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 500;
    }
    .row__value {
      font-size: 0.95rem;
      word-break: break-word;
    }
    .row__value--mono { font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }
    .row__value--strong { font-weight: 600; }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 1.1rem 1.25rem 1.25rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .badge--pay-success { background: var(--success-bg); color: var(--success); }
    .badge--pay-pending { background: var(--warn-bg); color: var(--warn); }
    .badge--pay-failed { background: var(--danger-bg); color: var(--danger); }
    .badge--delivered-yes { background: var(--success-bg); color: var(--success); }
    .badge--delivered-no { background: var(--accent-soft); color: var(--accent); }
    .badge--validation-pending { background: var(--warn-bg); color: var(--warn); }
    .badge--validation-validated { background: var(--success-bg); color: var(--success); }
    .badge--validation-rejected { background: var(--danger-bg); color: var(--danger); }
    .note {
      margin-top: 1.5rem;
      padding: 1rem 1.15rem;
      border-radius: var(--radius-sm);
      background: var(--accent-soft);
      border: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--muted);
    }
    .note strong { color: var(--text); }
    footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="topbar">
      <div class="mark" aria-hidden="true">INBTP</div>
      <div class="topbar__text">
        <strong>Vérification d’authenticité</strong>
        <small>Service numérique — commandes étudiants</small>
      </div>
    </header>

    <section class="hero" aria-labelledby="hero-title">
      <div class="seal" aria-hidden="true">✓</div>
      <h1 id="hero-title">Commande authentifiée</h1>
      <p>Les informations ci-dessous correspondent à une commande enregistrée dans notre système.</p>
    </section>

    <article class="card" aria-labelledby="card-title">
      <div class="card__head" id="card-title">Détail de la commande</div>
      <div class="card__body">${rows}</div>
      ${badges}
    </article>

    <p class="note">
      <strong>À lire si vous découvrez cette page :</strong>
      elle permet de confirmer qu’un document ou une demande correspond bien à une commande officielle.
      Elle ne remplace pas un reçu papier ou un e-mail personnel : en cas de doute, contactez le service compétent de votre établissement en indiquant le <strong>n° de commande</strong> ou la <strong>référence</strong>.
    </p>

    <footer>Page générée automatiquement — ne pas partager vos liens personnels sur les réseaux sociaux.</footer>
  </div>
</body>
</html>`;
}

export function renderVerificationNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex, nofollow"/>
  <meta name="color-scheme" content="light dark"/>
  <title>Commande introuvable</title>
  <style>
    :root {
      --bg: #f4f7fb;
      --surface: #ffffff;
      --text: #142032;
      --muted: #5a6b82;
      --border: rgba(20, 32, 50, 0.08);
      --accent: #0d5c7f;
      --radius: 16px;
      --shadow: 0 12px 40px rgba(15, 35, 55, 0.08);
      --font: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f1419;
        --surface: #1a222c;
        --text: #e8eef5;
        --muted: #9aacbf;
        --border: rgba(232, 238, 245, 0.08);
        --shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
    }
    .card {
      max-width: 420px;
      background: var(--surface);
      border-radius: var(--radius);
      padding: 2rem 1.75rem;
      text-align: center;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    h1 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    p { margin: 0; color: var(--muted); font-size: 0.95rem; line-height: 1.55; }
  </style>
</head>
<body>
  <div class="card" role="alert">
    <div class="icon" aria-hidden="true">?</div>
    <h1>Commande introuvable</h1>
    <p>Aucune commande ne correspond à ce lien. Vérifiez que l’URL est complète ou demandez un nouveau lien au service.</p>
  </div>
</body>
</html>`;
}
