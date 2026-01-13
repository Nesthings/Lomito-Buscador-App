import React, { useState, useCallback } from 'react'; // <-- CAMBIO 1: Importamos useCallback
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator, // <-- Añadido para un mejor estado de carga
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; // <-- CAMBIO 2: Importamos useFocusEffect
import api from '@services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SightingsScreen = () => {
  const router = useRouter();
  const [sightings, setSightings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true); // Estado para la carga inicial

  // --- ¡CAMBIO 3! ---
  // Reemplazamos useEffect con useFocusEffect para que la lista se actualice siempre
  useFocusEffect(
    useCallback(() => {
      fetchSightings();
    }, [])
  );

  const fetchSightings = async () => {
    try {
      const response = await api.get('/sightings/public-sightings');
      setSightings(response.data.sightings);
    } catch (error) {
      console.error('Error fetching sightings:', error);
      Alert.alert("Error", "No se pudieron cargar los avistamientos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSightings();
  };

  const renderSightingCard = ({ item }) => {
    // --- ¡CAMBIO 4! ---
    // Corregimos la lógica de la fecha para que funcione con el string del backend
    const timeAgo = item.timestamp
      ? formatDistanceToNow(new Date(item.timestamp), { locale: es, addSuffix: true })
      : 'hace un tiempo';

    return (
      <TouchableOpacity onPress={() => router.push({ pathname: '/PublicSightingDetailScreen', params: { sightingId: item.sightingId } })}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image source={{ uri: item.reportedBy?.photo || 'https://via.placeholder.com/40' }} style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.reportedBy?.name ?? 'Usuario anónimo'}</Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>

          {item.photos && item.photos.length > 0 && <Image source={{ uri: item.photos[0] }} style={styles.sightingImage} />}

          <View style={styles.cardContent}>
            <View style={styles.petDescriptionBadge}>
              <Text style={styles.petDescriptionText}>
                {item.petDescription?.species?.toUpperCase() ?? 'ANIMAL'} • {item.petDescription?.approximateSize ?? 'TAMAÑO DESCONOCIDO'}
              </Text>
            </View>
            <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
            <Text style={styles.location}>📍 {item.location?.address ?? 'Ubicación no especificada'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Avistamientos Públicos</Text>
        <Text style={styles.subtitle}>Mascotas vistas en la comunidad sin un reporte formal.</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.push('/CreatePublicSightingScreen')}
        >
          <Icon name="plus-circle-outline" size={20} color="white" />
          <Text style={styles.reportButtonText}>Reportar un Avistamiento</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      ) : (
        <FlatList
            data={sightings}
            renderItem={renderSightingCard}
            keyExtractor={(item) => item.sightingId}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4ECDC4"]} />}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Icon name="eye-off-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyTitle}>Sin Avistamientos</Text>
                    <Text style={styles.emptyText}>Aún no hay avistamientos públicos reportados. ¡Sé el primero en ayudar!</Text>
                </View>
            }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 20 },
  reportButton: { flexDirection: 'row', backgroundColor: '#4ECDC4', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  listContainer: { padding: 15, flexGrow: 1 },
  card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5, },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  userAvatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12, backgroundColor: '#eee' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timeAgo: { fontSize: 13, color: '#999', marginTop: 2 },
  sightingImage: { width: '100%', height: 300 },
  cardContent: { padding: 15 },
  petDescriptionBadge: { backgroundColor: 'rgba(255, 107, 107, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginBottom: 12, },
  petDescriptionText: { fontSize: 12, fontWeight: 'bold', color: '#FF6B6B' },
  description: { fontSize: 16, color: '#333', marginBottom: 12, lineHeight: 22 },
  location: { fontSize: 14, color: '#4ECDC4', fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
});

export default SightingsScreen;