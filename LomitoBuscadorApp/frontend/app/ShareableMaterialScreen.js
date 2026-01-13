import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '@services/api';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg'; 

const ShareableMaterialScreen = () => {
    const router = useRouter();
    const { reportId } = useLocalSearchParams();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const viewShotRef = useRef();

    useEffect(() => {
        if (!reportId) {
            Alert.alert("Error", "No se recibió un ID de reporte.");
            router.back();
            return;
        }
        const fetchReportData = async () => {
            try {
                const response = await api.get(`/reports/${reportId}`);
                // El backend devuelve un objeto 'report' que contiene 'petInfo'
                setReportData(response.data.report);
            } catch (error) {
                Alert.alert("Error", "No se pudieron cargar los datos del reporte.");
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [reportId]);

    const handleSaveImage = async () => {
        try {
            const uri = await viewShotRef.current.capture();
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permiso denegado", "Se necesita acceso a la galería para guardar la imagen.");
                return;
            }
            await MediaLibrary.createAssetAsync(uri);
            Alert.alert("¡Guardado!", "La imagen del volante se ha guardado en tu galería.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo guardar la imagen.");
        }
    };
    
    const handleShareImage = async () => {
        try {
            const uri = await viewShotRef.current.capture();
            await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Compartir volante de búsqueda' });
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo compartir la imagen.");
        }
    };

    if (loading || !reportData) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={{marginTop: 10}}>Generando materiales...</Text>
            </SafeAreaView>
        );
    }


    const petInfo = reportData.petInfo;
    const photoUrl = petInfo.basicInfo?.photos?.[0] || 'https://via.placeholder.com/300';
    // URL para el QR. En el futuro, debería apuntar a una página web pública del reporte.
    const reportUrlForQR = `https://lomitobuscador.com/report/${reportId}`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/ReportsScreen')} style={styles.backButton}>
                    <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Material de Difusión</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.instructions}>Tu reporte está activo. ¡Comparte este volante para aumentar las posibilidades de encontrar a {petInfo.basicInfo.name}!</Text>
                
            
                <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                    <View style={styles.flyerContainer}>
                        <View style={styles.flyerHeader}>
                            <Text style={styles.flyerHeaderText}>SE BUSCA</Text>
                        </View>
                        <Image source={{ uri: photoUrl }} style={styles.flyerImage} />
                        
                        <Text style={styles.flyerPetName}>{petInfo.basicInfo.name.toUpperCase()}</Text>
                        
                        <View style={styles.infoGrid}>
                            <InfoBox label="Raza" value={petInfo.specificInfo.breed} />
                            <InfoBox label="Sexo" value={petInfo.specificInfo.sex} />
                            <InfoBox label="Colores" value={petInfo.specificInfo.colors.join(', ')} />
                        </View>
                        
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>VISTO POR ÚLTIMA VEZ EN:</Text>
                            <Text style={styles.sectionContent}>{reportData.lastSeenLocation.address}</Text>
                        </View>
                        
                        {petInfo.specificInfo.specialFeatures && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>SEÑAS PARTICULARES:</Text>
                                <Text style={styles.sectionContent}>{petInfo.specificInfo.specialFeatures}</Text>
                            </View>
                        )}
                        
                        <View style={styles.contactContainer}>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactHeader}>SI LO VES, CONTACTA A:</Text>
                                <Text style={styles.contactPhone}>{petInfo.ownerInfo.ownerPhone}</Text>
                                <Text style={styles.contactName}>{petInfo.ownerInfo.ownerName}</Text>
                            </View>
                            <View style={styles.qrContainer}>
                                <QRCode value={reportUrlForQR} size={80} backgroundColor='white' color='black'/>
                            </View>
                        </View>
                    </View>
                </ViewShot>

                {/* Botones de Acción */}
                <Text style={styles.actionsTitle}>Acciones</Text>
                <TouchableOpacity style={[styles.button, styles.imageButton]} onPress={handleSaveImage}>
                    <Icon name="download" size={20} color="white" />
                    <Text style={styles.buttonText}>Guardar en Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.pdfButton]} onPress={handleShareImage}>
                    <Icon name="share-variant" size={20} color="white" />
                    <Text style={styles.buttonText}>Compartir Imagen</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const InfoBox = ({ label, value }) => (
    <View style={styles.infoBox}>
        <Text style={styles.infoBoxLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.infoBoxValue}>{value}</Text>
    </View>
);

// --- 5. ESTILOS COMPLETAMENTE REDISEÑADOS ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#FFF' },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    backButton: { padding: 5 },
    scrollContainer: { padding: 20, alignItems: 'center' },
    instructions: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 25, lineHeight: 22 },
    flyerContainer: {
        width: 350,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    flyerHeader: { backgroundColor: '#FFD700', padding: 10 },
    flyerHeaderText: { fontSize: 36, fontWeight: '900', color: '#D22B2B', textAlign: 'center', letterSpacing: 2 },
    flyerImage: { width: '100%', height: 300 },
    flyerPetName: { fontSize: 42, fontWeight: 'bold', textAlign: 'center', marginVertical: 15, color: '#333' },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginBottom: 15 },
    infoBox: { alignItems: 'center', paddingHorizontal: 5 },
    infoBoxLabel: { fontSize: 12, fontWeight: 'bold', color: '#888' },
    infoBoxValue: { fontSize: 16, color: '#333' },
    section: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 4 },
    sectionContent: { fontSize: 16, color: '#333', lineHeight: 22 },
    contactContainer: { flexDirection: 'row', backgroundColor: '#333', padding: 15, alignItems: 'center' },
    contactInfo: { flex: 1 },
    contactHeader: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
    contactPhone: { color: 'white', fontSize: 24, fontWeight: 'bold', marginVertical: 2 },
    contactName: { color: '#ccc', fontSize: 14 },
    qrContainer: { backgroundColor: 'white', padding: 5, borderRadius: 4 },
    actionsTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 10 },
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '90%', padding: 15, borderRadius: 12, marginBottom: 10 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    imageButton: { backgroundColor: '#4ECDC4' },
    pdfButton: { backgroundColor: '#5a67d8' }, // Un color diferente para la segunda acción
});

export default ShareableMaterialScreen;