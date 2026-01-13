import 'react-native-gesture-handler';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Este Stack solo conoce dos "mundos": el de las pestañas
          y el de las pantallas que se abren encima. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="PetProfileScreen" />
      <Stack.Screen name="ReportLostPetScreen" />
      <Stack.Screen name="PetRegistrationScreen" />
      <Stack.Screen name="EditPetProfileScreen" />
      <Stack.Screen name="ShareableMaterialScreen" />
      {/* Añade aquí cualquier otra pantalla que NO tenga el footer */}
    </Stack>
  );
}