# Système de Reconnaissance Faciale

Un système d'authentification biométrique moderne utilisant la reconnaissance faciale, développé avec React et FastAPI.

## Fonctionnalités

- 🔐 Authentification sécurisée par reconnaissance faciale
- 👤 Inscription des utilisateurs avec capture faciale
- 📝 Gestion des informations utilisateur (nom, email, département)
- 🎯 Interface utilisateur moderne et responsive
- ⚡ Traitement en temps réel des images
- 🔄 Vérification d'unicité des emails

## Technologies Utilisées

### Frontend
- React avec TypeScript
- Material-UI pour l'interface utilisateur
- Webcam pour la capture faciale
- Animations et transitions fluides

### Backend
- FastAPI (Python)
- MTCNN pour la détection des visages
- InceptionResnetV1 pour l'extraction des caractéristiques faciales
- Gestion sécurisée des données utilisateur

## Installation

### Prérequis
- Python 3.9.13 (recommandé) ou 3.9.x
- Node.js 14+ et npm
- Webcam fonctionnelle

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: .\venv\Scripts\activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd face-recognition-web
npm install
npm run dev
```

### Dépendances principales
#### Backend
- fastapi==0.96.0
- torch==2.0.0 (CPU version)
- facenet-pytorch==2.5.3
- numpy==1.23.4
- Pillow==9.5.0

#### Frontend
- React 18+
- Material-UI
- react-webcam

## Utilisation

1. Lancer le backend (port 8000)
2. Lancer le frontend (port 5173)
3. Accéder à l'application via `http://localhost:5173`

### Inscription
- Cliquer sur "Register"
- Remplir le formulaire (prénom, nom, email, département)
- Positionner son visage devant la caméra
- Valider l'inscription

### Authentification
- Cliquer sur "Authenticate"
- Positionner son visage devant la caméra
- Cliquer sur "Authentificate"

## Sécurité

- Stockage sécurisé des embeddings faciaux
- Validation des emails uniques
- Vérification en temps réel des visages
- Seuil de similarité configurable

## Auteur

Cheikh Gaye
