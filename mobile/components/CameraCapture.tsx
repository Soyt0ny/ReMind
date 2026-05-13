import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
// Importamos Ionicons, que es un paquete de íconos gratuitos que ya viene en Expo
import { Ionicons } from '@expo/vector-icons';

export default function CameraCapture() {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<any>(null);

    // ¡NUEVO! Esta variable controla qué cámara usamos. 
    // Empieza en 'back' (trasera), pero podemos cambiarla a 'front' (frontal).
    const [facing, setFacing] = useState<'back' | 'front'>('back');

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                    Necesitamos tu permiso para usar la cámara y ayudar a tu familiar.
                </Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Dar permiso</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Función para tomar la foto (sigue igual)
    const tomarFoto = async () => {
        if (cameraRef) {
            const foto = await cameraRef.takePictureAsync({ base64: true });
            console.log("¡Foto tomada!");
        }
    };

    // ¡NUEVO! Función para voltear la cámara
    const voltearCamara = () => {
        // Si la actual es 'back', la cambia a 'front'. Si es 'front', la cambia a 'back'.
        setFacing(actual => (actual === 'back' ? 'front' : 'back'));
    };

    return (
        <View style={styles.container}>

            {/* 1. EL ENCABEZADO (Igual que en la web) */}
            <View style={styles.header}>
                <Text style={styles.title}>ReMind</Text>
                <Text style={styles.subtitle}>Asistente Visual de Memoria</Text>
            </View>

            {/* 2. LA TARJETA BLANCA */}
            <View style={styles.card}>

                {/* Aquí adentro vive la cámara, ahora con altura fija para no ocupar toda la pantalla */}
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing={facing} // Aquí usamos nuestra variable 'back' o 'front'
                        ref={(ref) => setCameraRef(ref)}
                    />
                </View>

                {/* 3. LOS BOTONES (Debajo de la cámara) */}
                <View style={styles.controls}>

                    {/* Botón circular para voltear la cámara */}
                    <TouchableOpacity style={styles.flipButton} onPress={voltearCamara}>
                        <Ionicons name="camera-reverse-outline" size={28} color="#333" />
                    </TouchableOpacity>

                    {/* Botón principal azul para identificar */}
                    <TouchableOpacity style={styles.captureButton} onPress={tomarFoto}>
                        <Ionicons name="scan-outline" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Identificar</Text>
                    </TouchableOpacity>

                </View>

            </View>
        </View>
    );
}

// NUEVOS ESTILOS: Más modernos, limpios y parecidos a tu Next.js
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Un gris muy clarito para el fondo general
        paddingTop: 60, // Espacio arriba para que no pegue con la hora del celular
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#111827', // Casi negro
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280', // Gris suave
        marginTop: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        // Sombreado elegante para la tarjeta
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5, // Sombra para Android
    },
    cameraContainer: {
        height: 380, // Altura de la caja de la cámara
        borderRadius: 16,
        overflow: 'hidden', // Evita que la cámara se salga de los bordes redondeados
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    controls: {
        flexDirection: 'row', // Pone los elementos uno al lado del otro
        justifyContent: 'space-between', // Separa el botón de voltear del botón de capturar
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 10,
    },
    flipButton: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 50, // Lo hace completamente redondo
    },
    captureButton: {
        backgroundColor: '#007AFF', // Azul estilo iOS
        flexDirection: 'row', // Ícono y texto lado a lado
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 50,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Estilos para cuando pide permiso
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F3F4F6',
    },
    permissionText: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        color: '#333'
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    }
});