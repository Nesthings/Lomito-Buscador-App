import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '@services/api';

const { width } = Dimensions.get('window');

// --- ¡CAMBIO 1 de 3! ---
// Añadimos 'onViewReport' a las propiedades que recibe el componente.
const PetCard = React.memo(({ item, onNavigateToDetails, onReportLost, onEdit, onViewReport }) => {
  const basicInfo = item.basicInfo || {};
  const specificInfo = item.specificInfo || {};
  const currentPhotoUrl =
    basicInfo.photos && basicInfo.photos.length > 0
      ? basicInfo.photos[0]
      : 'https://via.placeholder.com/250';

  return (
    <View style={styles.petCard}>
      <TouchableOpacity onPress={() => onNavigateToDetails(item.petId)}>
        <View style={styles.petImageContainer}>
          <Image source={{ uri: currentPhotoUrl }} style={styles.petImage} />
        </View>
      </TouchableOpacity>
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{basicInfo.name || 'Sin nombre'}</Text>
        <Text style={styles.petBreed}>
          {(specificInfo.breed || 'Sin raza')} • {(specificInfo.size || 'N/A')}
        </Text>
        <Text style={styles.petAge}>
          {specificInfo.age ?? 'N/A'} {specificInfo.age === 1 ? 'año' : 'años'} • {specificInfo.sex || 'N/A'}
        </Text>
        <View style={styles.statusBadge}>
          {item.status === 'safe' ? (
            <View style={[styles.badge, styles.safeBadge]}>
              <Icon name="check-circle" size={16} color="white" />
              <Text style={styles.badgeText}>A salvo en casa</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.lostBadge]}>
              <Icon name="alert-circle" size={16} color="white" />
              <Text style={styles.badgeText}>Extraviado</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        {item.status === 'safe' ? (
          <TouchableOpacity style={styles.panicButton} onPress={() => onReportLost(item.petId)}>
            <Icon name="alert" size={24} color="white" />
            <Text style={styles.panicButtonText}>Reportar Extravío</Text>
          </TouchableOpacity>
        ) : (
          // --- ¡CAMBIO 2 de 3! ---
          // En lugar de 'router.push', llamamos a la nueva propiedad 'onViewReport'.
          <TouchableOpacity style={styles.viewReportButton} onPress={() => onViewReport(item.reportId)}>
            <Text style={styles.viewReportButtonText}>Ver Reporte Activo</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item.petId)}>
          <Icon name="pencil" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const Pagination = React.memo(({ data, selectedIndex }) => {
  return (
    <View style={styles.paginationContainer}>
      {data.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            selectedIndex === index ? styles.paginationDotActive : {},
          ]}
        />
      ))}
    </View>
  );
});


const MyPetsScreen = () => {
  const router = useRouter();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      fetchMyPets();
    }, [])
  );

  const fetchMyPets = async () => {
    setLoading(true);
    try {
      const ownerId = 'CURRENT_USER_ID';
      const response = await api.get(`/pets/my-pets/${ownerId}`);
      const fetchedPets = response.data?.pets || [];
      setPets(fetchedPets);
      setSelectedPetIndex(0);
    } catch (error) {
      console.error('Error fetching pets:', error);
      Alert.alert("Error de Red", "No se pudo comunicar con el servidor.");
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportLost = useCallback((petId) => {
    Alert.alert('¿Reportar extravío?', 'Esto creará un reporte...', [{ text: 'Cancelar' }, { text: 'Confirmar', onPress: () => router.push({ pathname: '/ReportLostPetScreen', params: { petId } }) }]);
  }, [router]);
  const navigateToRegistration = useCallback(() => router.push('/PetRegistrationScreen'), [router]);
  const navigateToDetails = useCallback((petId) => router.push({ pathname: '/PetProfileScreen', params: { petId } }), [router]);
  const navigateToEdit = useCallback((petId) => router.push({ pathname: '/EditPetProfileScreen', params: { petId } }), [router]);

  // --- ¡CAMBIO 3 de 3! ---
  // 1. Creamos una nueva función para navegar al reporte.
  const navigateToReport = useCallback((reportId) => {
    router.push({ pathname: '/PetDetailScreen', params: { reportId } });
  }, [router]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setSelectedPetIndex(viewableItems[0].index);
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // 2. Pasamos la nueva función 'navigateToReport' como la propiedad 'onViewReport' a PetCard.
  const renderPetCard = useCallback(({ item }) => (
    <PetCard 
      item={item} 
      onNavigateToDetails={navigateToDetails} 
      onReportLost={handleReportLost} 
      onEdit={navigateToEdit}
      onViewReport={navigateToReport} 
    />
  ), [navigateToDetails, handleReportLost, navigateToEdit, navigateToReport]);

  const NoPetsView = () => (
    <View style={styles.emptyContainer}>
      <Icon name="paw-off" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No tienes mascotas registradas</Text>
      <Text style={styles.emptySubtitle}>Usa el botón '+' para registrar tu primera mascota.</Text>
      <TouchableOpacity style={styles.registerButton} onPress={navigateToRegistration}>
        <Text style={styles.registerButtonText}>Registrar Mi Primera Mascota</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Mascotas</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToRegistration}>
          <Icon name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><Text>Cargando...</Text></View>
      ) : pets.length === 0 ? (
        <NoPetsView />
      ) : (
        <View style={styles.petsViewContainer}>
          <FlatList
            data={pets}
            keyExtractor={(item) => item.petId}
            renderItem={renderPetCard}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            removeClippedSubviews={false}
          />
          <Pagination data={pets} selectedIndex={selectedPetIndex} />
        </View>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  addButton: {
    backgroundColor: '#4ECDC4',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
  },
  petsViewContainer: {
    flex: 1,
  },
  petCard: {
    width: width,
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 60,
  },
  petImageContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 6,
    borderColor: '#4ECDC4',
    backgroundColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: 125,
  },
  petInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  petName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  petBreed: { fontSize: 18, color: '#666', marginBottom: 3 },
  petAge: { fontSize: 16, color: '#999' },
  statusBadge: { marginTop: 15 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  safeBadge: { backgroundColor: '#4CAF50' },
  lostBadge: { backgroundColor: '#FF6B6B' },
  badgeText: { color: 'white', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  panicButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    marginRight: 10,
    elevation: 4
  },
  panicButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  viewReportButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    marginRight: 10,
    elevation: 4
  },
  viewReportButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  editButton: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  registerButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10
  },
  registerButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#4ECDC4',
  },
});

export default MyPetsScreen;