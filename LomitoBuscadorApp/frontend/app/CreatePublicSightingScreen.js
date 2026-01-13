import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, SafeAreaView, Platform,
  KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '@services/api';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const CreatePublicSightingScreen = () => {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [initialRegion, setInitialRegion] = useState(null);
  const [species, setSpecies] = useState('Perro'); 
  const [approximateSize, setApproximateSize] = useState('Mediano'); 
  const [colors, setColors] = useState(''); 

  useEffect(() => {
    const initializeScreen = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para centrar el mapa.');
        return;
      }
      let userLocation = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      await ImagePicker.requestMediaLibraryPermissionsAsync();
    };
    initializeScreen();
  }, []);

  const getAddressFromCoords = async (lat, lng) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!GOOGLE_MAPS_API_KEY) {
        console.warn("API Key de Google Maps no encontrada.");
        return "Configuración de API requerida.";
      }
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      const formattedAddress = data.results[0]?.formatted_address || 'Dirección no encontrada';
      setAddress(formattedAddress);
      return formattedAddress;
    } catch (error) {
      console.error("Geocoding Error:", error);
      return 'No se pudo obtener la dirección';
    }
  };

  const handleMapPress = async (event) => {
    const coords = event.nativeEvent.coordinate;
    setLocation(coords);
    await getAddressFromCoords(coords.latitude, coords.longitude);
  };

  const selectImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });
    if (!result.canceled) {
      setPhotos([...photos, ...result.assets]);
    }
  };

  const removeImage = (indexToRemove) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    // --- ¡VALIDACIÓN ACTUALIZADA! ---
    if (!description.trim() || !location || !species || !approximateSize || !colors.trim()) {
      Alert.alert('Campos requeridos', 'Por favor, completa todos los campos: ubicación, descripción, especie, tamaño y colores.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      
      formData.append('reported_by', 'CURRENT_USER_ID'); // Reemplaza esto con el ID real del usuario
      formData.append('description', description);
      formData.append('address', address);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);

      // --- ¡DATOS DE ESTADO AÑADIDOS! (YA NO SON FIJOS) ---
      formData.append('species', species); 
      formData.append('approximate_size', approximateSize);
      
      // Convertimos el string de colores en un array para el backend
      const colorsArray = colors.split(',').map(color => color.trim());
      colorsArray.forEach(color => {
        if (color) { // Nos aseguramos de no enviar strings vacíos
          formData.append('colors', color);
        }
      });

      photos.forEach(photo => {
        formData.append('photos', {
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          name: photo.fileName || `sighting_${Date.now()}.jpg`,
        });
      });

      await api.post('/sightings/public-sightings/create', formData);
      
      Alert.alert('¡Gracias!', 'Tu avistamiento ha sido reportado.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      Alert.alert('Error', 'No se pudo enviar el avistamiento.');
    } finally {
      setLoading(false);
    }
  };

  if (!initialRegion) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#4ECDC4" /><Text style={{marginTop: 10}}>Cargando mapa...</Text></SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar un Avistamiento</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Ubicación donde lo viste *</Text>
          <Text style={styles.subtitle}>Toca el mapa para colocar un pin.</Text>
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation
          >
            {location && <Marker coordinate={location} pinColor="#FF6B6B" />}
          </MapView>
          {address ? <Text style={styles.addressText}>📍 {address}</Text> : null}

          <Text style={styles.label}>Describe la mascota que viste *</Text>
          <TextInput
            style={[styles.input, { height: 120 }]}
            placeholder="Ej. Llevaba un collar rojo y parecía asustado."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* --- ¡NUEVOS CAMPOS AÑADIDOS! --- */}
          <Text style={styles.label}>Especie *</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
                style={[styles.toggleButton, species === 'Perro' && styles.toggleButtonActive]} 
                onPress={() => setSpecies('Perro')}
            >
                <Icon name="dog" size={20} color={species === 'Perro' ? 'white' : '#4ECDC4'} />
                <Text style={[styles.toggleButtonText, species === 'Perro' && styles.toggleButtonTextActive]}>Perro</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.toggleButton, species === 'Gato' && styles.toggleButtonActive]} 
                onPress={() => setSpecies('Gato')}
            >
                <Icon name="cat" size={20} color={species === 'Gato' ? 'white' : '#4ECDC4'} />
                <Text style={[styles.toggleButtonText, species === 'Gato' && styles.toggleButtonTextActive]}>Gato</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Tamaño Aproximado *</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
                style={[styles.toggleButton, approximateSize === 'Pequeño' && styles.toggleButtonActive]} 
                onPress={() => setApproximateSize('Pequeño')}
            >
                <Text style={[styles.toggleButtonText, approximateSize === 'Pequeño' && styles.toggleButtonTextActive]}>Pequeño</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.toggleButton, approximateSize === 'Mediano' && styles.toggleButtonActive]} 
                onPress={() => setApproximateSize('Mediano')}
            >
                <Text style={[styles.toggleButtonText, approximateSize === 'Mediano' && styles.toggleButtonTextActive]}>Mediano</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.toggleButton, approximateSize === 'Grande' && styles.toggleButtonActive]} 
                onPress={() => setApproximateSize('Grande')}
            >
                <Text style={[styles.toggleButtonText, approximateSize === 'Grande' && styles.toggleButtonTextActive]}>Grande</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Colores (separados por coma) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. blanco, negro, café"
            value={colors}
            onChangeText={setColors}
            autoCapitalize="none"
          />
          {/* --- FIN DE NUEVOS CAMPOS --- */}


          <Text style={styles.label}>Fotos (opcional, máx. 5)</Text>
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                  <Icon name="close" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={selectImages}>
                <Icon name="camera-plus" size={32} color="#AAA" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.submitButton, loading && { backgroundColor: '#ccc' }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Enviar Avistamiento</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- ESTILOS ACTUALIZADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backButton: { padding: 5 },
  formContainer: { padding: 20, flexGrow: 1 },
  label: { fontSize: 16, color: '#666', marginBottom: 10, fontWeight: '500', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#999', marginBottom: 10 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20, textAlignVertical: 'top' },
  map: { height: 250, borderRadius: 10, marginBottom: 10 },
  addressText: { fontStyle: 'italic', color: '#666', marginBottom: 20, fontSize: 14 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  photoContainer: { position: 'relative', margin: 5 },
  photoPreview: { width: 80, height: 80, borderRadius: 8 },
  addPhotoButton: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f9f9f9', borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', margin: 5 },
  removeButton: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF6B6B', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  footer: { padding: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: 'white' },
  submitButton: { backgroundColor: '#4ECDC4', padding: 15, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  // --- NUEVOS ESTILOS PARA LOS BOTONES ---
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 4,
  },
  toggleButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#4ECDC4',
    marginLeft: 8,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CreatePublicSightingScreen;