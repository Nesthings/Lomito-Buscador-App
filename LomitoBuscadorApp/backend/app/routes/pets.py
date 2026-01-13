from fastapi import APIRouter, UploadFile, Form, HTTPException, Body
from typing import List, Optional, Dict, Any # <-- 1. IMPORTACIONES AÑADIDAS
import uuid
from firebase_admin import firestore

# Use relative path for imports
from ..services.firebase_service import db, bucket

router = APIRouter(prefix="/pets", tags=["Pets"])

# =========================================================
# ENDPOINT DE REGISTRO (POST)
# =========================================================
@router.post("/register")
async def register_pet(
    name: str = Form(...),
    photos: List[UploadFile] = Form(...),
    species: str = Form(...),
    breed: str = Form(...),
    size: str = Form(...),
    age: str = Form(...),
    sex: str = Form(...),
    colors: List[str] = Form(...),
    hasSpots: bool = Form(False),
    isVaccinated: bool = Form(...),
    hasIllness: bool = Form(...),
    illnessDetails: Optional[str] = Form(None),
    temperament: str = Form(...),
    specialFeatures: Optional[str] = Form(None),
    ownerName: str = Form(...),
    ownerPhone: str = Form(...),
    ownerEmail: str = Form(...),
    altOwnerName: Optional[str] = Form(None),
    altOwnerPhone: Optional[str] = Form(None),
    address: Optional[str] = Form(None)
):
    try:
        owner_id = "CURRENT_USER_ID" 
        photo_urls = []
        for photo in photos:
            file_extension = photo.filename.split('.')[-1] if '.' in photo.filename else 'jpg'
            file_name = f"pets/{owner_id}/{uuid.uuid4()}.{file_extension}"
            blob = bucket.blob(file_name)
            blob.upload_from_file(photo.file, content_type=photo.content_type)
            blob.make_public()
            photo_urls.append(blob.public_url)
        pet_data = {
            'ownerId': owner_id,
            'basicInfo': { 'name': name, 'photos': photo_urls },
            'specificInfo': { 'species': species, 'breed': breed, 'size': size, 'age': int(age), 'sex': sex, 'isVaccinated': isVaccinated, 'hasIllness': hasIllness, 'illnessDetails': illnessDetails, 'temperament': temperament, 'specialFeatures': specialFeatures, 'colors': colors,
                'hasSpots': hasSpots },
            'ownerInfo': { 'ownerName': ownerName, 'ownerPhone': ownerPhone, 'ownerEmail': ownerEmail, 'altOwnerName': altOwnerName, 'altOwnerPhone': altOwnerPhone, 'address': address },
            'status': 'safe', 'createdAt': firestore.SERVER_TIMESTAMP   
        }
        doc_ref = db.collection('pets').document()
        doc_ref.set(pet_data)
        return {"success": True, "petId": doc_ref.id, "message": "¡Mascota registrada exitosamente!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocurrió un error en el servidor: {e}")

# =========================================================
# 2. ENDPOINT DE OBTENER MIS MASCOTAS (GET)
# =========================================================
@router.get("/my-pets/{owner_id}")
async def get_my_pets(owner_id: str):
    """
    Obtiene todas las mascotas registradas por un usuario específico.
    """
    try:
        pets_ref = db.collection('pets').where('ownerId', '==', owner_id)
        pets_query = pets_ref.stream()
        
        pets_list = []
        for doc in pets_query:
            pet_data = doc.to_dict()
            pet_data['basicInfo'] = pet_data.get('basicInfo', {})
            pet_data['specificInfo'] = pet_data.get('specificInfo', {})
            pet_data['petId'] = doc.id 
            if 'photos' not in pet_data['basicInfo']:
                 pet_data['basicInfo']['photos'] = []
            pets_list.append(pet_data)
        
        return {"pets": pets_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocurrió un error en el servidor: {e}")

# =========================================================
# 3. ENDPOINT PARA OBTENER UNA SOLA MASCOTA (GET) 
# =========================================================
@router.get("/{pet_id}")
async def get_pet_by_id(pet_id: str):
    """
    Obtiene los detalles de una mascota específica por su ID de documento.
    """
    try:
        pet_ref = db.collection('pets').document(pet_id)
        pet_doc = pet_ref.get()

        if not pet_doc.exists:
            raise HTTPException(status_code=404, detail="Mascota no encontrada")

        pet_data = pet_doc.to_dict()
        pet_data['petId'] = pet_doc.id # Añadimos el ID para consistencia

        return {"pet": pet_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# 4. ENDPOINT PARA ACTUALIZAR MASCOTA (PUT)
# =========================================================
@router.put("/{pet_id}")
async def update_pet_details(pet_id: str, pet_data: Dict[str, Any] = Body(...)):
    """
    Actualiza los detalles de una mascota existente en Firestore.
    Recibe un cuerpo JSON con los campos a actualizar.
    """
    try:
        pet_ref = db.collection('pets').document(pet_id)
        
        # Reestructuramos los datos para asegurar la consistencia en Firestore
        update_data = {
            'basicInfo': {
                'name': pet_data.get('name'),
                'photos': pet_data.get('photos')
            },
            'specificInfo': {
                'species': pet_data.get('species'), 'breed': pet_data.get('breed'),
                'size': pet_data.get('size'), 'age': int(pet_data.get('age', 0)), 'sex': pet_data.get('sex'),
                'isVaccinated': pet_data.get('isVaccinated'), 'hasIllness': pet_data.get('hasIllness'),
                'illnessDetails': pet_data.get('illnessDetails'), 'temperament': pet_data.get('temperament'),
                'specialFeatures': pet_data.get('specialFeatures')
            },
            'ownerInfo': {
                'ownerName': pet_data.get('ownerName'), 'ownerPhone': pet_data.get('ownerPhone'),
                'ownerEmail': pet_data.get('ownerEmail'), 'altOwnerName': pet_data.get('altOwnerName'),
                'altOwnerPhone': pet_data.get('altOwnerPhone'), 'address': pet_data.get('address')
            }
        }
        
        # 'merge=True' actualiza solo los campos que existen en 'update_data'
        pet_ref.set(update_data, merge=True)

        return {"success": True, "message": "Perfil de la mascota actualizado."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudieron guardar los cambios: {e}")
    

 # =========================================================
# ENDPOINT PARA ELIMINAR MASCOTA (DELETE) 
# =========================================================
@router.delete("/{pet_id}")
async def delete_pet(pet_id: str):
    """
    Elimina una mascota de Firestore por su ID de documento.
    """
    try:
        pet_ref = db.collection('pets').document(pet_id)
        
        # 1. Verificar que la mascota exista antes de intentar borrarla.
        pet_doc = pet_ref.get()
        if not pet_doc.exists:
            raise HTTPException(status_code=404, detail="Mascota no encontrada")
        
        pet_data = pet_doc.to_dict()
        photo_urls = pet_data.get('basicInfo', {}).get('photos', [])
        for url in photo_urls:
            try:
    # Extraer el nombre del archivo (blob) desde la URL pública
                if f"{bucket.name}/" in url:
                     blob_name = url.split(f"{bucket.name}/")[-1].split("?")[0]
                     blob = bucket.blob(blob_name)
                     blob.delete()
            except Exception as e:
                # Si un archivo no se puede eliminar, registramos el error pero continuamos
                print(f"No se pudo eliminar el archivo {url} de Storage: {e}")
        # 2. Eliminar el documento de Firestore.
        pet_ref.delete()

        # 3. Devolver una respuesta exitosa.
        return {"success": True, "message": "Mascota eliminada exitosamente"}

    except Exception as e:
        # Manejar otros posibles errores del servidor.
        raise HTTPException(status_code=500, detail=f"Ocurrió un error en el servidor: {e}")   