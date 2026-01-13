import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '@services/api';

const PetProfileScreen = () => {
  const router = useRouter();
  const { petId } = useLocalSearchParams();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPetDetails = async () => {
      if (!petId) {
        Alert.alert("Error", "No se recibió el ID de la mascota.");
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get(`/pets/${petId}`);
        setPet(response.data.pet);
      } catch (error) {
        console.error('Error fetching pet details:', error);
        Alert.alert('Error', 'No se pudo cargar la información de la mascota.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPetDetails();
  }, [petId]);

  const handleReportLost = () => {
    if (!pet) return;
    Alert.alert(
      '¿Reportar extravío?',
      'Se te dirigirá a la pantalla de reporte para confirmar la última ubicación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => router.push({ pathname: '/ReportLostPetScreen', params: { petId: pet.petId } }) },
      ]
    );
  };

  const handleDelete = async () => {
    if (!petId || !pet) return;

    Alert.alert(
      '¿Eliminar Mascota?',
      `¿Estás seguro de que quieres eliminar a ${pet.basicInfo.name}? Esta acción es permanente.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/pets/${petId}`);
              Alert.alert('Éxito', `${pet.basicInfo.name} ha sido eliminado.`);
              router.back();
            } catch (error) {
              console.error('Error deleting pet:', error);
              Alert.alert('Error', 'No se pudo eliminar la mascota. Por favor, inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.centered}><Text>Cargando perfil...</Text></View>;
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No se encontró la información de la mascota.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
          <Text style={{color: '#4ECDC4'}}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const basicInfo = pet.basicInfo || {};
  const specificInfo = pet.specificInfo || {};
  const photoUrl = basicInfo.photos && basicInfo.photos.length > 0 ? basicInfo.photos[0] : 'https://via.placeholder.com/150';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil de la Mascota</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUrl }} style={styles.petImage} />
          </View>
          <Text style={styles.petName}>{basicInfo.name || 'Sin nombre'}</Text>
          <Text style={styles.petBreed}>{specificInfo.breed || 'Sin raza'}</Text>

          <View style={[styles.badge, styles.safeBadge]}>
            <Icon name="check-circle" size={16} color="white" />
            <Text style={styles.badgeText}>A salvo en casa</Text>
          </View>

          <View style={styles.detailsSection}>
            <DetailRow icon="paw" label="Tamaño" value={specificInfo.size || 'N/A'} />
            <DetailRow icon="cake-variant" label="Edad" value={`${specificInfo.age ?? 'N/A'} años`} />
            <DetailRow icon="gender-male-female" label="Sexo" value={specificInfo.sex || 'N/A'} />
            <DetailRow icon="palette" label="Colores" value={Array.isArray(specificInfo.colors) ? specificInfo.colors.join(', ') : 'N/A'} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="trash-can-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
        <View style={styles.actionButtonsWrapper}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/EditPetProfileScreen', params: { petId: pet.petId } })}
          >
            <Icon name="pencil" size={22} color="#333" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.panicButton} onPress={handleReportLost}>
            <Icon name="alert-circle" size={22} color="white" />
            <Text style={styles.panicButtonText}>Reportar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <Icon name={icon} size={20} color="#888" style={styles.detailIcon} />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backButton: { padding: 5 },
  profileContainer: { alignItems: 'center', padding: 20 },
  imageContainer: {
    width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#4ECDC4',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 5, backgroundColor: '#FFF'
  },
  petImage: { width: '100%', height: '100%', borderRadius: 75 },
  petName: { fontSize: 32, fontWeight: 'bold', marginTop: 15 },
  petBreed: { fontSize: 18, color: '#666', marginBottom: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  safeBadge: { backgroundColor: '#4CAF50' },
  badgeText: { color: 'white', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  detailsSection: { width: '100%', marginTop: 30, backgroundColor: '#f9f9f9', borderRadius: 15, padding: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  detailIcon: { marginRight: 15 },
  detailLabel: { fontSize: 16, color: '#333', flex: 1 },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  actionsContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginRight: 10,
  },
  actionButtonsWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
  },
  editButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#333' },
  panicButton: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 12,
  },
  panicButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: 'white' },
});

export default PetProfileScreen;