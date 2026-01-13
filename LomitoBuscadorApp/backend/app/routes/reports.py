from fastapi import APIRouter, HTTPException, Body, Form, File, UploadFile
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from ..services.firebase_service import db, bucket
from firebase_admin import firestore
import uuid
import datetime

router = APIRouter(prefix="/reports", tags=["Reports"])


class CreateReportPayload(BaseModel):
    petId: str
    ownerId: str
    lastSeenLocation: Dict[str, Any] = Field(..., example={"latitude": 19.4326, "longitude": -99.1332, "address": "Zócalo, CDMX"})
    notificationRadius: int = 24
    notes: str = ""

@router.post("/create")
async def create_lost_report(payload: CreateReportPayload = Body(...)):
    # ... (Sin cambios aquí)
    try:
        pet_ref = db.collection('pets').document(payload.petId)
        pet_doc = pet_ref.get()
        if not pet_doc.exists:
            raise HTTPException(status_code=404, detail="La mascota a reportar no existe.")
        report_data = {
            'petId': payload.petId, 'ownerId': payload.ownerId,
            'lastSeenLocation': payload.lastSeenLocation, 'notificationRadius': payload.notificationRadius,
            'notes': payload.notes, 'reportedAt': firestore.SERVER_TIMESTAMP,
            'status': 'active', 'helpersCount': 0, 'viewsCount': 0,
            'searchRoute': [], 'foundAt': None, 'shareableImageUrl': None, 'shareablePdfUrl': None,
        }
        report_doc_ref = db.collection('lostReports').document()
        report_doc_ref.set(report_data)
        pet_ref.update({'status': 'lost', 'reportId': report_doc_ref.id})
        return {"success": True, "reportId": report_doc_ref.id, "message": "Reporte creado exitosamente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ocurrió un error en el servidor: {e}")

@router.get("/{report_id}")
async def get_report_by_id(report_id: str):
    
    try:
        report_ref = db.collection('lostReports').document(report_id)
        report_doc = report_ref.get()
        if not report_doc.exists:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        report_data = report_doc.to_dict()
        pet_ref = db.collection('pets').document(report_data['petId'])
        pet_doc = pet_ref.get()
        if not pet_doc.exists:
            raise HTTPException(status_code=404, detail="La mascota asociada a este reporte ya no existe.")
        pet_data = pet_doc.to_dict()
        full_report_details = { **report_data, 'reportId': report_doc.id, 'petInfo': pet_data }
        return {"report": full_report_details}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    

@router.post("/{report_id}/sighting")
async def add_sighting_to_report(
    report_id: str,
    reportedBy: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    notes: str = Form(...),
    photos: List[UploadFile] = File([])
):
    try:
        report_ref = db.collection('lostReports').document(report_id)
        report_doc = report_ref.get()

        if not report_doc.exists:
            raise HTTPException(status_code=404, detail="El reporte al que intentas añadir un avistamiento no existe.")

        photo_urls = []
        for photo in photos:
            file_extension = photo.filename.split('.')[-1]
            file_name = f"sightings/{report_id}/{uuid.uuid4()}.{file_extension}"
            blob = bucket.blob(file_name)
            blob.upload_from_file(photo.file, content_type=photo.content_type)
            blob.make_public()
            photo_urls.append(blob.public_url)
        
    
        # Generar la fecha.
        sighting_data = {
            'reportedBy': reportedBy,
            'location': {
                'latitude': latitude,
                'longitude': longitude,
                'address': address
            },
            'notes': notes,
            'photos': photo_urls,
            'timestamp': datetime.datetime.now(datetime.timezone.utc) 
        }

        report_ref.update({
            'searchRoute': firestore.ArrayUnion([sighting_data])
        })

        return {"success": True, "message": "Avistamiento añadido exitosamente."}

    except Exception as e:
        print("--- ERROR DETALLADO AL PROCESAR AVISTAMIENTO ---")
        import traceback
        traceback.print_exc()
        print("---------------------------------")
        raise HTTPException(status_code=500, detail=f"Ocurrió un error en el servidor: {e}")