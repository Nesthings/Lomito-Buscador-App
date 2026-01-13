import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import api from '@services/api';

const EditPetProfileScreen = () => {
  const router = useRouter();
  const { petId } = useLocalSearchParams();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPetData = async () => {
      if (!petId) {
        Alert.alert("Error", "No se recibió un ID de mascota.");
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/pets/${petId}`);
        const petData = response.data.pet;

        setFormData({
            ...petData.basicInfo,
            ...petData.specificInfo,
            ...petData.ownerInfo,
            
            temperament: petData.specificInfo.temperament ? petData.specificInfo.temperament.split(',') : [],
            age: petData.specificInfo.age?.toString() || '',
        });
      } catch (error) {
        console.error("Failed to fetch pet data:", error);
        Alert.alert("Error", "No se pudo cargar la información de la mascota.");
      } finally {
        setLoading(false);
      }
    };
    fetchPetData();
  }, [petId]);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // datos para enviarlos como un objeto JSON
      const preparedData = { ...formData, temperament: formData.temperament.join(',') };
      
      // La llamada PUT enviará 'preparedData' en el cuerpo de la petición
      await api.put(`/pets/${petId}`, preparedData);
      
      Alert.alert("Éxito", "Perfil de la mascota actualizado.");
      router.back(); // Vuelve a la pantalla anterior
    } catch (error) {
      console.error("Failed to save changes:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleTemperamentSelect = (temperament) => {
    const currentTemperaments = formData.temperament;
    if (currentTemperaments.includes(temperament)) {
      setFormData({...formData, temperament: currentTemperaments.filter(t => t !== temperament)});
    } else {
      setFormData({...formData, temperament: [...currentTemperaments, temperament]});
    }
  };

  if (loading || !formData) {
    return <View style={styles.centered}><Text>Cargando información...</Text></View>;
  }

  const temperaments = ["Juguetón", "Tímido", "Energético", "Tranquilo", "Social", "Guardián", "Cariñoso", "Independiente"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil de {formData.name}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Información Básica</Text>
        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={formData.name} onChangeText={text => setFormData({ ...formData, name: text })} />
        
        <Text style={styles.label}>Fotos</Text>
        <View style={styles.photoGrid}>
          {formData.photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Detalles Específicos</Text>
        <Text style={styles.label}>Raza</Text>
        <TextInput style={styles.input} value={formData.breed} onChangeText={text => setFormData({ ...formData, breed: text })} />
        <Text style={styles.label}>Edad (años)</Text>
        <TextInput style={styles.input} value={formData.age} onChangeText={text => setFormData({ ...formData, age: text })} keyboardType="numeric" />

        <View style={styles.checkboxContainer}>
          <Text style={styles.label}>¿Está vacunado?</Text>
          <Switch value={formData.isVaccinated} onValueChange={value => setFormData({...formData, isVaccinated: value})} />
        </View>
        <View style={styles.checkboxContainer}>
          <Text style={styles.label}>¿Padece enfermedad?</Text>
          <Switch value={formData.hasIllness} onValueChange={value => setFormData({...formData, hasIllness: value})} />
        </View>
        {formData.hasIllness && (
          <TextInput style={styles.input} value={formData.illnessDetails} onChangeText={text => setFormData({...formData, illnessDetails: text})} placeholder="Indica cuál" />
        )}
        
        <Text style={styles.label}>Temperamento</Text>
        <View style={styles.multiSelectContainer}>
          {temperaments.map(t => (
            <TouchableOpacity key={t} style={[styles.multiSelect, formData.temperament.includes(t) && styles.multiSelectSelected]} onPress={() => handleTemperamentSelect(t)}>
              <Text style={[styles.multiSelectText, formData.temperament.includes(t) && styles.multiSelectSelectedText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Característica Especial</Text>
        <TextInput style={[styles.input, { height: 100 }]} value={formData.specialFeatures} onChangeText={text => setFormData({ ...formData, specialFeatures: text })} multiline />

        <Text style={styles.sectionTitle}>Información de Contacto</Text>
        <Text style={styles.label}>Tu Nombre</Text>
        <TextInput style={styles.input} value={formData.ownerName} onChangeText={text => setFormData({ ...formData, ownerName: text })} />
        <Text style={styles.label}>Tu Teléfono</Text>
        <TextInput style={styles.input} value={formData.ownerPhone} onChangeText={text => setFormData({ ...formData, ownerPhone: text })} keyboardType="phone-pad" />
        <Text style={styles.label}>Tu Correo</Text>
        <TextInput style={styles.input} value={formData.ownerEmail} onChangeText={text => setFormData({ ...formData, ownerEmail: text })} keyboardType="email-address" />
        <Text style={styles.label}>Contacto Alternativo</Text>
        <TextInput style={styles.input} value={formData.altOwnerName} onChangeText={text => setFormData({ ...formData, altOwnerName: text })} />
        <Text style={styles.label}>Teléfono Alternativo</Text>
        <TextInput style={styles.input} value={formData.altOwnerPhone} onChangeText={text => setFormData({ ...formData, altOwnerPhone: text })} keyboardType="phone-pad" />
        <Text style={styles.label}>Dirección</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={formData.address} onChangeText={text => setFormData({ ...formData, address: text })} multiline />
        
        <View style={{height: 40}} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    backButton: { padding: 5 },
    formContainer: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    label: { fontSize: 16, color: '#666', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20 },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    photoContainer: { position: 'relative', margin: 5 },
    photoPreview: { width: 100, height: 100, borderRadius: 10 },
    checkboxContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginBottom: 20 },
    multiSelectContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    multiSelect: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0', margin: 4 },
    multiSelectSelected: { backgroundColor: '#4ECDC4' },
    multiSelectText: { color: '#333', fontWeight: '500' },
    multiSelectSelectedText: { color: 'white' },
    footer: { padding: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default EditPetProfileScreen;