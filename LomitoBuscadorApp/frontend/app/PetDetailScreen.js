import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Linking, Alert, Share, SafeAreaView, ActivityIndicator,
  Modal 
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '@services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';


const SightingItem = ({ sighting, isLast, onImagePress }) => {
  const sightingTime = sighting.timestamp ? new Date(sighting.timestamp) : null;

  return (
    <View style={styles.sightingItem}>
      <View style={styles.timeline}>
        <View style={styles.timelineIcon}>
          <Icon name="map-marker-radius" size={20} color="white" />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.sightingDetails}>
        <Text style={styles.sightingAddress}>{sighting.location?.address || 'Ubicación no especificada'}</Text>
        {sightingTime ? (
          <Text style={styles.sightingTime}>
            {format(sightingTime, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}h
          </Text>
        ) : (
          <Text style={styles.sightingTime}>Fecha no disponible</Text>
        )}
        {sighting.notes && <Text style={styles.sightingNotes}>"{sighting.notes}"</Text>}
        
        {sighting.photos && sighting.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {sighting.photos.map((photoUrl, index) => (
              <TouchableOpacity key={index} onPress={() => onImagePress(photoUrl)}>
                <Image source={{ uri: photoUrl }} style={styles.sightingPhoto} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const PetDetailScreen = () => {
  const router = useRouter();
  const { reportId } = useLocalSearchParams();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ¡CAMBIO 3 de 4! ---
  // Nuevos estados para controlar el modal de la imagen
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (reportId) {
        fetchReportDetails();
      } else {
        Alert.alert("Error", "No se proporcionó ID de reporte.");
        setLoading(false);
      }
    }, [reportId])
  );

  const fetchReportDetails = async () => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      setReport(response.data.report);
    } catch (error) {
      console.error('Error fetching report details:', error);
      Alert.alert("Error", "No se pudieron cargar los detalles del reporte.");
    } finally {
      if (loading) setLoading(false);
    }
  };

  // Funciones para manejar el modal
  const handleImagePress = (uri) => {
    setSelectedImageUri(uri);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedImageUri(null);
  };

  const handleReportSighting = () => router.push({ pathname: '/SightingReportScreen', params: { reportId } });
  const handleCallOwner = () => Linking.openURL(`tel:${report.petInfo.ownerInfo.ownerPhone}`);

  const handleShareReport = async () => {
    try {
      await Share.share({
        message: `¡Ayuda a encontrar a ${report.petInfo.basicInfo.name}! Última vez visto en: ${report.lastSeenLocation.address}. Más info en la app Lomito Buscador.`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>No se encontró el reporte.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#4ECDC4', fontSize: 16 }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const petInfo = report.petInfo;
  const photoUrl = petInfo.basicInfo?.photos?.[0] || 'https://via.placeholder.com/400';
  
  const routeCoordinates = [
    report.lastSeenLocation,
    ...report.searchRoute.map(s => s.location)
  ].filter(c => c && typeof c.latitude === 'number' && typeof c.longitude === 'number');
  
  const timeSinceReported = report.reportedAt
    ? formatDistanceToNow(new Date(report.reportedAt), { locale: es, addSuffix: true })
    : 'hace un tiempo';

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      
      {/* --- ¡CAMBIO 4 de 4! --- El componente Modal para ver la imagen */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <Image source={{ uri: selectedImageUri }} style={styles.modalImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Icon name="close-circle" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: photoUrl }} style={styles.headerImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.petName}>{petInfo.basicInfo?.name ?? 'Sin Nombre'}</Text>
          <Text style={styles.petBreed}>
            {petInfo.specificInfo?.breed ?? 'Raza desconocida'} • {petInfo.specificInfo?.size ?? 'Tamaño desconocido'}
          </Text>
          <Text style={styles.reportedTime}>
            Perdido {timeSinceReported}
          </Text>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleReportSighting}>
            <Icon name="eye-plus" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Reportar Avistamiento</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Ruta de Búsqueda</Text>
          <MapView style={styles.map} initialRegion={{ ...report.lastSeenLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
            <Marker coordinate={report.lastSeenLocation} title="Reportado aquí" pinColor="#FF6B6B" />
            {report.searchRoute.map((sighting, index) => (
              sighting.location && <Marker key={index} coordinate={sighting.location} title={`Avistamiento #${index + 1}`} pinColor="#4ECDC4" />
            ))}
            {routeCoordinates.length > 1 && <Polyline coordinates={routeCoordinates} strokeColor="#4ECDC4" strokeWidth={3} />}
          </MapView>
        </View>
        
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de Ubicaciones</Text>
          {report.reportedAt && (
            <SightingItem 
              sighting={{
                location: report.lastSeenLocation,
                timestamp: report.reportedAt,
                notes: `Reportado como perdido por el dueño.`,
                photos: []
              }}
              isLast={report.searchRoute.length === 0}
              onImagePress={handleImagePress} 
            />
          )}
          {report.searchRoute.map((sighting, index) => (
            <SightingItem 
              key={index}
              sighting={sighting}
              isLast={index === report.searchRoute.length - 1}
              onImagePress={handleImagePress} 
            />
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contacto y Ayuda</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleCallOwner}>
            <Icon name="phone" size={24} color="white" />
            <Text style={styles.contactButtonText}>Llamar al Dueño</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareReport}>
            <Icon name="share-variant" size={24} color="#4ECDC4" />
            <Text style={styles.shareButtonText}>Compartir Reporte</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  imageContainer: { position: 'relative' },
  headerImage: { width: '100%', height: 350 },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  petName: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  petBreed: { fontSize: 18, color: '#666', marginBottom: 8 },
  reportedTime: { fontSize: 14, color: '#999' },
  actionsSection: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  primaryButton: { backgroundColor: '#FF6B6B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 12 },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  mapSection: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  map: { height: 250, borderRadius: 12 },
  historySection: { padding: 20, backgroundColor: 'white' },
  sightingItem: { flexDirection: 'row', marginBottom: 10 },
  timeline: { alignItems: 'center' },
  timelineIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#ddd', marginTop: -5 },
  sightingDetails: { flex: 1, marginLeft: 15, paddingBottom: 20 },
  sightingAddress: { fontSize: 16, fontWeight: 'bold' },
  sightingTime: { fontSize: 13, color: '#666', marginVertical: 4 },
  sightingNotes: { fontSize: 14, color: '#333', fontStyle: 'italic', backgroundColor: '#f0f0f0', padding: 8, borderRadius: 5, marginTop: 5 },
  photosContainer: { marginTop: 10 },
  sightingPhoto: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  contactSection: { padding: 20, marginTop: 10, backgroundColor: 'white' },
  contactButton: { backgroundColor: '#4ECDC4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 12, marginBottom: 10 },
  contactButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  shareButton: { backgroundColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12 },
  shareButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  bottomPadding: { height: 40, backgroundColor: 'white' },
  // Nuevos estilos para el modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
});

export default PetDetailScreen;