# Contexte du Projet : Student-Service (ELMESACAD)

## Objectif
Digitaliser la commande et la délivrance des documents académiques et de recherche pour les étudiants de l'INBTP.

## Types de Ressources & Documents
### 1. Recherche
- **Bon de Laboratoire :** Commande -> Validation -> Mail -> PDF (Note via QR).
- **Sujet de Recherche :** Commande (avec description projet) -> Validation -> Mail -> PDF (Génère page de garde + Note via QR).
- **Stage :** Commande -> Suivi de disponibilité -> Lettre de stage.

### 2. Enseignement
- **Session (Macaron/Bulletin) :** Commande -> Mail -> Macaron PDF. QR Code sur macaron permet de générer le bulletin final après délibération.
- **Fiche de Validation :** Crédits académiques avec authentification par QR.
- **Relevé de Cote :** Commande par programme -> Notification disponibilité -> PDF avec QR d'authenticité.

## Intégration Email
Service externe utilisé via POST :
- Endpoint: `[URL_FOURNIE]/api/send-email`
- Payload: `{ to, subject, html, attachments? }`

## Logique QR Code
Chaque document généré doit intégrer un QR Code pointant vers le domaine `elmes-acad.com` pour vérification ou action liée.