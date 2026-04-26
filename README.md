# Student Service - INBTP

Microservice de gestion des parcours étudiants, des ressources académiques et des commandes de documents officiels.

## 🚀 Endpoints API

### 🎓 Parcours (Student Programs)
- `GET /api/parcours` : Liste paginée des parcours (Filtres : `search`, `filiere`, `annee`).
- `POST /api/parcours` : Création unitaire ou bulk (si tableau fourni).
- `PATCH /api/parcours` : Mise à jour massive via un tableau d'objets avec `_id`.
- `DELETE /api/parcours` : Suppression multiple via `{ ids: string[] }`.

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
```bash
curl -X POST http://localhost:3000/api/resources \
-H "Content-Type: application/json" \
-d '{
  "type": "labo",
  "designation": "Bon de Laboratoire - Physique",
  "category": "labo",
  "amount": 15,
  "status": "active",
  "branding": {
    "institut": "INBTP",
    "section": "BTP",
    "chef": "Dr. Ir. KATEMBO",
    "contact": "+243 81 000 0000",
    "email": "section.btp@inbtp.ac.cd",
    "adresse": "Kinshasa/Gombe"
  }
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
```bash
curl -X PATCH http://localhost:3000/api/commandes/admin/ID_DE_LA_COMMANDE \
-H "Content-Type: application/json" \
-d '{
  "payment": "success",
  "validationStatus": "validated",
  "validationDate": "2026-04-26T18:00:00Z",
  "validatedBy": "Admin_Section_BTP",
  "cote": 17,
  "observation": "Travail validé par le chef de section."
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
