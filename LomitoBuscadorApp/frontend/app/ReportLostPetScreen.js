import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Alert, StyleSheet, SafeAreaView,
  ActivityIndicator, Image, TextInput, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '@services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ReportLostPetScreen = () => {
    const router = useRouter();
    const { petId } = useLocalSearchParams();

    const [petInfo, setPetInfo] = useState(null);
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    useEffect(() => {
        const initializeScreen = async () => {
            if (!petId) {
                Alert.alert("Error", "No se especificó una mascota para reportar.");
                router.back();
                return;
            }
            await fetchPetInfo();
            await getCurrentLocation();
            setInitializing(false);
        };
        initializeScreen();
    }, [petId]);

    const fetchPetInfo = async () => {
        try {
            const response = await api.get(`/pets/${petId}`);
            setPetInfo(response.data.pet);
        } catch (error) {
            console.error("Error fetching pet info:", error);
            router.back();
        }
    };

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación.');
                router.back();
                return;
            }
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = position.coords;
            setLocation({ latitude, longitude });
            const addr = await getAddressFromCoords(latitude, longitude);
            setAddress(addr);
        } catch (error) {
            Alert.alert('Error de Ubicación', 'No se pudo obtener tu ubicación.');
            router.back();
        }
    };

    const getAddressFromCoords = async (lat, lng) => {
        setIsFetchingAddress(true);
        try {
            const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!GOOGLE_MAPS_API_KEY) {
                console.warn("API Key de Google Maps no encontrada. Verifica tu archivo .env y reinicia el servidor.");
                return "Configuración de API requerida.";
            }
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
            const data = await response.json();
            if (data.status === 'OK' && data.results[0]) {
                return data.results[0].formatted_address;
            } else {
                console.error("Error de la API de Google:", data.error_message || data.status);
                return 'No se pudo encontrar la dirección.';
            }
        } catch (error) {
            console.error("Error de red al llamar a la API:", error);
            return 'Error al obtener la dirección.';
        } finally {
            setIsFetchingAddress(false);
        }
    };
    
    const handleReportLost = () => {
        Alert.alert(
            '¿Confirmar reporte?',
            'Se enviará una notificación a usuarios cercanos y se creará una alerta activa.',
            [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: submitReport }]
        );
    };


    const submitReport = async () => {
        if (!location || !petInfo) return;
        setLoading(true);
        try {
            const reportPayload = {
                petId: petId,
                ownerId: petInfo.ownerId,
                lastSeenLocation: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: address
                },
                notes: notes,
            };
            const response = await api.post('/reports/create', reportPayload);
            
            if (response.data.success) {
                const newReportId = response.data.reportId;

                Alert.alert(
                    'Reporte Creado',
                    'Tu mascota ha sido reportada. ¿Qué quieres hacer ahora?',
                    [
                        {
                            text: 'Crear Volante de Búsqueda',
                            style: 'default',
                            onPress: () => router.replace({
                                pathname: '/ShareableMaterialScreen',
                                params: { reportId: newReportId },
                            })
                        },
                        {
                            text: 'Ver todos los reportes',
                            style: 'cancel',
                            // Asumiendo que tu archivo se llama reports.js
                            onPress: () => router.replace('/(tabs)/reports') 
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear el reporte.');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setLocation({ latitude, longitude });
        const newAddress = await getAddressFromCoords(latitude, longitude);
        setAddress(newAddress);
    };

    if (initializing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={styles.loadingText}>Preparando reporte...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Icon name="arrow-left" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Reportar Extravío</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    
                    <MapView
                        style={styles.map}
                        initialRegion={{ ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                    >
                        <Marker
                            coordinate={location}
                            title="Última ubicación conocida"
                            description="Mantén presionado y arrastra para ajustar"
                            draggable
                            onDragEnd={handleDragEnd}
                        />
                    </MapView>

                    <View style={styles.infoContainer}>
                        {petInfo && (
                            <View style={styles.petInfoBox}>
                                <Image source={{ uri: petInfo.basicInfo.photos[0] }} style={styles.petImage} />
                                <View>
                                    <Text style={styles.reportingText}>Estás reportando a:</Text>
                                    <Text style={styles.petName}>{petInfo.basicInfo.name}</Text>
                                </View>
                            </View>
                        )}
                        <Text style={styles.addressLabel}>Última ubicación conocida:</Text>
                        <Text style={styles.addressText}>
                            {isFetchingAddress ? 'Buscando dirección...' : (address || 'Arrastra el pin para actualizar...')}
                        </Text>
                        
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Añade notas (ej. 'Se asustó con un ruido fuerte')"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        <TouchableOpacity
                            style={[styles.reportButton, (loading || !location) && styles.disabledButton]}
                            onPress={handleReportLost}
                            disabled={loading || !location}
                        >
                            <Text style={styles.reportButtonText}>
                                {loading ? 'Creando Reporte...' : 'Confirmar y Reportar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: 'white' },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    backButton: { padding: 5 },
    map: { flex: 1 },
    infoContainer: {
        backgroundColor: 'white',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    petInfoBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    petImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    reportingText: { fontSize: 14, color: '#666' },
    petName: { fontSize: 20, fontWeight: 'bold' },
    addressLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
    addressText: { fontSize: 16, fontWeight: '500', marginBottom: 15, minHeight: 20 },
    notesInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        height: 80,
        textAlignVertical: 'top',
        marginBottom: 15,
        fontSize: 16
    },
    reportButton: { backgroundColor: '#FF6B6B', padding: 18, borderRadius: 12, alignItems: 'center' },
    disabledButton: { backgroundColor: '#ccc' },
    reportButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default ReportLostPetScreen;