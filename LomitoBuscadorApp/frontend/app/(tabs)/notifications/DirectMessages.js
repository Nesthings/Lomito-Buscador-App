import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const DirectMessages = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => { /* ... (tu código sin cambios) ... */ };
  const onRefresh = () => { /* ... (tu código sin cambios) ... */ };

  const handleConversationPress = (item) => {
    // Navegar a la pantalla de chat, pasando el ID de la conversación
    // y la información del otro usuario para mostrar en el header del chat.
    router.push({
      pathname: '/chat', // Asegúrate de tener una pantalla app/chat.js
      params: { 
        conversationId: item.conversationId, 
        otherUserName: item.otherUser.name, 
        otherUserPhoto: item.otherUser.photo 
      }
    });
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={[styles.conversationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleConversationPress(item)}
    >
      <Image source={{ uri: item.otherUser.photo || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <View style={styles.conversationContent}>
        <Text style={styles.conversationName}>{item.otherUser.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
        <Text style={styles.messageTime}>
          {formatDistanceToNow(new Date(item.timestamp._seconds * 1000), { locale: es, addSuffix: true })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.conversationId}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No tienes mensajes</Text></View>}
    />
  );
};

// Copiamos los estilos relevantes del archivo original
const styles = StyleSheet.create({
    listContainer: { padding: 15, flexGrow: 1 },
    conversationCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    unreadCard: { backgroundColor: '#F0F9FF' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    conversationContent: { flex: 1 },
    conversationName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    lastMessage: { fontSize: 14, color: '#666', marginBottom: 3 },
    messageTime: { fontSize: 12, color: '#999' },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ECDC4', alignSelf: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#999' }
});

export default DirectMessages;