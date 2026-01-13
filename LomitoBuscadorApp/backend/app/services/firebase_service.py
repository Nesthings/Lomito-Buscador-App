# RUTA: backend/app/services/firebase_service.py

import firebase_admin
from firebase_admin import credentials, firestore, storage # 1. Importa storage

# Carga las credenciales (asegúrate de que el nombre del archivo sea correcto)
cred = credentials.Certificate('lomito-app-firebase-adminsdk-fbsvc-8b3b69e589.json')

# Inicializar la app de Firebase si no se ha hecho
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        # 2. Añade la URL de tu bucket de Firebase Storage
        'storageBucket': 'lomito-app.firebasestorage.app'
    })

# Exportar las instancias para usarlas en otros archivos
db = firestore.client()
bucket = storage.bucket() # 3. Exporta el bucket