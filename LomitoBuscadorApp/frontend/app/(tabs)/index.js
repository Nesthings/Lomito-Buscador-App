import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, TouchableOpacity, SafeAreaView, StatusBar, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import * as Location from 'expo-location';
import { useRouter, useFocusEffect } from 'expo-router';

import PetMarker from '@components/PetMarker';
import api from '@services/api';

const IndexScreen = () => {
    const router = useRouter();
    const [region, setRegion] = useState(null);
    const [lostPets, setLostPets] = useState([]);
    const mapRef = useRef(null);

    useFocusEffect(
      useCallback(() => {
        getCurrentLocation();
      }, [])
    );

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para usar la app.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            const { latitude, longitude } = location.coords;
            const currentRegion = {
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };
            if (!region) {
                setRegion(currentRegion);
            }
            fetchNearbyLostPets(latitude, longitude);
        } catch (error) {
            console.log('Error obteniendo ubicación:', error);
            Alert.alert("Error de Ubicación", "No se pudo obtener la ubicación actual.");
        }
    };

    const fetchNearbyLostPets = async (lat, lng) => {
        try {
            const response = await api.get('/sightings/active-reports', {
                params: { user_lat: lat, user_lon: lng },
            });
            setLostPets(response.data.reports);
        } catch (error) {
            console.log('Error en la carga de mascotas perdidas:', error);
        }
    };

    const handleMarkerPress = (report) => {
        if (report && report.reportId) {
            router.push({ pathname: '/PetDetailScreen', params: { reportId: report.reportId } });
        } else {
            console.error("Se intentó abrir un reporte sin ID:", report);
            Alert.alert("Error", "No se pudo obtener la información de este reporte.");
        }
    };

    if (!region) {
        return (
            <View style={styles.loadingContainer}>
                <Image
                    source={require('@assets/buscando.gif')} 
                    style={styles.loadingGif}
                />
                <Text style={styles.loadingText}>Buscando alertas cercanas...</Text> 
                <Text style={styles.loadingSubText}>Por favor, espera un momento.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* --- 1. ESTILOS DEL STATUS BAR CORREGIDOS --- */}
            {/* Ahora el fondo es #FFFFFF para coincidir con el nuevo header */}
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* --- 2. ESTILOS DEL HEADER CORREGIDOS --- */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton}>
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@assets/logo_header.png')}
                        style={styles.logoImage}
                        resizeMode="cover"
                    />
                </View>
                <View style={styles.placeholder} />
            </View>
            
            {/* --- 3. SE ELIMINÓ EL SUBTITLE CONTAINER --- */}
            {/* La barra azul se ha ido. El mapa ahora ocupa todo el espacio. */}
            
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {lostPets.map((report) => (
                    report.lastSeenLocation?.latitude && (
                        <Marker
                            key={report.reportId}
                            coordinate={{
                                latitude: report.lastSeenLocation.latitude,
                                longitude: report.lastSeenLocation.longitude
                            }}
                            onPress={() => handleMarkerPress(report)}
                        >
                            <PetMarker imageUrl={report.petInfo?.basicInfo?.photos?.[0]} />
                        </Marker>
                    )
                ))}
            </MapView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // --- 4. ESTILOS DEL CONTAINER CORREGIDOS ---
    container: { flex: 1, backgroundColor: '#FFFFFF' }, // Fondo blanco unificado
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingGif: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    loadingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    loadingSubText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    // --- 5. ESTILOS DEL HEADER CORREGIDOS (COPIADOS DE MyPetsScreen) ---
    header: { 
        backgroundColor: 'white', // Fondo blanco
        paddingHorizontal: 16, 
        paddingVertical: 15, // Padding vertical ajustado
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottomWidth: 1, // Borde inferior limpio
        borderBottomColor: '#E0E0E0', 
    },
    menuButton: { padding: 8, width: 40, justifyContent: 'center', alignItems: 'center', },
    menuLine: { width: 24, height: 3, backgroundColor: '#343A40', marginVertical: 2, borderRadius: 2, },
    logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' }, // Ajustado para centrar
    logoImage: { width: 230, height: 62, resizeMode: 'contain' }, // Usar 'contain' es más seguro
    placeholder: { width: 40, },
    
    // --- 6. ESTILO DE SUBTITLE ELIMINADO ---
    // subtitleContainer: { ... },
    // subtitle: { ... },
    
    map: { flex: 1 },
});

export default IndexScreen;