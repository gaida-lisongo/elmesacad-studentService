# Student Service - INBTP

Microservice de gestion des parcours étudiants, des ressources académiques et des commandes de documents officiels.

## 🚀 Endpoints API

### 🎓 Parcours (Student Programs)

Vue d’ensemble : préfixe **`/api/parcours`** (ex. derrière Traefik : `https://services.inbtp.ac.cd/student/api/parcours`).

| Méthode | Chemin | Description |
|--------|--------|-------------|
| `GET` | `/api/parcours` | Liste **paginée** ; filtres combinables (voir ci‑dessous) |
| `GET` | `/api/parcours/by-student-email` | Tous les parcours d’un étudiant par **email** |
| `POST` | `/api/parcours` | Création **unitaire** (objet JSON) ou **bulk** (tableau) |
| `PATCH` | `/api/parcours` | Mise à jour **bulk** — tableau d’objets avec `_id` |
| `DELETE` | `/api/parcours` | Suppression **bulk** — `{ "ids": string[] }` |

#### `GET /api/parcours` — filtres (query string)

Tous les filtres sont **optionnels** ; s’ils sont présents, ils se **combinent** par **ET** avec la pagination.

| Paramètre | Champ MongoDB | Notes |
|-----------|----------------|--------|
| `search` | `student.matricule` (égalité) **ou** `student.nomComplet` (regex insensible à la casse) | |
| `classe` ou `programme_classe` | `programme.classe` | `programme_classe` est un alias explicite |
| `filiere` ou `programme_filiere` | `programme.filiere` | `filiere` / `annee` restent les noms historiques |
| `annee` ou `annee_slug` | `annee.slug` | ex. `2025-2026` |
| `status` | `status` | Une seule valeur : `inscrit`, `suspendu`, `abandon`, `diplômé` |
| `reference` | `reference` | Référence unique du parcours |
| `page` | — | Page (défaut `1`) |
| `limit` | — | Taille de page (défaut `10`, max `200`) |

Exemple (L3 BTP, année 2025-2026, inscrits) :

```text
GET /api/parcours?classe=L3&filiere=BTP&annee=2025-2026&status=inscrit&page=1&limit=20
```

**Réponses `GET /api/parcours`**

| Code | Corps |
|------|--------|
| `200` | `{ "success": true, "data": [ Parcours ], "meta": { "total": number, "page": number, "limit": number } }` |
| `400` | Erreur Zod (ex. `status` invalide) — format géré par votre middleware d’erreurs |

#### `GET /api/parcours/by-student-email`

Query : `email` (obligatoire, email valide).

| Code | Corps |
|------|--------|
| `200` | `{ "success": true, "data": [ Parcours ], "count": number }` |
| `400` | Email manquant ou invalide |

#### `POST /api/parcours` — création unitaire

**Corps (JSON)** — schéma aligné sur le modèle :

```json
{
  "student": {
    "email": "etudiant@example.com",
    "matricule": "2026001",
    "sexe": "M",
    "nomComplet": "Nom Complet",
    "photo": "https://example.com/photo.jpg",
    "nationalite": "CD",
    "date_naissance": "2000-01-15",
    "lieu_naissance": "Kinshasa"
  },
  "programme": {
    "classe": "L3",
    "filiere": "BTP",
    "credits": 60
  },
  "annee": {
    "debut": "2025",
    "fin": "2026",
    "slug": "2025-2026"
  },
  "status": "inscrit",
  "ncv": 0,
  "reference": "2025-2026-2026001-UNIQUE"
}
```

| Code | Corps |
|------|--------|
| `201` | `{ "success": true, "data": <document créé> }` |
| `400` | Validation Zod (champs requis, formats) |

#### `POST /api/parcours` — création bulk

**Corps** : **tableau** d’objets du même schéma que la création unitaire.

| Code | Corps |
|------|--------|
| `201` | `{ "success": true, "data": <résultat bulkWrite MongoDB> }` |
| `400` | Validation |

#### `PATCH /api/parcours` — mise à jour bulk

**Corps** : tableau d’objets contenant au minimum `_id` ; les autres champs reprennent le schéma parcours en **partiel**.

```json
[
  {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "status": "diplômé",
    "student": { "nomComplet": "Nouveau nom" }
  }
]
```

| Code | Corps |
|------|--------|
| `200` | `{ "success": true, "data": <résultat bulkWrite> }` |
| `400` | Validation |

#### `DELETE /api/parcours`

**Corps** :

```json
{ "ids": ["65f1a2b3c4d5e6f7a8b9c0d1", "65f1a2b3c4d5e6f7a8b9c0d2"] }
```

| Code | Corps |
|------|--------|
| `200` | `{ "success": true, "data": <résultat deleteMany> }` |
| `400` | `ids` invalide |

### 📚 Ressources (Available Documents)
- `GET /api/resources` : Liste des ressources disponibles (Filtres : `category`, `status`, `search`).
- `POST /api/resources` : Création d'une nouvelle ressource (Admin).
- `PATCH /api/resources/:id` : Modification d'une ressource.
- `DELETE /api/resources/:id` : Suppression d'une ressource.

### 🛒 Commandes (Orders)
- `POST /api/commandes` : Soumission d'une commande par un étudiant.
- `GET /api/commandes/:id` : Détails d'une commande (avec population parcours/ressource).
- `GET /api/commandes/:id/download` : Génération et téléchargement du PDF (si payé).
- `GET /api/commandes/verify/:id` : Endpoint public de vérification (QR Code).

### 🛠️ Administration des Commandes
- `GET /api/commandes/admin/list` : Liste complète pour la section (Filtres : `type`, `payment`, `matricule`).
- `PATCH /api/commandes/admin/:id` : **Validation manuelle**, ajout de notes, changement de statut de paiement.
- `POST /api/commandes/test/email` : Test manuel d'envoi d'email groupé.

## 📖 Exemples de requêtes (cURL)

### Parcours d’un étudiant par email

Récupère **tous** les enregistrements de parcours dont le champ `student.email` correspond (ex. même étudiant sur plusieurs années académiques).

```bash
# Local
curl -sS "http://localhost:3000/api/parcours/by-student-email?email=nathan%40example.com"

# Derrière Traefik (ex. stack Elmesacad)
curl -sS -H "Authorization: Bearer <JWT>" \
  "https://services.inbtp.ac.cd/student/api/parcours/by-student-email?email=nathan%40example.com"
```

**Réponses**

| Code | Corps (schéma) |
|------|----------------|
| `200` | `{ "success": true, "data": [ { ...parcours } ], "count": <number> }` |
| `400` | Paramètre `email` manquant ou invalide (validation Zod : `success: false`, `details`) |

### 1. Créer un Parcours (Étudiant)
```bash
curl -X POST http://localhost:3000/api/parcours \
-H "Content-Type: application/json" \
-d '{
  "student": {
    "email": "nathan@example.com",
    "matricule": "2026001",
    "sexe": "M",
    "nomComplet": "Nathan Lisongo"
  },
  "programme": {
    "classe": "L3",
    "filiere": "BTP",
    "credits": 60
  },
  "annee": {
    "debut": "2025",
    "fin": "2026",
    "slug": "2025-2026"
  },
  "status": "inscrit",
  "reference": "2025-2026-2026001"
}'
```

### 2. Ajouter une Ressource (Admin)
Les ressources utilisent des **discriminateurs**. Le champ `categorie` détermine les champs supplémentaires requis.

#### A. Laboratoire (`labo`)
```bash
curl -X POST http://localhost:3000/api/resources \
-H "Content-Type: application/json" \
-d '{
  "categorie": "labo",
  "designation": "Bon de Laboratoire - Physique",
  "amount": 15,
  "description": [{"title": "Instructions", "contenu": ["Présence obligatoire"]}],
  "matiere": { "reference": "PHYS101" },
  "titulaire": { "nom": "Prof. Kabila" }
}'
```

#### B. Stage (`stage`)
```bash
curl -X POST http://localhost:3000/api/resources \
-H "Content-Type: application/json" \
-d '{
  "categorie": "stage",
  "designation": "Fiche de Stage Professionnel",
  "amount": 25,
  "description": [{"title": "Objectif", "contenu": ["Immersion en entreprise"]}],
  "matiere": { "reference": "STG-BTP" },
  "titulaire": { "nom": "Ir. Lelo" }
}'
```

#### C. Sujet de TFE (`sujet`)
```bash
curl -X POST http://localhost:3000/api/resources \
-H "Content-Type: application/json" \
-d '{
  "categorie": "sujet",
  "designation": "Validation Sujet TFE",
  "amount": 10,
  "description": [{"title": "Titre", "contenu": ["Étude de structure"]}],
  "matiere": { "reference": "TFE-01" },
  "lecteurs": [{ "nom": "Dr. Mukwege" }]
}'
```

#### D. Session d'Examen (`session`)
```bash
curl -X POST http://localhost:3000/api/resources \
-H "Content-Type: application/json" \
-d '{
  "categorie": "session",
  "designation": "Inscription Session Spéciale",
  "amount": 50,
  "description": [{"title": "Conditions", "contenu": ["Être en règle de minerval"]}],
  "matieres": [{ "reference": "MATH101" }, { "reference": "GEOL101" }]
}'
```

#### E. Relevé ou Validation (`releve` / `validation`)
```bash
# Relevé de Notes
curl -X POST http://localhost:3000/api/resources \
-H "Content-Type: application/json" \
-d '{
  "categorie": "releve",
  "designation": "Relevé de Notes Annuel",
  "amount": 20,
  "description": [{"title": "Note", "contenu": ["Document officiel"]}],
  "programme": { "classe": "L3", "filiere": "BTP", "credits": 60 },
  "annee": { "slug": "2025-2026" }
}'

# Fiche de Validation
curl -X POST http://localhost:3000/api/resources \
-H "Content-Type: application/json" \
-d '{
  "categorie": "validation",
  "designation": "Fiche de Validation de Stage",
  "amount": 15,
  "description": [{"title": "Info", "contenu": ["Validation de fin de cycle"]}],
  "programme": { "classe": "L3", "filiere": "BTP", "credits": 60 },
  "annee": { "slug": "2025-2026" }
}'
```

### 3. Passer une Commande (Étudiant)
```bash
curl -X POST http://localhost:3000/api/commandes \
-H "Content-Type: application/json" \
-d '{
  "type": "labo",
  "parcoursId": "ID_DU_PARCOURS",
  "ressourceId": "ID_DE_LA_RESSOURCE",
  "telephone": "0812345678",
  "cote": 0,
  "observation": "Nouvelle demande"
}'
```

### 4. Validation Manuelle & Paiement (Admin)
*Cette action déclenche l'envoi de l'email stylisé avec le lien PDF.*

#### A. Valider le paiement et confirmer la commande
```bash
curl -X PATCH http://localhost:3000/api/commandes/admin/ID_DE_LA_COMMANDE \
-H "Content-Type: application/json" \
-d '{
  "payment": "success",
  "validationStatus": "validated",
  "validationDate": "2026-04-26T19:00:00Z",
  "validatedBy": "Chef de Section BTP",
  "cote": 15,
  "observation": "Travail pratique validé après vérification."
}'
```

#### B. Marquer comme livré (Remise physique)
```bash
curl -X PATCH http://localhost:3000/api/commandes/admin/ID_DE_LA_COMMANDE \
-H "Content-Type: application/json" \
-d '{
  "delivered": true
}'
```

#### C. Rejeter une commande
```bash
curl -X PATCH http://localhost:3000/api/commandes/admin/ID_DE_LA_COMMANDE \
-H "Content-Type: application/json" \
-d '{
  "validationStatus": "rejected",
  "observation": "Le matricule ne correspond pas au nom fourni."
}'
```

### 5. Télécharger le Document (Étudiant)
```bash
curl -X GET http://localhost:3000/api/commandes/ID_DE_LA_COMMANDE/download --output document.pdf
```

### 6. Vérifier l'Authenticité (Public / QR Code)
```bash
curl -X GET http://localhost:3000/api/commandes/verify/ID_DE_LA_COMMANDE
```

## 🛠️ Technologies
- **Node.js / Express** : Serveur backend.
- **TypeScript** : Type safety.
- **Mongoose** : ODM pour MongoDB avec Discriminators.
- **Zod** : Validation de schémas.
- **pdfmake & canvas** : Génération de documents PDF avec images.
- **Vitest** : Suite de tests unitaires et d'intégration.

## 📦 Installation & Lancement
1. `cd student-service`
2. `npm install`
3. Configurez le fichier `.env` (MONGODB_URI, EMAIL_API_URL, APP_URL).
4. `npm run dev` (Développement)
5. `npm test` (Lancer les tests)

## 📧 Workflow Email
Lorsqu'une commande passe au statut `payment: 'success'` (via validation manuelle ou automatique), un email stylisé est envoyé à l'étudiant avec :
1. Un bouton de téléchargement direct.
2. Un lien de vérification d'authenticité.
3. Une notification est également envoyée aux administrateurs.
