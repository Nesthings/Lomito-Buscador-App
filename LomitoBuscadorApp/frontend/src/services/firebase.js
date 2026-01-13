import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Settings Google SIgnIn
GoogleSignin.configure({
  webClientId: 'your-web-client-id.apps.googleusercontent.com', // Reemplaza con tu webClientId
});

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    
    // Send token to BACKEND
    await axios.post('your-backend-endpoint', {
      token: idToken
    });
    
    return userCredential.user;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const signOut = async () => {
  await auth().signOut();
  await GoogleSignin.signOut();
};