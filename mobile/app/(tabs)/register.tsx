import { StyleSheet, View, Text } from 'react-native';
import RegisterForm from '../../components/RegisterForm';

export default function RegisterScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>ReMind</Text>
                <Text style={styles.subtitle}>Registro de Familiares</Text>
            </View>

            {/* Aquí metemos el formulario que creamos arriba */}
            <RegisterForm />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: 60, paddingHorizontal: 20 },
    header: { alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 32, fontWeight: '900', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280' },
});