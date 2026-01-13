import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert, // <-- 1. Importar Alert
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '@services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location'; // <-- 2. Importar Expo Location

const ReportsScreen = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  // --- 3. MODIFICAMOS LA FUNCIÓN fetchReports ---
  const fetchReports = async () => {
    try {
      // Primero, obtenemos la ubicación actual del usuario
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para encontrar mascotas perdidas cerca de ti.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Ahora, llamamos a la API con las coordenadas del usuario
      const response = await api.get('/sightings/active-reports', {
        params: {
          user_lat: latitude,
          user_lon: longitude
        }
      });
      
      setReports(response.data.reports);

    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

const renderReportCard = ({ item }) => {
    const photoUrl = item.petInfo?.basicInfo?.photos?.[0] || 'https://via.placeholder.com/300';

    // --- CORRECCIÓN 1: Comprobación de la fecha ---
    // Verificamos si la fecha existe antes de intentar formatearla.
    const timeAgo = item.reportedAt?._seconds 
      ? formatDistanceToNow(new Date(item.reportedAt._seconds * 1000), {
          locale: es,
          addSuffix: true
        })
      : 'Hace un tiempo'; // Valor alternativo si la fecha no existe

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/PetDetailScreen', params: { reportId: item.reportId } })}
      >
        <ImageBackground
          source={{ uri: photoUrl }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <View style={styles.overlayContainer}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {timeAgo}
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.locationRow}>
                <Icon name="eye" size={16} color="white" style={styles.locationIcon} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {/* --- CORRECCIÓN 2: Acceso seguro a la dirección --- */}
                  Última vez: {item.lastSeenLocation?.address ?? 'Ubicación desconocida'}
                </Text>
              </View>
              <View style={styles.nameRow}>
                <Text style={styles.petName}>
                  {/* --- CORRECCIÓN 3: Acceso seguro al nombre --- */}
                  {item.petInfo?.basicInfo?.name ?? 'Sin nombre'}
                </Text>
                <Text style={styles.distanceText}>
                  {item.distanceInKm != null ? `${item.distanceInKm} km` : ''}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Mascotas Perdidas</Text>
        <Text style={styles.subtitle}>Ayuda a estas mascotas a volver a casa</Text>
      </View>
      
      {loading ? (
        <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      ) : (
        <FlatList
            data={reports}
            renderItem={renderReportCard}
            keyExtractor={(item) => item.reportId}
            refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4ECDC4"]} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay reportes activos cerca de ti.</Text>
            </View>
            }
        />
      )}
    </SafeAreaView>
  );
};

// ... (Tus estilos se mantienen exactamente iguales)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer: { 
    backgroundColor: 'white', 
    paddingHorizontal: 20,
    paddingTop: 20, 
    paddingBottom: 15,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  listContainer: { paddingHorizontal: 20, paddingTop: 10 },
  card: {
    height: 250,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 9,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
  },
  timeContainer: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 11,
    borderRadius: 19,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 6,
  },
  locationText: {
    color: '#EFEFEF',
    fontSize: 13,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  petName: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  distanceText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default ReportsScreen;