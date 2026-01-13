from fastapi import APIRouter, Query, HTTPException, UploadFile, File, Form
from typing import Optional, List
from ..services.firebase_service import db, bucket
from firebase_admin import firestore
import uuid
import math
import datetime
import traceback # Importamos traceback para el diagnóstico

router = APIRouter(prefix="/sightings", tags=["sightings"])

def _calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """Calcula la distancia en kilómetros entre dos puntos usando la fórmula de Haversine."""
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return round(distance, 2)

@router.get("/active-reports")
async def get_active_reports(
    user_lat: float = Query(..., description="Latitud actual del usuario"),
    user_lon: float = Query(..., description="Longitud actual del usuario"),
    limit: int = Query(20, description="Límite de resultados"),
    offset: int = Query(0, description="Offset para paginación")
):
    """Obtener feed de reportes activos con distancia calculada."""
    try:
        reports_ref = db.collection('lostReports')\
            .where('status', '==', 'active')\
            .order_by('reportedAt', direction=firestore.Query.DESCENDING)\
            .limit(limit).offset(offset)
        
        reports_list = []
        for doc in reports_ref.stream():
            report_data = doc.to_dict()
            
            if 'reportedAt' in report_data and isinstance(report_data['reportedAt'], datetime.datetime):
                report_data['reportedAt'] = report_data['reportedAt'].isoformat()
            
            search_route = report_data.get('searchRoute', [])
            for sighting in search_route:
                if 'timestamp' in sighting and isinstance(sighting['timestamp'], datetime.datetime):
                    sighting['timestamp'] = sighting['timestamp'].isoformat()

            pet_ref = db.collection('pets').document(report_data['petId'])
            pet_doc = pet_ref.get()
            if not pet_doc.exists: continue
            pet_data = pet_doc.to_dict()
            
            last_known_location = search_route[-1].get('location') if search_route else report_data.get('lastSeenLocation')
            distance = None
            if last_known_location and 'latitude' in last_known_location:
                distance = _calculate_haversine_distance(user_lat, user_lon, last_known_location['latitude'], last_known_location['longitude'])

            report_data['reportId'] = doc.id
            report_data['petInfo'] = pet_data
            report_data['lastSeenLocation'] = last_known_location
            report_data['distanceInKm'] = distance
            reports_list.append(report_data)
        
        reports_list.sort(key=lambda r: r.get('distanceInKm') if r.get('distanceInKm') is not None else float('inf'))
        return {'reports': reports_list}
    except Exception as e:
        print("\n--- ERROR DETALLADO EN GET ACTIVE REPORTS ---")
        traceback.print_exc()
        print("-----------------------------------------\n")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public-sightings")
async def get_public_sightings(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[float] = None,
    limit: int = Query(20),
    offset: int = Query(0)
):
    """Obtener tablero público de avistamientos sin reporte formal"""
    try:
        sightings_ref = db.collection('publicSightings')\
            .where('status', '==', 'active')\
            .order_by('timestamp', direction=firestore.Query.DESCENDING)\
            .limit(limit).offset(offset)
        
        sightings = []
        for doc in sightings_ref.stream():
            sighting_data = doc.to_dict()
            
            if latitude and longitude and radius:
                sighting_location = sighting_data['location']
                distance = _calculate_haversine_distance(latitude, longitude, sighting_location['latitude'], sighting_location['longitude'])
                if distance > radius: continue
            
            user_ref = db.collection('users').document(sighting_data['reportedBy'])
            user_doc = user_ref.get()
            user_data = user_doc.to_dict() if user_doc.exists else {}

            if 'timestamp' in sighting_data and isinstance(sighting_data['timestamp'], datetime.datetime):
                sighting_data['timestamp'] = sighting_data['timestamp'].isoformat()
            
            comments = sighting_data.get('comments', [])
            for comment in comments:
                 if 'timestamp' in comment and isinstance(comment['timestamp'], datetime.datetime):
                    comment['timestamp'] = comment['timestamp'].isoformat()

            sighting_data['sightingId'] = doc.id
            sighting_data['reportedBy'] = {'name': user_data.get('displayName', 'Usuario'), 'photo': user_data.get('photoURL')}
            
            sightings.append(sighting_data)
        
        return {'sightings': sightings}
    except Exception as e:
        print("\n--- ERROR DETALLADO AL OBTENER AVISTAMIENTOS PÚBLICOS ---")
        traceback.print_exc()
        print("-----------------------------------------------------\n")
        raise HTTPException(status_code=500, detail=str(e))

# --- ¡NUEVO ENDPOINT AÑADIDO! ---
@router.get("/public-sightings/{sighting_id}")
async def get_public_sighting_details(sighting_id: str):
    """
    Obtiene los detalles de un avistamiento público específico por su ID.
    """
    try:
        sighting_ref = db.collection('publicSightings').document(sighting_id)
        sighting_doc = sighting_ref.get()

        if not sighting_doc.exists:
            raise HTTPException(status_code=404, detail="Avistamiento no encontrado")
        
        sighting_data = sighting_doc.to_dict()
        
        # --- Obtener info del usuario ---
        user_ref = db.collection('users').document(sighting_data['reportedBy'])
        user_doc = user_ref.get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        sighting_data['reportedBy'] = {'name': user_data.get('displayName', 'Usuario'), 'photo': user_data.get('photoURL')}

        # --- Formatear fechas (principal y comentarios) ---
        if 'timestamp' in sighting_data and isinstance(sighting_data['timestamp'], datetime.datetime):
            sighting_data['timestamp'] = sighting_data['timestamp'].isoformat()
        
        comments = sighting_data.get('comments', [])
        for comment in comments:
             if 'timestamp' in comment and isinstance(comment['timestamp'], datetime.datetime):
                comment['timestamp'] = comment['timestamp'].isoformat()
        
        sighting_data['sightingId'] = sighting_doc.id

        return {"sighting": sighting_data}
    
    except Exception as e:
        print(f"\n--- ERROR AL OBTENER DETALLE DE AVISTAMIENTO PÚBLICO ---")
        traceback.print_exc()
        print("---------------------------------------------------\n")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/public-sightings/create")
async def create_public_sighting(
    reported_by: str = Form(...), 
    latitude: float = Form(...), 
    longitude: float = Form(...), 
    address: str = Form(...),
    description: str = Form(...), 
    species: str = Form(...), 
    approximate_size: str = Form(...),
    colors: List[str] = Form(...), 
    photos: List[UploadFile] = File([])
):
    """Crear avistamiento público (sin reporte formal)"""
    try:
        photo_urls = []
        for photo in photos:
            blob = bucket.blob(f'public_sightings/{uuid.uuid4()}.jpg')
            blob.upload_from_string(await photo.read(), content_type=photo.content_type)
            blob.make_public()
            photo_urls.append(blob.public_url)
        
        sighting_data = {
            'reportedBy': reported_by,
            'location': {'latitude': latitude, 'longitude': longitude, 'address': address},
            'photos': photo_urls,
            'description': description,
            'petDescription': {'species': species, 'approximateSize': approximate_size, 'colors': colors},
            'timestamp': firestore.SERVER_TIMESTAMP,
            'comments': [],
            'status': 'active'
        }
        
        db.collection('publicSightings').add(sighting_data)
        return {'success': True, 'message': 'Avistamiento público creado'}
    except Exception as e:
        print("\n--- ERROR AL CREAR AVISTAMIENTO PÚBLICO ---")
        traceback.print_exc()
        print("--------------------------------------------\n")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/public-sightings/{sighting_id}/comment")
async def add_comment_to_sighting(sighting_id: str, user_id: str, comment: str):
    """Agregar comentario a un avistamiento público"""
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        
        comment_data = {
            'userId': user_id,
            'userName': user_data.get('displayName', 'Usuario'),
            'comment': comment,
            'timestamp': datetime.datetime.now(datetime.timezone.utc)
        }
        
        sighting_ref = db.collection('publicSightings').document(sighting_id)
        sighting_ref.update({'comments': firestore.ArrayUnion([comment_data])})
        
        return {'success': True}
    except Exception as e:
        print("\n--- ERROR AL AÑADIR COMENTARIO PÚBLICO ---")
        traceback.print_exc()
        print("-------------------------------------------\n")
        raise HTTPException(status_code=500, detail=str(e))