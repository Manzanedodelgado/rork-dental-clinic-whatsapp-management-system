import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Mic,
  Calendar,
  Clock
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useClinic } from '@/hooks/useClinicStore';
import { useAuth } from '@/hooks/useAuth';
import type { WhatsAppMessage } from '@/types';
import { Shield } from 'lucide-react-native';

export default function ChatScreen() {
  const { 
    conversations, 
    activeConversation, 
    selectedConversation,
    setSelectedConversation
  } = useClinic();
  const { hasPermission } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const filteredConversations = conversations.filter(conv =>
    conv.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.patient.phone.includes(searchQuery)
  );

  // Mock messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      setMessages([
        {
          id: '1',
          patientId: activeConversation.patient.id,
          content: 'Hola, ¿podría confirmar mi cita de mañana?',
          timestamp: '2024-01-14T18:30:00Z',
          isFromPatient: true,
          isRead: true,
          messageType: 'text'
        },
        {
          id: '2',
          patientId: activeConversation.patient.id,
          content: 'Hola! Por supuesto, tu cita está confirmada para mañana a las 10:30 AM para revisión de implante. ¿Necesitas alguna información adicional?',
          timestamp: '2024-01-14T18:32:00Z',
          isFromPatient: false,
          isRead: true,
          messageType: 'text'
        },
        {
          id: '3',
          patientId: activeConversation.patient.id,
          content: 'Perfecto, gracias. ¿Debo llevar algo especial?',
          timestamp: '2024-01-14T18:35:00Z',
          isFromPatient: true,
          isRead: true,
          messageType: 'text'
        },
        {
          id: '4',
          patientId: activeConversation.patient.id,
          content: 'No es necesario, solo tu documento de identidad. Te esperamos puntual. ¡Que tengas buen día!',
          timestamp: '2024-01-14T18:36:00Z',
          isFromPatient: false,
          isRead: true,
          messageType: 'text'
        }
      ]);
    }
  }, [activeConversation]);

  const sendMessage = async () => {
    if (!messageText.trim() || !activeConversation) return;

    const newMessage: WhatsAppMessage = {
      id: Date.now().toString(),
      patientId: activeConversation.patient.id,
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      isFromPatient: false,
      isRead: true,
      messageType: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');

    // Simulate AI response if enabled
    setTimeout(() => {
      const aiResponse: WhatsAppMessage = {
        id: (Date.now() + 1).toString(),
        patientId: activeConversation.patient.id,
        content: 'Mensaje recibido. Nuestro equipo te responderá pronto.',
        timestamp: new Date().toISOString(),
        isFromPatient: true,
        isRead: false,
        messageType: 'text'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 2000);
  };

  // Check permissions
  if (!hasPermission('whatsapp') && !hasPermission('all')) {
    return (
      <View style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Shield size={64} color={Colors.light.textSecondary} />
          <Text style={styles.noPermissionText}>
            No tienes permisos para acceder a esta sección
          </Text>
        </View>
      </View>
    );
  }

  const renderConversationItem = ({ item }: { item: typeof conversations[0] }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        selectedConversation === item.id && styles.conversationItemActive
      ]}
      onPress={() => setSelectedConversation(item.id)}
    >
      <View style={styles.conversationAvatar}>
        <Text style={styles.conversationAvatarText}>
          {item.patient.name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.patient.name}</Text>
          <Text style={styles.conversationTime}>
            {new Date(item.lastMessage.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.conversationLastMessage} numberOfLines={1}>
            {item.lastMessage.isFromPatient ? '' : '✓ '}
            {item.lastMessage.content}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: WhatsAppMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isFromPatient ? styles.messageFromPatient : styles.messageFromClinic
    ]}>
      <View style={[
        styles.messageBubble,
        item.isFromPatient ? styles.messageBubblePatient : styles.messageBubbleClinic
      ]}>
        <Text style={[
          styles.messageText,
          item.isFromPatient ? styles.messageTextPatient : styles.messageTextClinic
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          item.isFromPatient ? styles.messageTimePatient : styles.messageTimeClinic
        ]}>
          {new Date(item.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );

  const renderPatientInfo = () => {
    if (!activeConversation) return null;

    const patient = activeConversation.patient;
    const recentAppointments = patient.appointments?.slice(0, 5) || [];

    return (
      <View style={styles.patientInfo}>
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>
              {patient.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientPhone}>{patient.phone}</Text>
            {patient.email && (
              <Text style={styles.patientEmail}>{patient.email}</Text>
            )}
          </View>
        </View>

        <View style={styles.patientStats}>
          <View style={styles.patientStat}>
            <Calendar color={Colors.light.primary} size={16} />
            <Text style={styles.patientStatText}>
              Última visita: {patient.lastVisit || 'N/A'}
            </Text>
          </View>
          {patient.nextAppointment && (
            <View style={styles.patientStat}>
              <Clock color={Colors.light.success} size={16} />
              <Text style={styles.patientStatText}>
                Próxima cita: {patient.nextAppointment}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.recentAppointments}>
          <Text style={styles.recentAppointmentsTitle}>Últimas 5 Citas</Text>
          {recentAppointments.length === 0 ? (
            <Text style={styles.noAppointments}>No hay citas registradas</Text>
          ) : (
            recentAppointments.map((apt, index) => (
              <View key={index} style={styles.appointmentItem}>
                <Text style={styles.appointmentDate}>{apt.date}</Text>
                <Text style={styles.appointmentTreatment}>{apt.treatment}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatContainer}>
        {/* Conversations List */}
        <View style={styles.conversationsList}>
          <View style={styles.conversationsHeader}>
            <Text style={styles.conversationsTitle}>WhatsApp</Text>
            <TouchableOpacity>
              <MoreVertical color={Colors.light.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search color={Colors.light.textSecondary} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            style={styles.conversationsListContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Chat Area */}
        <View style={styles.chatArea}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <View style={styles.chatAvatar}>
                    <Text style={styles.chatAvatarText}>
                      {activeConversation.patient.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.chatHeaderName}>{activeConversation.patient.name}</Text>
                    <Text style={styles.chatHeaderStatus}>En línea</Text>
                  </View>
                </View>
                <View style={styles.chatHeaderActions}>
                  <TouchableOpacity style={styles.chatHeaderAction}>
                    <Phone color={Colors.light.primary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.chatHeaderAction}>
                    <Video color={Colors.light.primary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.chatHeaderAction}>
                    <MoreVertical color={Colors.light.textSecondary} size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Messages */}
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                showsVerticalScrollIndicator={false}
              />

              {/* Message Input */}
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.messageInputContainer}
              >
                <View style={styles.messageInputRow}>
                  <TouchableOpacity style={styles.attachButton}>
                    <Paperclip color={Colors.light.textSecondary} size={20} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Escribe un mensaje..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={1000}
                    placeholderTextColor={Colors.light.textSecondary}
                  />
                  <TouchableOpacity style={styles.micButton}>
                    <Mic color={Colors.light.textSecondary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendButton, messageText.trim() && styles.sendButtonActive]}
                    onPress={sendMessage}
                    disabled={!messageText.trim()}
                  >
                    <Send color={messageText.trim() ? Colors.light.surface : Colors.light.textSecondary} size={18} />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </>
          ) : (
            <View style={styles.noChatSelected}>
              <Text style={styles.noChatSelectedText}>
                Selecciona una conversación para comenzar
              </Text>
            </View>
          )}
        </View>

        {/* Patient Info Sidebar */}
        {activeConversation && (
          <View style={styles.patientInfoSidebar}>
            {renderPatientInfo()}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  chatContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  conversationsList: {
    width: 320,
    backgroundColor: Colors.light.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  conversationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  conversationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.text,
  },
  conversationsListContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  conversationItemActive: {
    backgroundColor: Colors.light.primary + '10',
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationAvatarText: {
    color: Colors.light.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationLastMessage: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.light.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: Colors.light.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChatSelectedText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: Colors.light.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: Colors.light.success,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  chatHeaderAction: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageFromPatient: {
    alignItems: 'flex-start',
  },
  messageFromClinic: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  messageBubblePatient: {
    backgroundColor: Colors.light.surface,
    borderBottomLeftRadius: 4,
  },
  messageBubbleClinic: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextPatient: {
    color: Colors.light.text,
  },
  messageTextClinic: {
    color: Colors.light.surface,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  messageTimePatient: {
    color: Colors.light.textSecondary,
  },
  messageTimeClinic: {
    color: Colors.light.surface + 'CC',
  },
  messageInputContainer: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  messageInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: Colors.light.text,
  },
  micButton: {
    padding: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  patientInfoSidebar: {
    width: 280,
    backgroundColor: Colors.light.surface,
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.border,
  },
  patientInfo: {
    padding: 16,
  },
  patientHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  patientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientAvatarText: {
    color: Colors.light.surface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientDetails: {
    alignItems: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  patientPhone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  patientStats: {
    marginBottom: 20,
  },
  patientStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientStatText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  recentAppointments: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  recentAppointmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  noAppointments: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  appointmentItem: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  appointmentTreatment: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPermissionText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});