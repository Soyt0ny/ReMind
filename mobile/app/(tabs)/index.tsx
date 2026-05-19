import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Image, Alert, Linking, SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../constants/Theme';
import { setApiToken } from '../../components/services/api';
import type { IdentifyResult } from '../../components/services/api';

interface EmergencyContact {
  id:    number;
  name:  string;
  phone: string;
}

interface RecentItem extends IdentifyResult {
  timestamp: number;
}

export default function HomeScreen() {
  const [recents, setRecents]       = useState<RecentItem[]>([]);
  const [emergency, setEmergency]   = useState<EmergencyContact | null>(null);
  const [userName, setUserName]     = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.replace('/login');
        return;
      }
      const [recentRaw, emergencyRaw, displayName] = await Promise.all([
        AsyncStorage.getItem('recent_identifications'),
        AsyncStorage.getItem('emergency_contact'),
        AsyncStorage.getItem('user_display_name'),
      ]);
      if (recentRaw)    setRecents(JSON.parse(recentRaw).slice(0, 5));
      if (emergencyRaw) setEmergency(JSON.parse(emergencyRaw));
      if (displayName)  setUserName(displayName);
    } catch { /* silent */ }
  }

  async function cerrarSesion() {
    Alert.alert('Cerrar sesion', '¿Seguro que queres cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesion',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['auth_token', 'user_display_name', 'recent_identifications', 'emergency_contact']);
          setApiToken(null);
          router.replace('/login');
        },
      },
    ]);
  }

  function llamarEmergencia() {
    if (!emergency) {
      Alert.alert(
        'Sin contacto de emergencia',
        'Anda a Contactos, abre el detalle de una persona y marcala como emergencia.',
      );
      return;
    }
    Linking.openURL(`tel:${emergency.phone}`);
  }

  function formatTime(timestamp: number) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerTitle}>ReMind</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity style={styles.settingsButton} onPress={cerrarSesion}>
              <Ionicons name="log-out-outline" size={24} color={THEME.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Saludo */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            {userName ? `Hola, ${userName}` : 'Hola'}
          </Text>
          <Text style={styles.greetingName}>bienvenido a ReMind</Text>
        </View>

        {/* Boton principal: Identificar */}
        <TouchableOpacity
          style={styles.identifyButton}
          onPress={() => router.push('/identify')}
          activeOpacity={0.85}
        >
          <View style={styles.identifyIconBox}>
            <Ionicons name="scan" size={72} color="white" />
          </View>
          <Text style={styles.identifyTitle}>Identificar Persona</Text>
          <Text style={styles.identifySubtitle}>Toca aqui para usar la camara</Text>
        </TouchableOpacity>

        {/* Recientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificados Recientemente</Text>
          {recents.length === 0 ? (
            <Text style={styles.emptyText}>
              Aun no hay identificaciones. Usa el boton de arriba para empezar.
            </Text>
          ) : (
            <FlatList
              data={recents}
              keyExtractor={(_, i) => String(i)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.recentRow}>
                  {item.photo ? (
                    <Image source={{ uri: item.photo }} style={styles.recentPhoto} />
                  ) : (
                    <View style={[styles.recentPhoto, styles.recentPhotoPlaceholder]}>
                      <Ionicons name="person" size={24} color={THEME.colors.textLight} />
                    </View>
                  )}
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{item.name}</Text>
                    <Text style={styles.recentRelationship}>{item.relationship}</Text>
                  </View>
                  <Text style={styles.recentTime}>{formatTime(item.timestamp!)}</Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Boton de emergencia */}
        <TouchableOpacity style={styles.emergencyButton} onPress={llamarEmergencia}>
          <Ionicons name="call" size={22} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.emergencyText}>
            {emergency ? `Llamar a ${emergency.name}` : 'Llamar Emergencia'}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  headerTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: THEME.fontWeight.black,
    color: THEME.colors.text,
    letterSpacing: 0.5,
  },
  settingsButton: {
    padding: 6,
  },
  greeting: {
    marginBottom: THEME.spacing.lg,
  },
  greetingText: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.text,
  },
  greetingName: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.textMuted,
    fontWeight: THEME.fontWeight.medium,
    marginTop: 2,
  },
  identifyButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.xl,
    paddingVertical: THEME.spacing.xl,
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  identifyIconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 60,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  identifyTitle: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: THEME.fontWeight.black,
    color: 'white',
    marginBottom: 4,
  },
  identifySubtitle: {
    fontSize: THEME.fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: THEME.fontWeight.medium,
  },
  section: {
    flex: 1,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  emptyText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textMuted,
    lineHeight: 24,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  recentPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: THEME.spacing.md,
  },
  recentPhotoPlaceholder: {
    backgroundColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.text,
  },
  recentRelationship: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.primary,
    fontWeight: THEME.fontWeight.medium,
    marginTop: 2,
  },
  recentTime: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textLight,
  },
  emergencyButton: {
    backgroundColor: THEME.colors.danger,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.radius.lg,
    paddingVertical: THEME.spacing.md + 2,
    shadowColor: THEME.colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emergencyText: {
    color: 'white',
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
  },
});
