import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert, RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api, type Person } from '../../components/services/api';
import { DESIGN_SYSTEM } from '../../constants/DesignSystem';
import EditPersonForm from '../../components/EditPersonForm';

export default function ContactsScreen() {
  const [people, setPeople]         = useState<Person[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Password Verification State
  const [showPassModal, setShowPassModal] = useState(false);
  const [password, setPassword]           = useState('');
  const [pendingAction, setPendingAction] = useState<{type: 'delete' | 'edit' | 'add', person: Person | null} | null>(null);
  const [verifying, setVerifying]         = useState(false);

  // Edit State
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  async function loadAll() {
    try {
      const persons = await api.getPeople();
      setPeople(persons);
    } catch {
      // silent
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  const filteredPeople = useMemo(() => {
    return people.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.relationship.toLowerCase().includes(search.toLowerCase())
    );
  }, [people, search]);

  const paginatedPeople = useMemo(() => {
    return filteredPeople.slice(0, page * PAGE_SIZE);
  }, [filteredPeople, page]);

  const handleActionRequest = (type: 'delete' | 'edit', person: Person) => {
    setPendingAction({ type, person });
    setShowPassModal(true);
    setPassword('');
  };

  const handleAddRequest = () => {
    setPendingAction({ type: 'add', person: null });
    setShowPassModal(true);
    setPassword('');
  };

  const confirmAction = async () => {
    const trimmedPass = password.trim();
    if (!trimmedPass) return;
    
    setVerifying(true);
    try {
      const res = await api.verifyPassword(trimmedPass);
      if (res && res.ok) {
        setShowPassModal(false);
        if (pendingAction?.type === 'delete' && pendingAction.person) {
          await executeDelete(pendingAction.person);
        } else if (pendingAction?.type === 'edit' && pendingAction.person) {
          setEditingPerson(pendingAction.person);
        } else if (pendingAction?.type === 'add') {
          router.push('/register');
        }
        setPendingAction(null);
      } else {
        Alert.alert("Error", "Contraseña incorrecta.");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
         Alert.alert("Error", "Contraseña incorrecta.");
      } else {
         Alert.alert("Error", "No se pudo verificar la contraseña.");
      }
    } finally {
      setVerifying(false);
    }
  };

  async function executeDelete(person: Person) {
    try {
      await api.deletePerson(person.id);
      setPeople(prev => prev.filter(p => p.id !== person.id));
      Alert.alert("Eliminado", `${person.name} ha sido eliminado.`);
    } catch {
      Alert.alert("Error", "No se pudo eliminar el contacto.");
    }
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const getBadgeStyle = (rel: string) => {
    const r = rel.toLowerCase();
    if (r.includes("hij")) return { bg: "#E0F2FE", text: "#0369A1" };
    if (r.includes("médic") || r.includes("doctor")) return { bg: "#DCFCE7", text: "#15803D" };
    if (r.includes("niet")) return { bg: "#FCE7F3", text: "#BE185D" };
    if (r.includes("cuidador")) return { bg: "#E0F7FA", text: "#006064" };
    if (r.includes("esposo") || r.includes("esposa")) return { bg: "#F3E8FF", text: "#7E22CE" };
    if (r.includes("amigo") || r.includes("amiga")) return { bg: "#FFEDD5", text: "#C2410C" };
    return { bg: "#E0F2FE", text: "#0369A1" };
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Personas Conocidas</Text>
          <Text style={styles.headerSub}>Reconoce a tus seres queridos</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddRequest}>
          <Ionicons name="add" size={28} color={DESIGN_SYSTEM.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar nombre..."
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={paginatedPeople}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => {
          if (paginatedPeople.length < filteredPeople.length) {
            setPage(p => p + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          const badge = getBadgeStyle(item.relationship);
          return (
            <View style={styles.card}>
              <View style={styles.photoContainer}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.photo} />
                ) : (
                  <Text style={styles.initialText}>{getInitial(item.name)}</Text>
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                   <Text style={[styles.badgeText, { color: badge.text }]}>{item.relationship}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleActionRequest('edit', item)} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleActionRequest('delete', item)} style={[styles.actionBtn, styles.deleteBtn]}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyText}>
              {search ? "No se encontraron resultados" : "Aún no hay personas registradas"}
            </Text>
          </View>
        }
      />

      {/* Password Modal */}
      <Modal visible={showPassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.passContent}>
            <View style={styles.passIconBox}>
              <Ionicons name="lock-closed-outline" size={32} color={DESIGN_SYSTEM.colors.primary} />
            </View>
            <Text style={styles.passTitle}>Verificación requerida</Text>
            <Text style={styles.passSub}>Ingresá tu contraseña para continuar.</Text>
            
            <TextInput
              style={styles.passInput}
              secureTextEntry
              placeholder="Tu contraseña"
              value={password}
              onChangeText={setPassword}
              autoFocus
            />

            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: password.trim() ? DESIGN_SYSTEM.colors.primary : '#B2D7FF' }]} 
              onPress={confirmAction}
              disabled={verifying || !password.trim()}
            >
              {verifying ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>Confirmar</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowPassModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Person Modal */}
      <Modal visible={editingPerson !== null} animationType="slide">
        {editingPerson && (
           <EditPersonForm 
             person={editingPerson} 
             onSaved={() => { setEditingPerson(null); loadAll(); }}
             onCancel={() => setEditingPerson(null)}
           />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: DESIGN_SYSTEM.colors.foreground },
  headerSub: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center' },
  
  searchContainer: {
    marginHorizontal: 24, marginTop: 20, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: DESIGN_SYSTEM.colors.foreground, height: '100%' },

  list: { padding: 24, paddingBottom: 100 },
  card: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    padding: 16, borderRadius: 24, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6', ...DESIGN_SYSTEM.shadows.sm
  },
  photoContainer: { 
    width: 56, height: 56, borderRadius: 28, 
    backgroundColor: '#F0F7FF', overflow: 'hidden', 
    alignItems: 'center', justifyContent: 'center' 
  },
  photo: { width: '100%', height: '100%' },
  initialText: { fontSize: 20, fontWeight: '800', color: DESIGN_SYSTEM.colors.primary },
  info: { flex: 1, marginLeft: 16 },
  name: { fontSize: 16, fontWeight: '800', color: DESIGN_SYSTEM.colors.foreground },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginTop: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { },
  
  empty: { alignItems: 'center', marginTop: 60, gap: 16 },
  emptyText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  passContent: { backgroundColor: 'white', borderRadius: 32, padding: 32, width: '100%', alignItems: 'center', ...DESIGN_SYSTEM.shadows.md },
  passIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  passTitle: { fontSize: 22, fontWeight: '900', color: DESIGN_SYSTEM.colors.foreground, marginBottom: 8 },
  passSub: { fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
  passInput: { width: '100%', height: 56, borderWidth: 2, borderColor: DESIGN_SYSTEM.colors.primary, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 24 },
  confirmBtn: { width: '100%', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: 'white', fontSize: 16, fontWeight: '800' },
  cancelBtn: { marginTop: 20 },
  cancelText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' }
});
