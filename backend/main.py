import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import torch
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
import io
import base64
import json
from typing import Dict
import os
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserRegistration(BaseModel):
    image: str
    firstName: str
    lastName: str
    email: EmailStr  # Utilisation de EmailStr pour la validation du format email
    department: str

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route de test
@app.get("/")
async def root():
    return {"status": "ok", "message": "Face Recognition API is running"}

# Initialisation des modèles
logger.info("Initializing models...")
try:
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    mtcnn = MTCNN(device=device)
    resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)
    logger.info("Models initialized successfully")
except Exception as e:
    logger.error(f"Error initializing models: {str(e)}")
    raise

# Stockage des embeddings et informations utilisateur
USERS_FILE = 'users.json'
users_data = {}

# Charger les données utilisateur existantes
if os.path.exists(USERS_FILE):
    try:
        with open(USERS_FILE, 'r') as f:
            users_data = json.load(f)
            # Convertir les embeddings en numpy arrays
            for user_id in users_data:
                users_data[user_id]['embedding'] = np.array(users_data[user_id]['embedding'])
        logger.info(f"Loaded {len(users_data)} existing users")
    except Exception as e:
        logger.error(f"Error loading users data: {str(e)}")

def save_users_data():
    """Sauvegarder les données utilisateur dans un fichier"""
    try:
        # Convertir les embeddings numpy en listes pour la sérialisation JSON
        serializable_data = {}
        for user_id, user_info in users_data.items():
            serializable_data[user_id] = {
                **user_info,
                'embedding': user_info['embedding'].tolist()
            }
        
        with open(USERS_FILE, 'w') as f:
            json.dump(serializable_data, f, indent=2)
        logger.info("Users data saved successfully")
    except Exception as e:
        logger.error(f"Error saving users data: {str(e)}")

def is_email_unique(email: str) -> bool:
    """Vérifier si l'email n'est pas déjà utilisé"""
    return not any(user_info.get('email', '').lower() == email.lower() 
                  for user_info in users_data.values())

def process_image(image_data: str) -> torch.Tensor:
    """Traiter l'image et extraire l'embedding du visage"""
    try:
        # Décoder l'image base64
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        image = Image.open(io.BytesIO(image_bytes))
        logger.info("Image decoded successfully")
        
        # Détecter et aligner le visage
        face = mtcnn(image)
        if face is None:
            logger.warning("No face detected in the image")
            raise HTTPException(status_code=400, detail="Pas de visage détecté")
        
        logger.info("Face detected successfully")
        
        # Obtenir l'embedding
        embedding = resnet(face.unsqueeze(0))
        logger.info("Embedding extracted successfully")
        
        return embedding[0].detach().cpu().numpy()
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/register")
async def register_face(user_data: UserRegistration):
    """Enregistrer un nouveau visage avec les informations utilisateur"""
    logger.info("Processing registration request")
    try:
        # Vérifier si l'email est déjà utilisé
        if not is_email_unique(user_data.email):
            logger.warning(f"Email {user_data.email} is already registered")
            raise HTTPException(
                status_code=400,
                detail="This email address is already registered. Please use a different email."
            )
        
        # Générer un ID unique pour le nouveau visage
        user_id = f"user_{len(users_data) + 1}"
        
        # Obtenir l'embedding du visage
        embedding = process_image(user_data.image)
        
        # Sauvegarder les données utilisateur
        users_data[user_id] = {
            "firstName": user_data.firstName,
            "lastName": user_data.lastName,
            "email": user_data.email,
            "department": user_data.department,
            "embedding": embedding,
            "registeredAt": datetime.now().isoformat(),
            "lastAuthenticated": None
        }
        save_users_data()
        
        logger.info(f"User registered successfully with ID: {user_id}")
        return {"status": "success", "user_id": user_id}
    
    except HTTPException as he:
        # Réutiliser l'exception HTTP telle quelle
        raise he
    except Exception as e:
        logger.error(f"Error in registration: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/authenticate")
async def authenticate_face(image: Dict[str, str]):
    """Authentifier un visage et retourner les informations utilisateur"""
    logger.info("Processing authentication request")
    try:
        if not users_data:
            logger.warning("No registered users in the database")
            raise HTTPException(status_code=400, detail="No registered users in the database")
        
        # Obtenir l'embedding du visage
        embedding = process_image(image['image'])
        
        # Calculer les distances avec tous les visages enregistrés
        min_distance = float('inf')
        matched_user = None
        
        for user_id, user_info in users_data.items():
            distance = np.linalg.norm(embedding - user_info['embedding'])
            if distance < min_distance:
                min_distance = distance
                matched_user = user_id
        
        # Seuil de similarité (à ajuster selon vos besoins)
        SIMILARITY_THRESHOLD = 0.7
        
        if min_distance < SIMILARITY_THRESHOLD:
            # Mettre à jour la dernière authentification
            users_data[matched_user]['lastAuthenticated'] = datetime.now().isoformat()
            save_users_data()
            
            # Préparer les données utilisateur à renvoyer
            user_info = users_data[matched_user].copy()
            del user_info['embedding']  # Ne pas renvoyer l'embedding
            
            logger.info(f"Authentication successful, matched with user: {matched_user}")
            return {
                "status": "success",
                "matched": True,
                "confidence": float(1 - min_distance),
                "user": user_info
            }
        else:
            logger.info("Authentication failed: No matching face found")
            return {
                "status": "success",
                "matched": False,
                "confidence": float(1 - min_distance)
            }
    
    except Exception as e:
        logger.error(f"Error in authentication: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
