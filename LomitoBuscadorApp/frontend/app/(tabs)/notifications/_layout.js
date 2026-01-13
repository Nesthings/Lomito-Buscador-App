import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// 1. Creamos el navegador de pestañas superiores.
const TopTabs = withLayoutContext(createMaterialTopTabNavigator().Navigator);

export default function NotificationsLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
      </View>
      
      {/* 2. Usamos el navegador que creamos. */}
      <TopTabs
        screenOptions={{
          tabBarActiveTintColor: '#4ECDC4',
          tabBarInactiveTintColor: '#999',
          tabBarIndicatorStyle: { backgroundColor: '#4ECDC4' },
          tabBarStyle: { backgroundColor: 'white' },
          tabBarLabelStyle: { fontWeight: 'bold' },
        }}
      >
        {/* 3. Las pantallas ahora usan <TopTabs.Screen> */}
        <TopTabs.Screen name="index" options={{ title: 'Generales' }} />
        <TopTabs.Screen name="mensajes" options={{ title: 'Mensajes' }} />
      </TopTabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
});