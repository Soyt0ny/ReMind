import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api, type IdentifyResult } from '../components/services/api';
import { THEME } from '../constants/Theme';

const SCAN_INTERVAL_MS  = 1500;
const HOLD_DURATION_MS  = 5000;

export default function IdentifyScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult]             = useState<IdentifyResult | null>(null);
  const [isUnknown, setIsUnknown]       = useState(false);
  const [scanning, setScanning]         = useState(false);

  const cameraRef       = useRef<CameraView>(null);
  const isProcessingRef = useRef(false);
  const lastKnownTimeRef = useRef<number>(0);
  const lastSavedNameRef = useRef<string>('');

  const saveRecent = useCallback(async (person: IdentifyResult) => {
    if (person.name === lastSavedNameRef.current) return;
    lastSavedNameRef.current = person.name;
    try {
      const raw      = await AsyncStorage.getItem('recent_identifications');
      const existing: IdentifyResult[] = raw ? JSON.parse(raw) : [];
      const updated  = [
        { ...person, timestamp: Date.now() },
        ...existing.filter(r => r.name !== person.name).slice(0, 9),
      ];
      await AsyncStorage.setItem('recent_identifications', JSON.stringify(updated));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!permission?.granted) return;

    setScanning(true);
    const interval = setInterval(async () => {
      if (!cameraRef.current || isProcessingRef.current) return;
      isProcessingRef.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64:  true,
          quality: 0.4,
        });
        if (!photo.base64) return;

        const identified = await api.identify(photo.base64);

        if (identified.name !== 'desconocido') {
          lastKnownTimeRef.current = Date.now();
          setResult(identified);
          setIsUnknown(false);
          saveRecent(identified);
        } else {
          const elapsed = Date.now() - lastKnownTimeRef.current;
          if (elapsed > HOLD_DURATION_MS) {
            setResult(null);
            setIsUnknown(true);
          }
        }
      } catch { /* silent on connection errors */ }
      finally {
        isProcessingRef.current = false;
      }
    }, SCAN_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      setScanning(false);
    };
  }, [permission?.granted, saveRecent]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={64} color={THEME.colors.textMuted} style={{ marginBottom: 20 }} />
        <Text style={styles.permissionText}>
          Necesitamos acceso a la camara para identificar personas.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Dar permiso de camara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

      {/* Barra superior */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="white" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        {scanning && (
          <View style={styles.scanningBadge}>
            <ActivityIndicator size="small" color="white" style={{ marginRight: 6 }} />
            <Text style={styles.scanningText}>Escaneando...</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Overlay: persona identificada */}
      {result && (
        <View style={styles.resultOverlay}>
          {result.photo ? (
            <Image source={{ uri: result.photo }} style={styles.personPhoto} />
          ) : (
            <View style={[styles.personPhoto, styles.personPhotoPlaceholder]}>
              <Ionicons name="person" size={32} color={THEME.colors.textLight} />
            </View>
          )}
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{result.name}</Text>
            <Text style={styles.personRelationship}>{result.relationship}</Text>
            {result.age != null && (
              <Text style={styles.personDetail}>{result.age} anos</Text>
            )}
            {result.extra ? (
              <Text style={styles.personExtra} numberOfLines={2}>{result.extra}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Overlay: persona desconocida */}
      {isUnknown && !result && (
        <View style={[styles.resultOverlay, styles.unknownOverlay]}>
          <Ionicons name="help-circle-outline" size={36} color="white" style={{ marginRight: 12 }} />
          <Text style={styles.unknownText}>Persona no reconocida</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
    backgroundColor: THEME.colors.background,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.overlay,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.full,
  },
  backButtonText: {
    color: 'white',
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.medium,
    marginLeft: 2,
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.overlay,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.full,
  },
  scanningText: {
    color: 'white',
    fontSize: THEME.fontSize.sm,
    fontWeight: THEME.fontWeight.medium,
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 40,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  unknownOverlay: {
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
  },
  personPhoto: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: THEME.spacing.md,
    borderWidth: 3,
    borderColor: THEME.colors.primary,
  },
  personPhotoPlaceholder: {
    backgroundColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: THEME.fontWeight.black,
    color: THEME.colors.text,
  },
  personRelationship: {
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
    color: THEME.colors.primary,
    marginTop: 2,
  },
  personDetail: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  personExtra: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  unknownText: {
    fontSize: THEME.fontSize.xl,
    fontWeight: THEME.fontWeight.bold,
    color: 'white',
  },
  permissionText: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: THEME.spacing.xl,
  },
  permissionButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xl,
    borderRadius: THEME.radius.lg,
    marginBottom: THEME.spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: THEME.fontSize.lg,
    fontWeight: THEME.fontWeight.bold,
  },
  backLink: {
    padding: THEME.spacing.md,
  },
  backLinkText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.md,
    fontWeight: THEME.fontWeight.medium,
  },
});
