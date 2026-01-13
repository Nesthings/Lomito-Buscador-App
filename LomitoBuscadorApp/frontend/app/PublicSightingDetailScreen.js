// RUTA: frontend/app/PublicSightingDetailScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PublicSightingDetailScreen = () => {
  const router = useRouter();
  const { sightingId } = useLocalSearchParams();

  const [sighting, setSighting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sightingId) {
      Alert.alert("Error", "No se recibió un ID de avistamiento.");
      router.back();
      return;
    }
    fetchSightingDetails();
  }, [sightingId]);

  const fetchSightingDetails = async () => {
    try {
      const response = await api.get(`/sightings/public-sightings/${sightingId}`);
      setSighting(response.data.sighting);
    } catch (error) {
      console.error('Error fetching sighting details:', error);
      Alert.alert("Error", "No se pudieron cargar los detalles del avistamiento.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !sighting) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </SafeAreaView>
    );
  }

  const time = new Date(sighting.timestamp);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Avistamiento</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView>
        {sighting.photos && sighting.photos.length > 0 && (
          <Image source={{ uri: sighting.photos[0] }} style={styles.mainImage} />
        )}
        
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {sighting.petDescription.species.toUpperCase()} • {sighting.petDescription.approximateSize}
            </Text>
          </View>
          
          <Text style={styles.description}>{sighting.description}</Text>
          
          <View style={styles.detailRow}>
            <Icon name="map-marker-outline" size={20} color="#FF6B6B" />
            <Text style={styles.detailText}>{sighting.location.address}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="clock-outline" size={20} color="#4ECDC4" />
            <Text style={styles.detailText}>
              Visto el {format(time, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}h
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Colores</Text>
          <View style={styles.colorsContainer}>
            {sighting.petDescription.colors.map((color, index) => (
              <View key={index} style={styles.colorBadge}><Text style={styles.colorText}>{color}</Text></View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Reportado por</Text>
          <View style={styles.reporterInfo}>
            <Image source={{ uri: sighting.reportedBy.photo || 'https://via.placeholder.com/50' }} style={styles.reporterAvatar} />
            <Text style={styles.reporterName}>{sighting.reportedBy.name}</Text>
          </View>
          

        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.contactButton}>
          <Icon name="message-text-outline" size={20} color="white" />
          <Text style={styles.contactButtonText}>Contactar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backButton: { padding: 5 },
  mainImage: { width: '100%', height: 300 },
  content: { padding: 20 },
  badge: { backgroundColor: 'rgba(255, 107, 107, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginBottom: 15 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#FF6B6B' },
  description: { fontSize: 18, color: '#333', lineHeight: 26, marginBottom: 25 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailText: { fontSize: 16, color: '#555', marginLeft: 10, flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  colorsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  colorBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  colorText: { fontSize: 14, color: '#666' },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 10 },
  reporterAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  reporterName: { fontSize: 16, fontWeight: '500' },
  footer: { padding: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  contactButton: { flexDirection: 'row', backgroundColor: '#4ECDC4', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});

export default PublicSightingDetailScreen;