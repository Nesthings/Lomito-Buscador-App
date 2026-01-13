//aqui reporta el avistamiendo de una mascota con un reporte previo
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '@services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SightingReportScreen = () => {
  const router = useRouter();
  const { reportId } = useLocalSearchParams();

  const [reportInfo, setReportInfo] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para reportar un avistamiento.');
        router.back();
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      try {
        const response = await api.get(`/reports/${reportId}`);
        setReportInfo(response.data.report);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar la información del reporte a comentar.");
        router.back();
      }
    })();
  }, [reportId]);

  const getAddressFromCoords = async (lat, lng) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      return data.results[0]?.formatted_address || 'Dirección no encontrada';
    } catch (error) {
      return 'No se pudo obtener la dirección';
    }
  };

  const handleMapPress = async (event) => {
    const coords = event.nativeEvent.coordinate;
    setLocation(coords);
    const addr = await getAddressFromCoords(coords.latitude, coords.longitude);
    setAddress(addr);
  };

  const selectPhotos = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0]]);
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Por favor, marca la ubicación del avistamiento en el mapa.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reportedBy', 'CURRENT_USER_ID'); // Reemplazar con el ID del usuario logueado
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('address', address);
      formData.append('notes', notes);

      photos.forEach((photo, index) => {
        const uriParts = photo.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('photos', {
          uri: photo.uri,
          name: `photo_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      });

      // Esta es la llamada al backend, sin el header de Content-Type
      const response = await api.post(`/reports/${reportId}/sighting`, formData);

      if (response.data.success) {
        Alert.alert(
          '¡Gracias por tu ayuda!',
          'Tu avistamiento ha sido reportado y el dueño ha sido notificado.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el reporte de avistamiento.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!initialRegion || !reportInfo) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#4ECDC4" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.container} contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reportar Avistamiento</Text>
                <View style={{width: 40}}/>
            </View>

            <View style={styles.petInfoHeader}>
                <Image source={{ uri: reportInfo.petInfo.basicInfo.photos[0] }} style={styles.petImage} />
                <Text style={styles.petInfoText}>Viste a <Text style={{fontWeight: 'bold'}}>{reportInfo.petInfo.basicInfo.name}</Text>? Ayúdale a volver a casa.</Text>
            </View>

            <Text style={styles.subtitle}>Toca el mapa para marcar dónde lo viste</Text>

            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              onPress={handleMapPress}
              showsUserLocation
            >
              {location && <Marker coordinate={location} title="Ubicación del avistamiento" />}
            </MapView>
            {address ? <Text style={styles.addressText}>{address}</Text> : null}

            <View style={styles.form}>
              <Text style={styles.label}>Notas adicionales (muy importante)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: Lo vi corriendo hacia el parque, parecía asustado y cojeaba un poco..."
                multiline
              />

              <Text style={styles.label}>Fotos del avistamiento (opcional, ¡pero ayuda mucho!)</Text>
              <TouchableOpacity style={styles.photoButton} onPress={selectPhotos}>
                <Icon name="camera-plus-outline" size={22} color="white"/>
                <Text style={styles.photoButtonText}>
                  {photos.length > 0 ? `${photos.length} foto(s) seleccionada(s)` : 'Agregar Fotos'}
                </Text>
              </TouchableOpacity>
              <View style={styles.photosPreview}>
                {photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo.uri }} style={styles.photoPreview} />
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, loading && {backgroundColor: '#ccc'}]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Enviar Avistamiento</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backButton: { padding: 5 },
  petInfoHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#EFEFEF' },
  petImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  petInfoText: { flex: 1, fontSize: 16 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginTop: 15, textAlign: 'center' },
  map: { height: 300, marginHorizontal: 20, marginTop: 10, borderRadius: 12 },
  addressText: { textAlign: 'center', padding: 10, color: '#4ECDC4', fontWeight: '500'},
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  textArea: { height: 100, textAlignVertical: 'top' },
  photoButton: { backgroundColor: '#4ECDC4', padding: 15, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  photoButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  photosPreview: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  photoPreview: { width: 80, height: 80, borderRadius: 8, margin: 5 },
  submitButton: { backgroundColor: '#FF6B6B', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default SightingReportScreen;