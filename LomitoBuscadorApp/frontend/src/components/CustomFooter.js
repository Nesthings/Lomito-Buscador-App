import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSegments, useRouter } from 'expo-router'; 

const CustomFooter = () => {
  const router = useRouter();
  const segments = useSegments();
  
  const activeTab = segments[segments.length - 1] || 'index';

  //LÓGICA DE NAVEGACIÓN DE LOS BOTONES
  const handlePress = (routeName, tabIdentifier) => {
  
    if (activeTab !== tabIdentifier) {
      router.push(routeName);
    }
  };
  
  return (
    <View style={styles.footer}>
      {/* Botón Mis Mascotas */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => handlePress('/MyPetsScreen', 'MyPetsScreen')}
      >
        <View style={[styles.iconPlaceholder, activeTab === 'MyPetsScreen' && styles.iconActive]}>
          <Image
            source={require('../assets/icon-pets.png')}
            style={styles.footerIcon}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* Botón Reportes */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => handlePress('/ReportsScreen', 'ReportsScreen')}
      >
        <View style={[styles.iconPlaceholder, activeTab === 'ReportsScreen' && styles.iconActive]}>
          <Image
            source={require('../assets/icon-reports.png')}
            style={styles.footerIcon}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* Botón Home (Mapa) */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => handlePress('/', 'index')} 
      >
        <View style={[styles.iconPlaceholder, styles.iconPlaceholderCenter, activeTab === 'index' && styles.iconActive]}>
          <Image
            source={require('../assets/icon-home.png')}
            style={styles.footerIconCenter}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
      
      {/* Botón Avistamientos */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => handlePress('/SightingsScreen', 'SightingsScreen')}
      >
        <View style={[styles.iconPlaceholder, activeTab === 'SightingsScreen' && styles.iconActive]}>
          <Image
            source={require('../assets/icon-sightings.png')}
            style={styles.footerIcon}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
      
      {/* Botón Notificaciones */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => handlePress('/notifications', 'notifications')} // Apunta a la carpeta notifications
      >
        <View style={[styles.iconPlaceholder, activeTab === 'notifications' && styles.iconActive]}>
          <Image
            source={require('../assets/icon-notifications.png')}
            style={styles.footerIcon}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingVertical: 14, paddingHorizontal: 16, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, },
  footerButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, },
  iconPlaceholder: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DEE2E6', },
  iconPlaceholderCenter: { width: 70, height: 80, borderRadius: 20,  marginRight: 10, marginLeft: 10 },
  iconActive: { backgroundColor: '#E9F2FC', borderColor: '#4A90E2', },
  footerIcon: { width: 40, height: 40, },
  footerIconCenter: { width: 50, height: 50, },
});

export default CustomFooter;