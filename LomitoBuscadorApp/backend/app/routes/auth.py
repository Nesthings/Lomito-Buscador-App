from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth as firebase_auth
from app.services.firebase_service import db  
from firebase_admin import firestore

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/google-signin")
async def google_signin(token: str):
    try:
        #Verify Google token
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token['uid']
        email = decoded_token.get('email', 'No email provided')
        name = decoded_token.get('name', 'No name provided')

        #create or update user in Firestore

        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            user_data = {
                'user_id': uid,
                'email': email,
                'displayName': name,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'preferences': {
                    'notificationRadius': 24,
                    'enablePushNotifications': True
                }
            }
            user_ref.set(user_data)
        return {"message": "User signed in successfully", "user_id": uid}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/update-fcm-token")
async def update_fcm_token(user_id: str, fcm_token: str):
    user_ref = db.collection('users').document(user_id)
    user_ref.update({'fcmToken': fcm_token})
    return {"sucess": True}    
