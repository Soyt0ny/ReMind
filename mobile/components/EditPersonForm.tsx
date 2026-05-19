import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Image, Modal, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api, type Person } from './services/api';
import { DESIGN_SYSTEM } from '../constants/DesignSystem';

const RELATIONSHIPS = [
  "Esposo / Esposa", "Hijo / Hija", "Nieto / Nieta", 
  "Amigo / Amiga", "Cuidador / Cuidadora", "Médico", 
  "Vecino / Vecina", "Otro",
];

interface EditPersonFormProps {
  person: Person;
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditPersonForm({ person, onSaved, onCancel }: EditPersonFormProps) {
  const [name, setName]               = useState(person.name);
  const [relationship, setRelationship] = useState(person.relationship);
  const [age, setAge]                 = useState(person.age?.toString() ?? '');
  const [phone, setPhone]             = useState(person.phone ?? '');
  const [extra, setExtra]             = useState(person.extra ?? '');
  const [isEmergency, setIsEmergency] = useState(person.is_emergency ?? false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [showRelPicker, setShowRelRelPicker] = useState(false);

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  async function guardar() {
    if (!name.trim() || !relationship.trim()) {
      Alert.alert('Faltan datos', 'Completa el nombre y la relación.');
      return;
    }
    setLoading(true);
    try {
      await api.updatePerson(person.id, {
        name: name.trim(),
        relationship: relationship.trim(),
        image: imageBase64 || undefined,
        age: age ? Number(age) : undefined,
        phone: phone.trim() || undefined,
        extra: extra.trim() || undefined,
        is_emergency: isEmergency,
      });
      Alert.alert('Éxito', `${name} actualizado correctamente.`);
      onSaved();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar los cambios.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
                <Ionicons name="chevron-back" size={24} color="#111418" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar persona</Text>
            <View style={{ width: 24 }} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="ej. Juan Pérez"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Relación</Text>
          <TouchableOpacity 
            style={styles.inputWrapper} 
            onPress={() => setShowRelRelPicker(true)}
          >
            <Ionicons name="people-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <Text style={[styles.inputText, !relationship && { color: '#9CA3AF' }]}>
              {relationship || "Seleccionar relación"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Edad (opcional)</Text>
          <View style={styles.inputWrapper}>
             <TextInput
               style={styles.input}
               placeholder="ej. 72"
               keyboardType="numeric"
               value={age}
               onChangeText={setAge}
             />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Teléfono (opcional)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="ej. +54 9 11..."
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setIsEmergency(!isEmergency)}
          style={[styles.emergencyBox, isEmergency && styles.emergencyBoxActive]}
        >
          <View style={styles.emergencyLeft}>
            <Ionicons name="alert-circle-outline" size={24} color={isEmergency ? "#EF4444" : "#9CA3AF"} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.emergencyLabel, isEmergency && { color: "#B91C1C" }]}>Contacto de emergencia</Text>
              <Text style={styles.emergencySub}>Aparecerá en el botón de ayuda rápida</Text>
            </View>
          </View>
          <View style={[styles.switch, isEmergency && styles.switchActive]}>
            <View style={[styles.switchCircle, isEmergency && styles.switchCircleActive]} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.mainTitle, { marginTop: 32 }]}>Foto</Text>
        <Text style={styles.photoHint}>Tomá una nueva foto o mantené la actual.</Text>

        <View style={styles.previewContainer}>
          <Image source={{ uri: imageBase64 || person.photo }} style={styles.previewImage} />
          {imageBase64 && (
             <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Nueva foto</Text>
             </View>
          )}
        </View>

        <View style={styles.photoActions}>
            <TouchableOpacity style={styles.retryBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={20} color="#6B7280" />
              <Text style={styles.retryText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="#6B7280" />
              <Text style={styles.retryText}>Subir foto</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, (loading || !name || !relationship) && styles.saveBtnDisabled]}
          onPress={guardar}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Relationship Picker Modal */}
      <Modal visible={showRelPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Seleccionar relación</Text>
              <TouchableOpacity onPress={() => setShowRelRelPicker(false)}>
                <Ionicons name="close" size={28} color="#111418" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={RELATIONSHIPS}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem} 
                  onPress={() => { setRelationship(item); setShowRelRelPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, relationship === item && { color: '#137fec', fontWeight: '800' }]}>{item}</Text>
                  {relationship === item && <Ionicons name="checkmark" size={20} color="#137fec" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'white' },
  content: { padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111418' },
  mainTitle: { fontSize: 24, fontWeight: '900', color: '#111418', marginBottom: 12 },
  field: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#111418', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#111418', height: '100%' },
  inputText: { fontSize: 16, color: '#111418' },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  emergencyBoxActive: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center' },
  emergencyLabel: { fontSize: 16, fontWeight: '700', color: '#111418' },
  emergencySub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  switch: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', padding: 2 },
  switchActive: { backgroundColor: '#EF4444' },
  switchCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
  switchCircleActive: { alignSelf: 'flex-end' },
  photoHint: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  previewContainer: { marginBottom: 16, height: 240, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#E5E7EB' },
  previewImage: { width: '100%', height: '100%' },
  newBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  newBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  photoActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  retryBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  retryText: { color: '#6B7280', fontWeight: '600' },
  saveBtn: { 
    height: 64, backgroundColor: '#137fec', borderRadius: 12, 
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
    ...DESIGN_SYSTEM.shadows.md
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: 'white', fontSize: 20, fontWeight: '900' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '60%' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  pickerTitle: { fontSize: 20, fontWeight: '800', color: '#111418' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerItemText: { fontSize: 16, color: '#111418', fontWeight: '600' },
});
