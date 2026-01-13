// RUTA: frontend/src/components/BottomSheet.js

import React, { useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PetBottomSheet = forwardRef(({ report, onReportSighting, onViewFullReport }, ref) => {
  const snapPoints = useMemo(() => ['25%', '50%'], []);

  if (!report) {
    return null; // No renderiza nada si no hay reporte
  }

  // Acceso seguro a los datos
  const photoUrl = report.petInfo?.basicInfo?.photos?.[0] || 'https://via.placeholder.com/100';
  const petName = report.petInfo?.basicInfo?.name || 'Mascota';
  const breed = report.petInfo?.specificInfo?.breed || 'Raza desconocida';
  const lastSeenAddress = report.lastSeenLocation?.address || 'Ubicación desconocida';
  const timeAgo = report.reportedAt?._seconds
    ? formatDistanceToNow(new Date(report.reportedAt._seconds * 1000), { locale: es, addSuffix: true })
    : 'hace un tiempo';

  return (
    <BottomSheet
      ref={ref}
      index={-1} // Empieza cerrado
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheet}
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Image source={{ uri: photoUrl }} style={styles.petImage} />
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{petName}</Text>
            <Text style={styles.petBreed}>{breed}</Text>
            <Text style={styles.timeAgo}>Perdido {timeAgo}</Text>
          </View>
        </View>

        <View style={styles.locationInfo}>
          <Icon name="map-marker-outline" size={20} color="#FF6B6B" />
          <Text style={styles.locationText}>Última vez visto en: <Text style={{fontWeight: 'bold'}}>{lastSeenAddress}</Text></Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={() => onViewFullReport(report)}
          >
            <Icon name="information-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Ver Reporte Completo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => onReportSighting(report)}
          >
            <Icon name="eye-plus-outline" size={20} color="#4ECDC4" />
            <Text style={[styles.buttonText, { color: '#4ECDC4' }]}>Reportar Avistamiento</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    marginRight: 15,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
  },
  timeAgo: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  actionsContainer: {
    marginTop: 'auto', // Empuja los botones hacia abajo
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default PetBottomSheet;