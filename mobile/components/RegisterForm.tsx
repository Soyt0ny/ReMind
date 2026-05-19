import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { api } from './services/api';
import { THEME } from '../constants/Theme';

export default function RegisterForm() {
  const [permission, requestPermission] = useCameraPermissions();
  const [name, setName]               = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone]             = useState('');
  const [extra, setExtra]             = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [cameraRef, setCameraRef]     = useState<CameraView | null>(null);
  const [photoReady, setPhotoReady]   = useState(false);
  const [facing, setFacing]           = useState<'back' | 'front'>('front');
  const [loading, setLoading]         = useState(false);

  async function capturarFoto() {
    if (!cameraRef) return;
    const foto = await cameraRef.takePictureAsync({ base64: true, quality: 0.7 });
    if (foto.base64) {
      setImageBase64(foto.base64);
      setPhotoReady(true);
    }
  }

  async function guardar() {
    if (!name.trim() || !relationship.trim() || !imageBase64) {
      Alert.alert('Faltan datos', 'Completa el nombre, parentesco y toma una foto.');
      return;
    }
    setLoading(true);
    try {
      await api.register({
        name:         name.trim(),
        relationship: relationship.trim(),
        image:        imageBase64,
        phone:        phone.trim() || undefined,
        extra:        extra.trim() || undefined,
      });
      Alert.alert('Guardado', `${name} ha sido registrado en ReMind.`);
      setName('');
      setRelationship('');
      setPhone('');
      setExtra('');
      setImageBase64(null);
      setPhotoReady(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verifica la conexion con el servidor.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Ionicons name="camera-outline" size={48} color={THEME.colors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={styles.permissionText}>
          Necesitamos acceso a la camara para tomar la foto del familiar.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Dar permiso de camara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Nombre */}
        <Text style={styles.label}>Nombre completo *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Juan Perez"
          placeholderTextColor={THEME.colors.textLight}
          returnKeyType="next"
          autoCapitalize="words"
        />

        {/* Parentesco */}
        <Text style={styles.label}>Parentesco *</Text>
        <TextInput
          style={styles.input}
          value={relationship}
          onChangeText={setRelationship}
          placeholder="Ej. Hijo, Doctor, Vecino"
          placeholderTextColor={THEME.colors.textLight}
          returnKeyType="next"
          autoCapitalize="words"
        />

        {/* Telefono */}
        <Text style={styles.label}>Telefono (opcional)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Ej. +54 9 11 1234 5678"
          placeholderTextColor={THEME.colors.textLight}
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        {/* Caracteristicas */}
        <Text style={styles.label}>Datos utiles (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={extra}
          onChangeText={setExtra}
          placeholder="Ej. Usa lentes, siempre trae gorra, tiene barba..."
          placeholderTextColor={THEME.colors.textLight}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Foto */}
        <Text style={styles.label}>Foto de referencia *</Text>
        <View style={styles.cameraBox}>
          {!photoReady ? (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing={facing}
                ref={ref => setCameraRef(ref as CameraView | null)}
              />
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
              >
                <Ionicons name="camera-reverse" size={22} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.photoReady}>
              <Ionicons name="checkmark-circle" size={48} color="white" style={{ marginBottom: 8 }} />
              <Text style={styles.photoReadyText}>Foto lista</Text>
            </View>
          )}
        </View>

        {!photoReady ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={capturarFoto}>
            <Ionicons name="camera" size={20} color={THEME.colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Tomar foto</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: THEME.colors.textMuted }]}
            onPress={() => setPhotoReady(false)}
          >
            <Ionicons name="refresh" size={20} color={THEME.colors.textMuted} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryButtonText, { color: THEME.colors.textMuted }]}>
              Repetir foto
            </Text>
          </TouchableOpacity>
        )}

        {/* Boton guardar */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={guardar}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Guardando...' : 'Guardar en ReMind'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  label: {
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  input: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
  },
  textArea: {
    height: 88,
    textAlignVertical: 'top',
  },
  cameraBox: {
    height: 260,
    backgroundColor: '#1a1a1a',
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    marginBottom: THEME.spacing.sm,
  },
  flipButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: THEME.colors.overlay,
    padding: 10,
    borderRadius: THEME.radius.full,
  },
  photoReady: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.success,
  },
  photoReadyText: {
    color: 'white',
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.text,
    borderRadius: THEME.radius.md,
    paddingVertical: 13,
    marginBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.card,
  },
  secondaryButtonText: {
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.text,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
    backgroundColor: THEME.colors.background,
  },
  permissionText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: THEME.spacing.xl,
  },
});
