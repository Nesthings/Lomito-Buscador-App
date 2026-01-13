import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const GeneralNotifications = () => {
  const router = useRouter(); // Usamos el router
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => { /* ... (tu código sin cambios) ... */ };
  const onRefresh = () => { /* ... (tu código sin cambios) ... */ };
  const getNotificationIcon = (type) => { /* ... (tu código sin cambios) ... */ };
  
  const handleNotificationPress = async (item) => {
    // Primero, marca como leída
    if (!item.isRead) {
      try {
        await api.post(`/notifications/${item.notificationId}/mark-read`);
        fetchNotifications(); // Refresca la lista para quitar el punto azul
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Segundo, navega a la pantalla correspondiente
    if (item.relatedEntity && item.relatedEntity.id) {
        // Asumimos que la notificación trae a dónde navegar
        // Por ejemplo, a un reporte de extravío
        router.push({
            pathname: '/PetDetailScreen',
            params: { reportId: item.relatedEntity.id }
        });
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}><Text style={styles.icon}>{getNotificationIcon(item.type)}</Text></View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {formatDistanceToNow(new Date(item.createdAt._seconds * 1000), { locale: es, addSuffix: true })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={(item) => item.notificationId}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No tienes notificaciones</Text></View>}
    />
  );
};

// Copiamos los estilos relevantes del archivo original
const styles = StyleSheet.create({
    listContainer: { padding: 15, flexGrow: 1 },
    notificationCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    unreadCard: { backgroundColor: '#F0F9FF' },
    iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    icon: { fontSize: 24 },
    notificationContent: { flex: 1 },
    notificationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    notificationBody: { fontSize: 14, color: '#666', marginBottom: 5 },
    notificationTime: { fontSize: 12, color: '#999' },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ECDC4', alignSelf: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#999' }
});

export default GeneralNotifications;