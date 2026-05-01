# Student Service - INBTP

Microservice de gestion des parcours étudiants, des ressources académiques et des commandes de documents officiels.

## 🚀 Endpoints API

### 🎓 Parcours (Student Programs)

Vue d’ensemble : préfixe **`/api/parcours`** (ex. derrière Traefik : `https://services.inbtp.ac.cd/student/api/parcours`).

**Pièges fréquents (404)** — le conteneur reçoit le chemin **après** le strip `/student` :

| Erreur côté client | Chemin vu par Express | Correction |
|--------------------|------------------------|-------------|
| Base déjà `/student/api`, path encore `/api/parcours` | `/api/api/parcours` | Un seul segment `/api` : utiliser soit `base=https://host/student` + `fetch('/api/parcours…')`, soit URL absolue `fetch('https://host/student/api/parcours…')`. |
| Concaténer une **URL complète** derrière `/api/` | `/api/https:/services…` | Ne concaténez **pas** deux bases : une seule URL finale en string. |

| Méthode | Chemin | Description |
|--------|--------|-------------|
| `GET` | `/api/parcours` | Liste **paginée** ; filtres combinables (voir ci‑dessous) |
| `GET` | `/api/parcours/by-student-email` | Tous les parcours d’un étudiant par **email** |
| `POST` | `/api/parcours` | Création **unitaire** (objet JSON) ou **bulk** (tableau) |
| `PATCH` | `/api/parcours` | Mise à jour **bulk** — tableau d’objets avec `_id` |
| `DELETE` | `/api/parcours` | Suppression **bulk** — `{ "ids": string[] }` (corps JSON) |
| `DELETE` | `/api/parcours/:id` | Suppression **unitaire** par `_id` MongoDB — **sans** corps JSON |

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

**Corps** : **un seul tableau** d’objets, même schéma que la création unitaire :

```json
[ { "student": { ... }, "programme": { ... }, ... }, { ... } ]
```

- **À ne pas faire** : envelopper une seconde fois en `[[ {...}, {...} ]]` — certains outils le font par erreur ; le service **dé-enveloppe** automatiquement uniquement le cas `[[ ... ]]` (un seul bloc extérieur).
- **`student.photo`** : si vous n’avez pas d’URL, omettez le champ ou envoyez `""` (chaîne vide acceptée).

| Code | Corps |
|------|--------|
| `201` | `{ "success": true, "data": <résultat bulkWrite MongoDB> }` |
| `400` | Validation Zod (voir message d’erreur : email, photo devant être une URL si fournie, etc.) |

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

#### `DELETE /api/parcours/:id` — suppression unitaire

Aucun corps. L’`_id` est un ObjectId hexadécimal sur 24 caractères.

| Code | Corps |
|------|--------|
| `200` | `{ "success": true, "data": <document supprimé> }` |
| `400` | Identifiant mal formé (Zod) |
| `404` | `{ "success": false, "message": "Parcours non trouvé" }` |

### 📚 Ressources (Available Documents)

Préfixe: **`/api/resources`**

| Méthode | Chemin | Description |
|--------|--------|-------------|
| `GET` | `/api/resources` | Liste des ressources (filtres `categorie`, `status`, `search`) |
| `GET` | `/api/resources/:id` | Détail d’une ressource par `_id` |
| `POST` | `/api/resources` | Création d’une ressource (schéma discriminé par `categorie`) |
| `PATCH` | `/api/resources/:id` | Mise à jour partielle d’une ressource |
| `DELETE` | `/api/resources/:id` | Suppression d’une ressource |

#### Types communs (toutes les ressources)

| Champ | Type | Requis | Valeur par défaut / Notes |
|------|------|--------|---------------------------|
| `categorie` | `string` (`labo`, `stage`, `sujet`, `session`, `validation`, `releve`) | Oui | Clé discriminante |
| `designation` | `string` | Oui | Libellé affiché |
| `description` | `Array<{ title: string, contenu: string[] }>` | Oui | Sections de contenu |
| `amount` | `number` (>= 0) | Oui | Montant |
| `currency` | `string` | Non | `USD` |
| `status` | `literal "inactive"` (POST) | Non | Défaut **`inactive`**. `active` est **refusé** à la création ; utilisez `PATCH /api/resources/:id` avec `"status": "active"` pour publier la ressource. |
| `branding.institut` | `string` | Non | `INBTP` |
| `branding.section` | `string` | Non | `""` |
| `branding.sectionRef` | `string` | Non | `""` |
| `branding.chef` | `string` | Non | `""` |
| `branding.contact` | `string` | Non | `""` |
| `branding.email` | `string` | Non | `""` |
| `branding.adresse` | `string` | Non | `""` |

#### Champs spécifiques par `categorie` (création `POST /api/resources`)

À la **création**, le corps ne peut pas contenir `"status": "active"` : seul `inactive` est accepté (souvent omis, la valeur par défaut s’applique).

| Catégorie | Champs supplémentaires requis | Champs optionnels |
|----------|-------------------------------|-------------------|
| `labo` | `matiere.reference`, `titulaire.nom` | `matiere.designation`, `matiere.credit`, `titulaire.reference`, `titulaire.email`, `titulaire.matricule`, `note` |
| `stage` | `matiere.reference`, `titulaire.nom` | identiques à `labo` |
| `sujet` | `matiere.reference`, `lecteurs[]` (chaque lecteur doit avoir `nom`) | `matiere.credit`, infos optionnelles des lecteurs, `note` |
| `session` | `matieres[]` | Chaque matière peut contenir `reference`, `designation`, `credit` |
| `validation` | `programme.classe`, `programme.filiere`, `programme.credits`, `annee.slug` | `annee.debut`, `annee.fin` |
| `releve` | `programme.classe`, `programme.filiere`, `programme.credits`, `annee.slug` | `annee.debut`, `annee.fin` |

#### Lecture des ressources

##### `GET /api/resources` — filtres

Tous les filtres sont optionnels et combinés par **ET**.

| Paramètre | Type | Effet |
|----------|------|-------|
| `categorie` | `string` | Filtre exact sur `categorie` |
| `status` | `string` | Filtre exact sur `status` |
| `search` ou `designation` | `string` | Recherche partielle (regex insensible à la casse) sur `designation` |
| `page` | `number` | Numéro de page (défaut `1`) |
| `limit` | `number` | Taille de page (défaut `10`, max `200`) |
| `sortBy` | `string` | Champ de tri (défaut `createdAt`) |
| `sortOrder` | `asc \| desc` | Sens du tri (défaut `desc`) |
| `criteria` | `string` (JSON) | Critères dynamiques JSON (objet) |

**Critères dynamiques / multi-critères**
- Vous pouvez envoyer des critères additionnels directement en query string (hors clés réservées), ex. `branding.section=BTP&amount__gte=10`.
- Opérateurs supportés via suffixe `__`: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `regex`.
- Exemples:
  - `amount__gte=10&amount__lte=50`
  - `categorie__in=labo,stage`
  - `branding.section__regex=btp`
  - `criteria={"branding.section":"BTP","amount__gte":10}`

**Réponse**
- `200`: `{ "success": true, "data": [ Resource ], "meta": { "total": number, "page": number, "limit": number } }`

##### `GET /api/resources/:id`

- `200`: `{ "success": true, "data": Resource }`
- `404`: `{ "success": false, "error": "Resource not found" }`

#### Modification et suppression des ressources

##### `PATCH /api/resources/:id`

- Corps: objet JSON partiel (les champs à modifier).
- Note: cette route ne passe pas par un schéma Zod partiel; les validations strictes de format sont moins encadrées qu’au `POST`.

Exemple:
```json
{
  "designation": "Bon de Laboratoire - Physique II",
  "amount": 20,
  "status": "active"
}
```

Réponse:
- `200`: `{ "success": true, "data": Resource | null }`

##### `DELETE /api/resources/:id`

- Aucun corps JSON.
- `200`: `{ "success": true, "message": "Resource deleted" }`

---

### 🛒 Commandes (Orders)

Préfixe: **`/api/commandes`**

| Méthode | Chemin | Description |
|--------|--------|-------------|
| `POST` | `/api/commandes` | Création d’une commande (union discriminée par `type`) |
| `GET` | `/api/commandes` | Liste paginée **pour un parcours** (voir `parcoursId` obligatoire) |
| `GET` | `/api/commandes/:id` | Détail d’une commande (avec `populate` parcours + ressource) |
| `GET` | `/api/commandes/:id/download` | Téléchargement PDF si `payment=success` |
| `GET` | `/api/commandes/verify/:id` | Vérification publique (QR code / partage) |
| `GET` | `/api/commandes/admin/list` | Liste admin paginée + filtres |
| `PATCH` | `/api/commandes/admin/:id` | Mise à jour admin (validation, paiement, livraison, notes...) |
| `POST` | `/api/commandes/test/email` | Test d’envoi email groupé |

#### Types communs (toutes les commandes)

| Champ | Type | Requis | Valeur par défaut / Notes |
|------|------|--------|---------------------------|
| `parcoursId` | `string` | Oui | `_id` du parcours étudiant |
| `ressourceId` | `string` | Oui | `_id` de la ressource demandée |
| `telephone` | `string` | Oui | Téléphone de contact |
| `type` | `labo \| stage \| sujet \| session \| resultat` | Oui | Discriminant |
| `payment` | `success \| pending \| failed` | Non | `pending` |
| `delivered` | `boolean` | Non | `false` |
| `validationStatus` | `pending \| validated \| rejected` | Non | `pending` |
| `validationDate` | `string` (ISO recommandé) | Non | Défini côté admin |
| `validatedBy` | `string` | Non | Défini côté admin |

Champs générés automatiquement à la création:
- `orderNumber` (format `CMD-YYYY-XXXX`)
- `reference` (format `REF-TYPE-YYYY-MATRICULE-XXXX`)

#### Création `POST /api/commandes` (payload par `type`)

| Type | Champs supplémentaires requis | Optionnels |
|------|-------------------------------|------------|
| `labo` | aucun | `cote` (`0..20`), `observation` |
| `stage` | `stageTitle`, `recipientName`, `recipientQuality`, `recipientSex` (`M`/`F`), `companyName`, `companyLocation` | `documentReference` |
| `sujet` | `titre`, `directeur`, `co_directeur`, `thematique`, `justification[]`, `problematique[]`, `objectif[]`, `methodologie[]`, `resultats_attendus[]`, `chronogrammes[]`, `references[]` | `note`, `validation`, `observations` |
| `session` | aucun | `bulletin` (défaut `false`), `recoursIds[]` |
| `resultat` | aucun | aucun |

Structure de section utilisée dans `methodologie`, `resultats_attendus`, `chronogrammes`, `references`:
```json
{ "title": "string", "contenu": ["ligne 1", "ligne 2"] }
```

Réponses:
- `201`: `{ "success": true, "data": Order }`
- `400`: erreur de validation (Zod)
- `500`: erreur métier possible (ex. parcours non trouvé, ressource non trouvée, parcours suspendu/abandon)

#### Lecture des commandes

##### `GET /api/commandes` — liste (non-admin)

Retourne les commandes **uniquement** pour le parcours indiqué. Les filtres (pagination, désignation, critères dynamiques) sont les **mêmes** que pour `GET /api/commandes/admin/list`, sauf :

- **`parcoursId`** (query, **obligatoire**) : `_id` MongoDB du parcours ; le résultat est toujours restreint à ce parcours (toute tentative de filtre `parcoursId` dans `criteria` ou en query dynamique est ignorée côté serveur).
- **`matricule`** : ignoré sur cette route (utiliser le parcours ciblé).
- **Sécurité** : ce microservice n’applique pas d’auth JWT ici ; en production, l’API doit être protégée (gateway) ou vous devez valider que l’appelant a le droit de consulter ce `parcoursId`.

| Paramètre | Type | Description |
|----------|------|-------------|
| `parcoursId` | `string` | **Requis** — périmètre liste |
| `type` | `string` | Filtre exact sur le type |
| `payment` | `string` | Filtre exact sur le paiement |
| `search` ou `designation` | `string` | Recherche par `ressource.designation` |
| `page` | `number` | Page (défaut `1`) |
| `limit` | `number` | Taille (défaut `10`, max `200`) |
| `sortBy` | `string` | Tri (défaut `createdAt`) |
| `sortOrder` | `asc \| desc` | Sens (défaut `desc`) |
| `criteria` | `string` (JSON) | Critères dynamiques (voir admin) |

Réponses :
- `200` : `{ "success": true, "data": [ OrderPopulated ], "meta": { "total", "page", "limit" } }`
- `400` : `parcoursId` manquant ou ObjectId invalide

##### `GET /api/commandes/:id`
- `200`: `{ "success": true, "data": OrderPopulated }`
- `404`: `{ "success": false, "error": "Commande non trouvée" }`

##### `GET /api/commandes/:id/download`
- Condition: `payment` doit être `success`
- `200`: PDF (`Content-Type: application/pdf`)
- `403`: `{ "success": false, "error": "Paiement non confirmé" }`
- `404`: commande introuvable

##### `GET /api/commandes/verify/:id`
- Endpoint public de vérification.
- `200`: `{ "success": true, "verified": true, "data": { orderNumber, reference, type, student, status, delivered } }`
- `404`: commande introuvable

#### Admin: filtres, pagination, update

##### `GET /api/commandes/admin/list`

| Paramètre | Type | Description |
|----------|------|-------------|
| `type` | `string` | Filtre exact sur le type de commande |
| `payment` | `string` | Filtre exact sur le statut de paiement |
| `matricule` | `string` | Recherche via `parcours.student.matricule` |
| `search` ou `designation` | `string` | Recherche par `ressource.designation` (insensible à la casse) |
| `page` | `number` | Page (défaut `1`) |
| `limit` | `number` | Taille de page (défaut `10`, max `200`) |
| `sortBy` | `string` | Champ de tri (défaut `createdAt`) |
| `sortOrder` | `asc \| desc` | Sens du tri (défaut `desc`) |
| `criteria` | `string` (JSON) | Critères dynamiques JSON (objet) |

Critères dynamiques / multi-critères:
- Même mécanisme que les ressources (`field=value`, `field__op=value`, JSON `criteria`).
- Exemples:
  - `validationStatus=validated&delivered=true`
  - `createdAt__gte=2026-01-01&createdAt__lte=2026-12-31`
  - `criteria={"type__in":"stage,sujet","delivered":false}`

Réponse:
- `200`: `{ "success": true, "data": [ OrderPopulated ], "meta": { "total": number, "page": number, "limit": number } }`

##### `PATCH /api/commandes/admin/:id`

Corps: objet partiel de mise à jour. Exemples de champs fréquemment patchés:
- `payment`: `success`/`pending`/`failed`
- `validationStatus`: `pending`/`validated`/`rejected`
- `validationDate`: date ISO
- `validatedBy`: string
- `delivered`: boolean
- champs métier de type (ex. `cote`, `observation`, etc.)

Réponse:
- `200`: `{ "success": true, "data": Order }`
- `404`/`500`: si commande introuvable ou autre erreur serveur

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

**Lister les commandes du parcours** (pagination, recherche par désignation de ressource, critères dynamiques — `parcoursId` obligatoire en query) :

```bash
curl -sS "http://localhost:3000/api/commandes?parcoursId=ID_DU_PARCOURS&page=1&limit=10&payment=pending&designation=laboratoire"
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
