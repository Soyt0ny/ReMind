import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import RegisterForm from '../../components/RegisterForm';
import { THEME } from '../../constants/Theme';

export default function RegisterScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Agregar Familiar</Text>
        <Text style={styles.subtitle}>
          Registra a una persona para que ReMind pueda reconocerla.
        </Text>
      </View>
      <RegisterForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: THEME.fontWeight.black,
    color: THEME.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textMuted,
    lineHeight: 20,
  },
});
