import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setApiToken } from '../components/services/api';
import { THEME } from '../constants/Theme';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode]           = useState<Mode>('login');
  const [email, setEmail]         = useState('');
  const [name, setName]           = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);

  async function submit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Completa el correo y la contrasena.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      Alert.alert('Faltan datos', 'Completa tu nombre.');
      return;
    }

    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.authLogin(email.trim(), password)
        : await api.authRegister(email.trim(), name.trim(), password);

      await AsyncStorage.setItem('auth_token', res.access_token);
      await AsyncStorage.setItem('user_display_name', res.display_name);
      setApiToken(res.access_token);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      let msg = 'Verifica la conexion con el servidor.';
      try {
        const parsed = JSON.parse(raw);
        msg = parsed?.detail ?? raw;
      } catch {
        if (raw && raw !== 'UNAUTHORIZED') msg = raw;
      }
      Alert.alert(mode === 'login' ? 'Error al ingresar' : 'Error al crear cuenta', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoBox}>
            <Text style={styles.logo}>ReMind</Text>
            <Text style={styles.tagline}>Asistente Visual de Memoria</Text>
          </View>

          {/* Selector de modo */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                Ingresar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>
                Crear cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {mode === 'register' && (
              <>
                <Text style={styles.label}>Tu nombre</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej. Maria Garcia"
                  placeholderTextColor={THEME.colors.textLight}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </>
            )}

            <Text style={styles.label}>Correo electronico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={THEME.colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={styles.label}>Contrasena</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'register' ? 'Minimo 6 caracteres' : 'Tu contrasena'}
              placeholderTextColor={THEME.colors.textLight}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading
                  ? 'Cargando...'
                  : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {mode === 'login'
              ? 'Cada cuenta tiene sus propios contactos registrados.'
              : 'Crea una cuenta para guardar a tus familiares.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flexGrow: 1,
    padding: THEME.spacing.xl,
    justifyContent: 'center',
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xxl,
  },
  logo: {
    fontSize: 48,
    fontWeight: THEME.fontWeight.black,
    color: THEME.colors.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    padding: 4,
    marginBottom: THEME.spacing.xl,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: THEME.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.medium,
    color: THEME.colors.textMuted,
  },
  modeBtnTextActive: {
    color: THEME.colors.text,
    fontWeight: THEME.fontWeight.bold,
  },
  form: {
    gap: 0,
  },
  label: {
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  input: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    marginBottom: 4,
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: 'white',
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
  },
  hint: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: THEME.spacing.xl,
    lineHeight: 20,
  },
});
