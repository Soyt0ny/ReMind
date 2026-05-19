# ReMind - Asistente Visual de Memoria 🧠

**ReMind** es una solución integral diseñada para mejorar la calidad de vida de personas que conviven con Alzheimer u otros trastornos de la memoria. Utilizando inteligencia artificial y reconocimiento facial en tiempo real, la aplicación ayuda a los usuarios a identificar a sus seres queridos, cuidadores y personal médico, reduciendo la ansiedad y fomentando la autonomía.

## 🚀 Funcionalidades Principales

### 🔍 Reconocimiento Facial en Tiempo Real
- **Identificación Instantánea**: Mediante la cámara del dispositivo, la app detecta rostros y muestra el nombre, relación (ej. "Hija", "Médico") y datos útiles guardados.
- **Modo Silencioso**: La cámara captura fotos de forma transparente sin sonidos ni destellos para no incomodar al usuario.
- **Historial Reciente**: Acceso rápido a las últimas personas identificadas directamente desde la pantalla de inicio.

### 👥 Gestión de Contactos
- **Registro Personalizado**: Permite añadir familiares con nombre, relación, edad, teléfono y notas adicionales.
- **Subida Flexible**: Posibilidad de registrar personas tomando una foto en el momento o subiendo una imagen desde la galería.
- **Seguridad**: Las acciones sensibles (editar o eliminar contactos) están protegidas por contraseña para evitar borrados accidentales.

### 🚨 Asistencia de Emergencia
- **Ayuda Rápida**: Un botón prominente en la pantalla de inicio permite realizar una llamada telefónica directa al contacto de emergencia configurado con un solo toque.

## 🛠️ Stack Tecnológico

### Backend (Cerebro)
- **FastAPI (Python)**: API de alto rendimiento y baja latencia.
- **Dlib & Face Recognition**: Motores de IA para la generación de "embeddings" faciales y comparación de rostros.
- **SQLite**: Base de datos ligera y persistente.
- **Docker**: Contenerización completa para despliegue consistente.

### Mobile (Cliente Principal)
- **React Native & Expo**: Aplicación multiplataforma (iOS/Android).
- **Expo Camera & Image Picker**: Integración nativa con el hardware del celular.
- **React Native Safe Area Context**: Diseño adaptado a dispositivos con notch y barras de sistema modernas.

### Web (Panel de Control)
- **Next.js 14 (App Router)**: Interfaz administrativa moderna y responsiva.
- **Tailwind CSS**: Diseño limpio y profesional basado en un sistema de diseño unificado.

## 🏗️ Arquitectura del Sistema
La aplicación sigue un modelo cliente-servidor donde tanto la web como la app mobile consumen una API centralizada desplegada en la nube (**Dokploy**). El historial se maneja localmente por usuario para garantizar la privacidad y rapidez de la interfaz.

---
*Desarrollado como proyecto de asistencia tecnológica para la salud.*
