import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../components/services/api'; // La conexión que hicimos antes

export default function RegisterForm() {
    // 1. "Cajitas" para guardar lo que el usuario escribe
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [image, setImage] = useState<string | null>(null); // Aquí guardamos la foto
    const [cameraRef, setCameraRef] = useState<any>(null);
    const [isTakingPhoto, setIsTakingPhoto] = useState(true); // Para mostrar cámara o foto tomada

    // 2. Función para capturar la foto de registro
    const capturarFoto = async () => {
        if (cameraRef) {
            const foto = await cameraRef.takePictureAsync({ base64: true });
            setImage(foto.base64); // Guardamos la foto en texto
            setIsTakingPhoto(false); // Escondemos la cámara para mostrar que ya se tomó
        }
    };

    // 3. Función para enviar todo a tu servidor de Python
    const enviarRegistro = async () => {
        if (!name || !relationship || !image) {
            Alert.alert("Faltan datos", "Por favor llena el nombre, parentesco y toma una foto.");
            return;
        }

        try {
            await api.register({ name, relationship, image });
            Alert.alert("¡Éxito!", `${name} ha sido registrado.`);
            // Limpiamos el formulario para el siguiente registro
            setName('');
            setRelationship('');
            setImage(null);
            setIsTakingPhoto(true);
        } catch (error) {
            Alert.alert("Error", "No se pudo conectar con el servidor.");
        }
    };

    return (
        <ScrollView style={styles.container}>
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

            <Text style={styles.label}>Foto de Referencia</Text>
            <View style={styles.cameraBox}>
                {isTakingPhoto ? (
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        ref={(ref) => setCameraRef(ref)}
                    />
                ) : (
                    <View style={styles.photoDone}>
                        <Text style={{ color: 'white' }}>¡Foto lista! ✅</Text>
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
    cameraBox: {
        height: 200,
        backgroundColor: 'black',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 10,
    },
    camera: { flex: 1 },
    photoDone: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#059669' },
    photoButton: { backgroundColor: '#4B5563', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    retryButton: { backgroundColor: '#9CA3AF', padding: 10, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    saveButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 40 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});