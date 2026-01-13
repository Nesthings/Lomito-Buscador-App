import React from 'react';
import { Tabs } from 'expo-router';
import CustomFooter from '../../src/components/CustomFooter';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomFooter {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="MyPetsScreen" />
      <Tabs.Screen name="ReportsScreen" />
      <Tabs.Screen name="SightingsScreen" />
      <Tabs.Screen name="PetDetailScreen" />
      
      
      {/* --- ¡ESTA ES LA LÍNEA QUE FALTABA! --- */}
      {/* Esto le dice al navegador que la carpeta 'notifications' es una pestaña válida. */}
      <Tabs.Screen name="notifications" />
    </Tabs>
  );
}