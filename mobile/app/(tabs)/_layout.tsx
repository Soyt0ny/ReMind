import { Tabs } from 'expo-router';
// Importamos los íconos para que los botones de abajo se vean profesionales
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      // Color azul para la pestaña que esté seleccionada
      tabBarActiveTintColor: '#007AFF',
      // Ocultamos el título feo que pone por defecto arriba, porque nosotros ya hicimos el nuestro
      headerShown: false,
    }}>

      {/* 1. PESTAÑA DE IDENTIFICAR (Nuestra cámara) */}
      <Tabs.Screen
        name="index" // Apunta al archivo index.tsx
        options={{
          title: 'Identificar',
          tabBarIcon: ({ color }) => <Ionicons name="scan-outline" size={24} color={color} />,
        }}
      />

      {/* 2. PESTAÑA DE REGISTRO */}
      <Tabs.Screen
        name="register" // Apuntará al archivo register.tsx que vamos a crear en el Paso 2
        options={{
          title: 'Registrar',
          tabBarIcon: ({ color }) => <Ionicons name="person-add-outline" size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}