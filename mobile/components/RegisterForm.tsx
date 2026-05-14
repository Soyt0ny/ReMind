import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { CameraView } from 'expo-camera';
import { api } from './services/api';
// 1. Importamos los íconos para el botón de voltear la cámara
import { Ionicons } from '@expo/vector-icons';

export default function RegisterForm() {
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');

    // 2. NUEVO: Cajita para guardar las características
    const [extra, setExtra] = useState('');

    const [image, setImage] = useState<string | null>(null);
    const [cameraRef, setCameraRef] = useState<any>(null);
    const [isTakingPhoto, setIsTakingPhoto] = useState(true);

    // 3. NUEVO: Estado para saber qué cámara usar (trasera o frontal)
    const [facing, setFacing] = useState<'back' | 'front'>('back');

    // Función para voltear la cámara
    const voltearCamara = () => {
        setFacing(actual => (actual === 'back' ? 'front' : 'back'));
    };

    const capturarFoto = async () => {
        if (cameraRef) {
            const foto = await cameraRef.takePictureAsync({ base64: true });
            setImage(foto.base64);
            setIsTakingPhoto(false);
        }
    };

    const enviarRegistro = async () => {
        if (!name || !relationship || !image) {
            Alert.alert("Faltan datos", "Por favor llena el nombre, parentesco y toma una foto.");
            return;
        }

        try {
            // 4. NUEVO: Ahora también enviamos el campo "extra" a tu base de datos
            await api.register({ name, relationship, image, extra });
            Alert.alert("¡Éxito!", `${name} ha sido registrado.`);

            // Limpiamos todo para dejarlo como nuevo
            setName('');
            setRelationship('');
            setExtra(''); // Limpiamos las características
            setImage(null);
            setIsTakingPhoto(true);
        } catch (error) {
            Alert.alert("Error", "No se pudo conectar con el servidor.");
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Juan Pérez"
            />

            <Text style={styles.label}>Parentesco</Text>
            <TextInput
                style={styles.input}
                value={relationship}
                onChangeText={setRelationship}
                placeholder="Ej. Hijo, Doctor, Vecino"
            />

            {/* 5. NUEVO: El campo de características en la pantalla */}
            <Text style={styles.label}>Características (Opcional)</Text>
            <TextInput
                style={[styles.input, styles.textArea]} // Le damos un estilo más grande
                value={extra}
                onChangeText={setExtra}
                placeholder="Ej. Usa lentes, siempre trae gorra, tiene barba..."
                multiline={true} // Permite escribir en varios renglones
                numberOfLines={3}
            />

            <Text style={styles.label}>Foto de Referencia</Text>
            <View style={styles.cameraBox}>
                {isTakingPhoto ? (
                    <View style={{ flex: 1 }}>
                        <CameraView
                            style={styles.camera}
                            facing={facing} // Aquí usamos nuestra cámara (frontal/trasera)
                            ref={(ref) => setCameraRef(ref)}
                        />
                        {/* Botón flotante para voltear la cámara */}
                        <TouchableOpacity style={styles.flipButton} onPress={voltearCamara}>
                            <Ionicons name="camera-reverse" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.photoDone}>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>¡Foto lista! ✅</Text>
                    </View>
                )}
            </View>

            {isTakingPhoto ? (
                <TouchableOpacity style={styles.photoButton} onPress={capturarFoto}>
                    <Text style={styles.buttonText}>Tomar Foto</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.retryButton} onPress={() => setIsTakingPhoto(true)}>
                    <Text style={styles.buttonText}>Repetir Foto</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={enviarRegistro}>
                <Text style={styles.buttonText}>Guardar en ReMind</Text>
            </TouchableOpacity>

            {/* Espacio extra abajo para que el teclado no tape el botón */}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 5 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#374151' },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    textArea: {
        height: 80, // Lo hacemos más alto
        textAlignVertical: 'top', // Para que el texto empiece arriba y no en medio
    },
    cameraBox: {
        height: 250, // Lo hicimos un poquito más alto para que te veas mejor
        backgroundColor: 'black',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 10,
    },
    camera: { flex: 1 },
    flipButton: {
        position: 'absolute', // Esto hace que flote sobre la cámara
        bottom: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.5)', // Fondo negro transparente
        padding: 10,
        borderRadius: 50,
    },
    photoDone: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#059669' },
    photoButton: { backgroundColor: '#4B5563', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    retryButton: { backgroundColor: '#9CA3AF', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    saveButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});