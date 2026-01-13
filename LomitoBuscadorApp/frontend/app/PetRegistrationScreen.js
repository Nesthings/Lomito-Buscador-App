import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import api from '@services/api';

const PetRegistrationScreen = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    photos: [],
    species: '',
    breed: '',
    size: '',
    age: '',
    predominantColor: '',
    secondaryColor: '',
    hasSpots: false,
    sex: '',
    isVaccinated: false,
    hasIllness: false,
    illnessDetails: '',
    temperament: [],
    specialFeatures: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    altOwnerName: '',
    altOwnerPhone: '',
    address: '',
  });

  const totalSteps = 3;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentStep]);

  const selectImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - formData.photos.length,
    });
    if (!result.canceled) {
      setFormData({ ...formData, photos: [...formData.photos, ...result.assets] });
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, index) => index !== indexToRemove),
    });
  };

  const validateStep = () => {
    
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const data = new FormData();

      const uniquePetId = Crypto.randomUUID();
      data.append('petId', uniquePetId);
      
      // Construimos el FormData directamente para mayor claridad
      data.append('name', formData.name);
      data.append('species', formData.species);
      data.append('breed', formData.breed);
      data.append('size', formData.size);
      data.append('age', formData.age);
      data.append('sex', formData.sex);
      const colors = [];
      if (formData.predominantColor.trim()) {
        colors.push(formData.predominantColor.trim());
      }
      if (formData.secondaryColor.trim()) {
        colors.push(formData.secondaryColor.trim());
      }
      colors.forEach(color => data.append('colors', color));
      
      data.append('hasSpots', formData.hasSpots);
      
      data.append('isVaccinated', formData.isVaccinated);
      data.append('isVaccinated', formData.isVaccinated);
      data.append('hasIllness', formData.hasIllness);
      data.append('illnessDetails', formData.illnessDetails);
      data.append('temperament', formData.temperament.join(','));
      data.append('specialFeatures', formData.specialFeatures);
      data.append('ownerName', formData.ownerName);
      data.append('ownerPhone', formData.ownerPhone);
      data.append('ownerEmail', formData.ownerEmail);
      data.append('altOwnerName', formData.altOwnerName);
      data.append('altOwnerPhone', formData.altOwnerPhone);
      data.append('address', formData.address);



      formData.photos.forEach(photo => {
        data.append('photos', {
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
          name: photo.fileName || `photo_${Date.now()}.jpg`,
        });
      });
      
      const response = await api.post('pets/register', data);
      
      if (response.data.success) {
        Alert.alert('¡Éxito!', 'Mascota registrada correctamente.');
        router.back();
      } else {
        Alert.alert('Error', response.data.message || 'Hubo un problema al registrar la mascota.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo comunicar con el servidor. Revisa tu conexión y la URL de ngrok.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemperamentSelect = (temperament) => {
    const currentTemperaments = formData.temperament;
    if (currentTemperaments.includes(temperament)) {
      setFormData({ ...formData, temperament: currentTemperaments.filter(t => t !== temperament) });
    } else {
      setFormData({ ...formData, temperament: [...currentTemperaments, temperament] });
    }
  };

  const SingleSelectOption = ({ label, icon, selected, onPress }) => (
    <TouchableOpacity style={[styles.selectable, selected && styles.selected]} onPress={onPress}>
      <Icon name={icon} size={24} color={selected ? '#4ECDC4' : '#888'} />
      <Text style={[styles.selectableText, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );

  const MultiSelectOption = ({ label, selected, onPress }) => (
    <TouchableOpacity style={[styles.multiSelect, selected && styles.multiSelectSelected]} onPress={onPress}>
      <Text style={[styles.multiSelectText, selected && styles.multiSelectSelectedText]}>{label}</Text>
    </TouchableOpacity>
  );

  const CheckboxRow = ({ label, value, onValueChange }) => (
    <View style={styles.checkboxContainer}>
      <Text style={styles.label}>{label}</Text>
      <Switch trackColor={{ false: "#E0E0E0", true: "#C8E6C9" }} thumbColor={value ? "#4CAF50" : "#f4f3f4"} onValueChange={onValueChange} value={value} />
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Información básica</Text>
            <Text style={styles.label}>Nombre de tu mascota *</Text>
            <TextInput style={styles.input} value={formData.name} onChangeText={text => setFormData({ ...formData, name: text })} placeholder="Ej: Bruno, Mila..." />
            <Text style={styles.label}>Fotos (máx. 5) *</Text>
            <View style={styles.photoGrid}>
              {formData.photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                    <Icon name="close" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {formData.photos.length < 5 && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={selectImages}>
                  <Icon name="camera-plus" size={32} color="#AAA" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      case 2:
        const temperaments = ["Juguetón", "Tímido", "Energético", "Tranquilo", "Social", "Protector", "Cariñoso","Travieso", "Inteligente", "Bravo", "No muerde", "Muerde", "Curioso", "Independiente", "Obediente", "Perezoso", "Sensible"];
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Detalles específicos</Text>
            <Text style={styles.label}>Especie *</Text>
            <View style={styles.selectableContainer}>
              <SingleSelectOption label="Perro" icon="dog" selected={formData.species === 'perro'} onPress={() => setFormData({ ...formData, species: 'perro' })} />
              <SingleSelectOption label="Gato" icon="cat" selected={formData.species === 'gato'} onPress={() => setFormData({ ...formData, species: 'gato' })} />
              <SingleSelectOption label="Otro" icon="rabbit" selected={formData.species === 'otro'} onPress={() => setFormData({ ...formData, species: 'otro' })} />
            </View>
            <Text style={styles.label}>Sexo *</Text>
            <View style={styles.selectableContainer}>
              <SingleSelectOption label="Macho" icon="gender-male" selected={formData.sex === 'macho'} onPress={() => setFormData({ ...formData, sex: 'macho' })} />
              <SingleSelectOption label="Hembra" icon="gender-female" selected={formData.sex === 'hembra'} onPress={() => setFormData({ ...formData, sex: 'hembra' })} />
            </View>
            <Text style={styles.label}>Tamaño *</Text>
            <View style={styles.selectableContainer}>
              <SingleSelectOption label="Pequeño" icon="arrow-down-right" selected={formData.size === 'pequeño'} onPress={() => setFormData({ ...formData, size: 'pequeño' })} />
              <SingleSelectOption label="Mediano" icon="arrow-right-top" selected={formData.size === 'mediano'} onPress={() => setFormData({ ...formData, size: 'mediano' })} />
              <SingleSelectOption label="Grande" icon="arrow-up" selected={formData.size === 'grande'} onPress={() => setFormData({ ...formData, size: 'grande' })} />
            </View>
            <Text style={styles.label}>Raza *</Text>
            <TextInput style={styles.input} value={formData.breed} onChangeText={text => setFormData({ ...formData, breed: text })} placeholder="Ej: Golden Retriever, Pug..." />
            <Text style={styles.label}>Edad (años) *</Text>
            <TextInput style={styles.input} value={formData.age} onChangeText={text => setFormData({ ...formData, age: text.replace(/[^0-9]/g, '') })} keyboardType="numeric" placeholder="Ej: 3" />
            <Text style={styles.label}>Color Predominante *</Text>
            <TextInput
              style={styles.input}
              value={formData.predominantColor}
              onChangeText={text => setFormData({ ...formData, predominantColor: text })}
              placeholder="Ej: Café oscuro"
            />

            <Text style={styles.label}>Color Secundario (opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.secondaryColor}
              onChangeText={text => setFormData({ ...formData, secondaryColor: text })}
              placeholder="Ej: Blanco en el pecho"
            />

            <CheckboxRow
              label="¿Es manchado?"
              value={formData.hasSpots}
              onValueChange={value => setFormData({...formData, hasSpots: value})}
            />  
            <CheckboxRow label="¿Está vacunado?" value={formData.isVaccinated} onValueChange={value => setFormData({ ...formData, isVaccinated: value })} />
            <CheckboxRow label="¿Padece alguna enfermedad?" value={formData.hasIllness} onValueChange={value => setFormData({ ...formData, hasIllness: value })} />
            {formData.hasIllness && (
              <TextInput style={styles.input} value={formData.illnessDetails} onChangeText={text => setFormData({ ...formData, illnessDetails: text })} placeholder="Indica cuál enfermedad" />
            )}
            <Text style={styles.label}>Temperamento (puedes elegir varios)</Text>
            <View style={styles.multiSelectContainer}>
              {temperaments.map(t => (
                <MultiSelectOption key={t} label={t} selected={formData.temperament.includes(t)} onPress={() => handleTemperamentSelect(t)} />
              ))}
            </View>
            <Text style={styles.label}>Característica especial o distintiva</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={formData.specialFeatures} onChangeText={text => setFormData({ ...formData, specialFeatures: text })} placeholder="Ej: Tiene una mancha negra en el ojo derecho" multiline />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tu información de contacto</Text>
            <Text style={styles.label}>Tu nombre *</Text>
            <TextInput style={styles.input} value={formData.ownerName} onChangeText={text => setFormData({ ...formData, ownerName: text })} placeholder="Nombre completo" />
            <Text style={styles.label}>Tu teléfono *</Text>
            <TextInput style={styles.input} value={formData.ownerPhone} onChangeText={text => setFormData({ ...formData, ownerPhone: text })} placeholder="Ej: 844 123 4567" keyboardType="phone-pad" />
            <Text style={styles.label}>Tu correo electrónico *</Text>
            <TextInput style={styles.input} value={formData.ownerEmail} onChangeText={text => setFormData({ ...formData, ownerEmail: text })} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Nombre de contacto alternativo</Text>
            <TextInput style={styles.input} value={formData.altOwnerName} onChangeText={text => setFormData({ ...formData, altOwnerName: text })} placeholder="Nombre de un familiar o amigo" />
            <Text style={styles.label}>Teléfono alternativo</Text>
            <TextInput style={styles.input} value={formData.altOwnerPhone} onChangeText={text => setFormData({ ...formData, altOwnerPhone: text })} placeholder="Teléfono del contacto alternativo" keyboardType="phone-pad" />
            <Text style={styles.label}>Dirección (Opcional)</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={formData.address} onChangeText={text => setFormData({ ...formData, address: text })} placeholder="Tu calle, número y colonia" multiline />
          </View>
        );
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Mascota</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.navButton} onPress={handleBack}>
              <Text style={styles.navButtonText}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext} disabled={loading}>
            <Text style={[styles.navButtonText, styles.nextButtonText]}>
              {loading ? 'Registrando...' : (currentStep === totalSteps ? 'Finalizar Registro' : 'Siguiente')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  backButton: { padding: 5 },
  scrollViewContent: { padding: 20, paddingBottom: 100 },
  stepContainer: { marginBottom: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#333' },
  label: { fontSize: 16, color: '#666', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 20, },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', },
  photoContainer: { position: 'relative', margin: 5, },
  photoPreview: { width: 100, height: 100, borderRadius: 10, },
  addPhotoButton: { width: 100, height: 100, borderRadius: 10, backgroundColor: '#f9f9f9', borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', margin: 5, },
  removeButton: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF6B6B', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', },
  selectableContainer: { flexDirection: 'row', marginBottom: 20, },
  selectable: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginHorizontal: 5, backgroundColor: '#f9f9f9' },
  selected: { backgroundColor: '#E6F4FE', borderColor: '#4ECDC4', },
  selectableText: { marginLeft: 8, fontSize: 14, color: '#888', fontWeight: '600' },
  selectedText: { color: '#4ECDC4', },
  checkboxContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10, marginBottom: 20, },
  multiSelectContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, },
  multiSelect: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0', margin: 4, },
  multiSelectSelected: { backgroundColor: '#4ECDC4', },
  multiSelectText: { color: '#333', fontWeight: '500', },
  multiSelectSelectedText: { color: 'white', },
  navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: 'white', },
  navButton: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: '#f0f0f0', marginHorizontal: 5, },
  navButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  nextButton: { backgroundColor: '#4ECDC4', },
  nextButtonText: { color: 'white', },
});

export default PetRegistrationScreen;