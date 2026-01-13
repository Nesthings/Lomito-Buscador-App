import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking, 
  SafeAreaView, 
  Image,
  Alert,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

const DonateScreen = () => {
    const router = useRouter();

    const donationLink = 'https://mpago.la/TU_LINK_DE_PAGO_AQUI';

    const handleDonatePress = async () => {
        // Verifica si el link es válido antes de intentar abrirlo
        const supported = await Linking.canOpenURL(donationLink);
        if (supported) {
            await Linking.openURL(donationLink);
        } else {
            Alert.alert("Error", `No se pudo abrir el siguiente enlace: ${donationLink}`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Icon name="arrow-left" size={28} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Image
                    source={require('@assets/pp.jpg')}
                    style={styles.profileImage}
                />

                <Text style={styles.title}>¡Gracias por estar aquí!</Text>

                <Text style={styles.message}>
                    Hola, soy Néstor. "Lomito Buscador" es un proyecto que nació del corazón, desarrollado por una sola persona con la misión de ayudar a más mascotas a volver a casa.
                    {'\n\n'}
                    Para que la app siga siendo gratuita y funcional para todos, se deben cubrir costos de servidores y mapas.
                    {'\n\n'}
                    Si te gusta el proyecto y quieres apoyar mi trabajo, puedes "invitarme un café". Tu donación, sin importar el tamaño, me ayuda a mantener las luces encendidas y a seguir mejorando la herramienta parea la comunidad
                </Text>

                <TouchableOpacity style={styles.donateButton} onPress={handleDonatePress}>
                    <Icon name="coffee-outline" size={24} color="#FFF" />
                    <Text style={styles.donateButtonText}>Invítame un Café ☕</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>De todo corazón, gracias por ser parte de esta comunidad.</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        padding: 15,
    },
    backButton: {
        padding: 5,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    profileImage: {
        width: 160,
        height: 160,
        borderRadius: 80, // La mitad del ancho/alto para que sea un círculo perfecto
        borderWidth: 4,
        borderColor: '#4ECDC4', // El color principal de tu app
        marginBottom: 20,
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#333', 
        textAlign: 'center',
        marginBottom: 20,
    },
    message: { 
        fontSize: 16, 
        color: '#555', 
        textAlign: 'center', 
        lineHeight: 24, 
        marginBottom: 35,
    },
    donateButton: {
        flexDirection: 'row',
        backgroundColor: '#4ECDC4',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    donateButtonText: { 
        color: 'white', 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginLeft: 12 
    },
    footerText: { 
        fontSize: 14, 
        color: '#aaa', 
        marginTop: 40, 
        fontStyle: 'italic' 
    },
});

export default DonateScreen;