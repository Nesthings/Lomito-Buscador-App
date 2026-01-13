import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import api from '.frontend/src/services/api';

/**
 * Solicitar permiso de notificaciones al usuario
 */
export const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Obtener token FCM del dispositivo
 */
export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Enviar o actualizar token FCM del usuario al backend
 */
export const updateFCMToken = async (userId) => {
  const token = await getFCMToken();
  if (token) {
    try {
      await api.post('/auth/update-fcm-token', {
        user_id: userId,
        fcm_token: token,
      });
    } catch (error) {
      console.error('Error updating FCM token in backend:', error);
    }
  }
};


export const setupNotificationListeners = (navigation) => {
  // Notificación recibida cuando la app está en primer plano
  messaging().onMessage(async (remoteMessage) => {
    console.log('Notificación recibida en primer plano:', remoteMessage);

    Alert.alert(
      remoteMessage.notification?.title || 'Notificación',
      remoteMessage.notification?.body || '',
      [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Ver',
          onPress: () => handleNotificationAction(remoteMessage.data, navigation),
        },
      ]
    );
  });

  // Cuando el usuario toca una notificación con la app en segundo plano
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notificación abrió la app desde segundo plano:', remoteMessage);
    handleNotificationAction(remoteMessage.data, navigation);
  });

  // Cuando la app se abre desde una notificación (estado cerrada)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App abierta desde notificación:', remoteMessage);
        handleNotificationAction(remoteMessage.data, navigation);
      }
    });

  // Escuchar actualizaciones del token FCM
  messaging().onTokenRefresh((token) => {
    console.log('Token actualizado:', token);
    // Aquí podrías llamar a updateFCMToken(userId)
  });
};

/**
 * Redirigir según el tipo de notificación
 */
const handleNotificationAction = (data, navigation) => {
  const { type, reportId } = data;

  switch (type) {
    case 'lost_pet_alert':
    case 'sighting_update':
    case 'pet_found':
      navigation.navigate('PetDetail', { reportId });
      break;
    case 'direct_message':
      navigation.navigate('Messages', { reportId });
      break;
    default:
      navigation.navigate('Home');
  }
};
