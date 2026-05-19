import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '../../constants/DesignSystem';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   DESIGN_SYSTEM.colors.primary,
        tabBarInactiveTintColor: DESIGN_SYSTEM.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor:  DESIGN_SYSTEM.colors.border,
          height: 84, 
          paddingBottom: 24, 
          paddingTop: 8,
          ...DESIGN_SYSTEM.shadows.md,
        },
        tabBarLabelStyle: {
          fontSize:   12,
          fontWeight: '700',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Contactos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      {/* Hide Register from tabs as per Web pattern */}
      <Tabs.Screen
        name="register"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
