import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api, type Person } from '../../components/services/api';
import { THEME } from '../../constants/Theme';

interface EmergencyContact {
  id:    number;
  name:  string;
  phone: string;
}

export default function ContactsScreen() {
  const [people, setPeople]         = useState<Person[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyId, setEmergencyId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  async function loadAll() {
    try {
      const [persons, emergencyRaw] = await Promise.all([
        api.getPeople(),
        AsyncStorage.getItem('emergency_contact'),
      ]);
      setPeople(persons);
      if (emergencyRaw) {
        const ec: EmergencyContact = JSON.parse(emergencyRaw);
        setEmergencyId(ec.id);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar la lista. Verifica la conexion con el servidor.');
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  async function setEmergency(person: Person) {
    if (!person.phone) {
      Alert.alert(
        'Sin telefono',
        `${person.name} no tiene un telefono registrado. Registralo de nuevo incluyendo el numero.`,
      );
      return;
    }
    const contact: EmergencyContact = { id: person.id, name: person.name, phone: person.phone };
    await AsyncStorage.setItem('emergency_contact', JSON.stringify(contact));
    setEmergencyId(person.id);
    Alert.alert('Listo', `${person.name} es ahora el contacto de emergencia.`);
  }

  async function confirmDelete(person: Person) {
    Alert.alert(
      'Eliminar contacto',
      `Vas a eliminar a ${person.name}. Esta accion no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePerson(person.id);
              if (emergencyId === person.id) {
                await AsyncStorage.removeItem('emergency_contact');
                setEmergencyId(null);
              }
              setPeople(prev => prev.filter(p => p.id !== person.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el contacto.');
            }
          },
        },
      ],
    );
  }

  function renderPerson({ item }: { item: Person }) {
    const isEmergency = item.id === emergencyId;
    return (
      <View style={styles.card}>
        {/* Foto */}
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="person" size={32} color={THEME.colors.textLight} />
          </View>
        )}

        {/* Informacion */}
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.relationship}>{item.relationship}</Text>
          {item.age != null && (
            <Text style={styles.detail}>{item.age} anos</Text>
          )}
          {item.extra ? (
            <Text style={styles.extra} numberOfLines={2}>{item.extra}</Text>
          ) : null}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, isEmergency && styles.actionBtnActive]}
            onPress={() => setEmergency(item)}
          >
            <Ionicons
              name={isEmergency ? 'star' : 'star-outline'}
              size={22}
              color={isEmergency ? THEME.colors.primary : THEME.colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons name="trash-outline" size={22} color={THEME.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Mis Contactos</Text>
        <Text style={styles.subtitle}>
          {people.length === 0
            ? 'No hay contactos registrados aun.'
            : `${people.length} persona${people.length !== 1 ? 's' : ''} registrada${people.length !== 1 ? 's' : ''}`}
        </Text>

        <FlatList
          data={people}
          keyExtractor={item => String(item.id)}
          renderItem={renderPerson}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={THEME.colors.border} />
              <Text style={styles.emptyText}>
                Usa la pestana "Agregar" para registrar a un familiar.
              </Text>
            </View>
          }
        />
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
    paddingTop: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: THEME.fontWeight.black,
    color: THEME.colors.text,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textMuted,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  list: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: THEME.spacing.md,
  },
  photoPlaceholder: {
    backgroundColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.text,
  },
  relationship: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.primary,
    fontWeight: THEME.fontWeight.medium,
    marginTop: 2,
  },
  detail: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  extra: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'column',
    gap: THEME.spacing.sm,
  },
  actionBtn: {
    padding: 8,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#EBF5FF',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  empty: {
    alignItems: 'center',
    paddingTop: THEME.spacing.xxl,
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    marginTop: THEME.spacing.md,
  },
});
