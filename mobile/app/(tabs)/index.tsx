import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Image, Alert, Linking, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api, type Person } from '../../components/services/api';
import { DESIGN_SYSTEM } from '../../constants/DesignSystem';

interface EmergencyContact {
  name:  string;
  phone: string;
}

interface RecentItem {
  name: string;
  relationship: string;
  photo?: string;
  timestamp: number;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos Días";
  if (h < 18) return "Buenas Tardes";
  return "Buenas Noches";
}

export default function HomeScreen() {
  const [recents, setRecents]       = useState<RecentItem[]>([]);
  const [emergency, setEmergency]   = useState<EmergencyContact | null>(null);
  const [userName, setUserName]     = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      // 1. Cargar datos locales
      const [recentRaw, displayName] = await Promise.all([
        AsyncStorage.getItem('recent_identifications'),
        AsyncStorage.getItem('user_display_name'),
      ]);
      
      if (recentRaw) {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setRecents((JSON.parse(recentRaw) as RecentItem[]).filter(r => r.timestamp > cutoff));
      }
      if (displayName) setUserName(displayName);

      // 2. Cargar contacto de emergencia desde el Servidor (Fuente de verdad)
      const people = await api.getPeople();
      const emergencyPerson = people.find((p: Person) => p.is_emergency && p.phone);
      
      if (emergencyPerson) {
        setEmergency({ name: emergencyPerson.name, phone: emergencyPerson.phone! });
      } else {
        setEmergency(null);
      }
    } catch (err) {
      console.error("[Home] Error cargando datos:", err);
    }
  }

  async function cerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['auth_token', 'user_display_name', 'recent_identifications']);
          setEmergency(null);
          router.replace('/login');
        },
      },
    ]);
  }

  function formatTime(timestamp: number) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ReMind</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={cerrarSesion}>
            <Ionicons name="log-out-outline" size={24} color="#111418" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{userName || 'bienvenido'}</Text>
            <Text style={styles.greetingSub}>¿Listo para reconocer a alguien?</Text>
          </View>

          {/* Identify Button */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push('/identify')}
            style={styles.identifyBtn}
          >
            <View style={styles.iconCircle}>
               <Ionicons name="happy-outline" size={64} color="white" />
            </View>
            <Text style={styles.identifyText}>Identificar Persona</Text>
            <Text style={styles.identifySubText}>Toca aquí para escanear una cara</Text>
          </TouchableOpacity>

          {/* Recents Section */}
          {recents.length > 0 && (
            <View style={styles.recentsSection}>
              <View style={styles.recentsHeader}>
                <Text style={styles.recentsTitle}>Identificados Recientemente</Text>
                <TouchableOpacity onPress={() => setShowHistory(true)}>
                  <Text style={styles.seeAll}>Ver todos</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recentsGrid}>
                {recents.slice(0, 2).map((item, i) => (
                  <View key={i} style={styles.recentCard}>
                    <View style={styles.recentPhotoBox}>
                      {item.photo ? (
                        <Image source={{ uri: item.photo }} style={styles.recentPhoto} />
                      ) : (
                        <Ionicons name="person" size={32} color="#9CA3AF" />
                      )}
                    </View>
                    <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.recentRel}>{item.relationship}</Text>
                    <Text style={styles.recentTime}>{formatTime(item.timestamp!)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Emergency Button (Exact Web Style) */}
          <View style={[styles.emergencyShadowBox, emergency && DESIGN_SYSTEM.shadows.md]}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.emergencyBtn, emergency ? styles.emergencyBtnActive : styles.emergencyBtnInactive]} 
              onPress={() => {
                if (emergency) {
                  Linking.openURL(`tel:${emergency.phone}`);
                } else {
                  Alert.alert("Aviso", "No tienes un contacto de emergencia configurado. Hazlo editando un contacto.");
                }
              }}
            >
              <Ionicons name="medical" size={28} color={emergency ? "white" : "#F87171"} />
              <Text style={emergency ? styles.emergencyBtnText : styles.emergencyBtnTextInactive}>
                Llamada de Emergencia
              </Text>
            </TouchableOpacity>
          </View>
          {!emergency && (
            <Text style={styles.emergencyHint}>Configurá un contacto de emergencia en Contactos</Text>
          )}
        </ScrollView>

        {/* History Modal */}
        <Modal
          visible={showHistory}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Historial de Identificaciones</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Ionicons name="close" size={28} color="#111418" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={recents}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.historyRow}>
                    <View style={styles.historyPhotoBoxSmall}>
                      {item.photo ? (
                        <Image source={{ uri: item.photo }} style={styles.historyPhoto} />
                      ) : (
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName}>{item.name}</Text>
                      <Text style={styles.historyRel}>{item.relationship}</Text>
                    </View>
                    <Text style={styles.historyTime}>{formatTime(item.timestamp!)}</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    height: 60, backgroundColor: 'white', 
    flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' 
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111418' },
  settingsBtn: { position: 'absolute', right: 20 },
  greetingSection: { padding: 24, paddingTop: 32 },
  greetingTitle: { fontSize: 32, fontWeight: '900', color: '#111418' },
  greetingName: { fontSize: 32, fontWeight: '900', color: '#137fec' },
  greetingSub: { fontSize: 18, color: '#6B7280', fontWeight: '500', marginTop: 4 },
  identifyBtn: {
    marginHorizontal: 24, backgroundColor: '#137fec', 
    borderRadius: 32, paddingVertical: 48, alignItems: 'center',
    shadowColor: '#137fec', shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', justifyContent: 'center', marginBottom: 20
  },
  identifyText: { fontSize: 28, fontWeight: '900', color: 'white' },
  identifySubText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  recentsSection: { paddingHorizontal: 24, marginTop: 32 },
  recentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  recentsTitle: { fontSize: 20, fontWeight: '800', color: '#111418' },
  seeAll: { fontSize: 14, fontWeight: '700', color: '#137fec' },
  recentsGrid: { flexDirection: 'row', gap: 16 },
  recentCard: { 
    flex: 1, backgroundColor: 'white', borderRadius: 24, 
    padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' 
  },
  recentPhotoBox: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#F3F4F6', marginBottom: 12, 
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#f0f7ff'
  },
  recentPhoto: { width: '100%', height: '100%' },
  recentName: { fontSize: 16, fontWeight: '800', color: '#111418' },
  recentRel: { fontSize: 14, fontWeight: '700', color: '#137fec', marginTop: 2 },
  recentTime: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 6 },
  emergencyShadowBox: {
    marginHorizontal: 24,
    marginTop: 32,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  emergencyBtn: {
    paddingVertical: 20, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
    borderRadius: 24,
    overflow: 'hidden', // Corta las esquinas blancas dentro del radio
  },
  emergencyBtnActive: {
    backgroundColor: '#DC2626',
  },
  emergencyBtnInactive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyBtnText: { color: 'white', fontSize: 22, fontWeight: '900' },
  emergencyBtnTextInactive: { color: '#F87171', fontSize: 22, fontWeight: '900' },
  emergencyHint: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' },
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' 
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111418' },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
  historyPhotoBoxSmall: { 
    width: 56, height: 56, borderRadius: 28, 
    backgroundColor: '#F3F4F6', overflow: 'hidden', 
    alignItems: 'center', justifyContent: 'center' 
  },
  historyPhoto: { width: '100%', height: '100%' },
  historyName: { fontSize: 16, fontWeight: '700', color: '#111418' },
  historyRel: { fontSize: 14, color: '#137fec', fontWeight: '600' },
  historyTime: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
});
