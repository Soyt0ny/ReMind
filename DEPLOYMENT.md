# Guía de Despliegue y Puesta en Marcha 🚀

Esta guía detalla los pasos necesarios para levantar todo el ecosistema de **ReMind** el día del proyecto.

## 1. Backend (Servidor de IA)
El backend está configurado para correr en un contenedor Docker. Actualmente se encuentra desplegado en **Dokploy**.

### Variables de Entorno (.env)
En el servidor de producción (o localmente en `/backend/.env`), deben existir las siguientes variables:
- `SECRET_KEY`: Una cadena aleatoria para firmar los tokens JWT.
- `DATABASE_PATH`: Ruta al archivo SQLite (ej: `/data/remind.db`).

### Despliegue con Docker
Para levantarlo localmente:
```bash
cd backend
docker build -t remind-backend .
docker run -p 8000:8000 -v remind_data:/data remind-backend
```
*Nota: El puerto de escucha es el **8000**.*

---

## 2. Aplicación Mobile (Expo)
La app mobile necesita conocer la dirección del backend para funcionar.

### Configuración de Entorno
Crea un archivo en `/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://remind.soyt0ny.site
```

### Ejecución
1. Instala dependencias: `cd mobile && npm install`
2. Inicia Expo con túnel (recomendado para el día del proyecto):
   ```bash
   npx expo start --tunnel
   ```
3. Escanea el código QR con la app **Expo Go** en tu celular.

---

## 3. Aplicación Web (Next.js)
El panel web sirve para gestionar los contactos desde una computadora.

### Configuración de Entorno
Crea un archivo en la raíz del proyecto `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://remind.soyt0ny.site
```

### Ejecución
1. Instala dependencias: `npm install`
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre `http://localhost:3000` en el navegador.

---

## 🛠️ Configuración Local (Sin Nube)
Si por alguna razón necesitas correr el backend en tu propia computadora el día del proyecto, usa estas configuraciones:

### 1. Backend (`/backend/.env`)
```env
SECRET_KEY=tu_clave_secreta_aqui
DATABASE_PATH=remind.db
```
*(Luego corre `python main.py` o usa Docker como se indica arriba).*

### 2. Mobile (`/mobile/.env`)
Debes usar la IP de tu computadora para que el celular pueda verla en la misma red WiFi:
```env
EXPO_PUBLIC_API_URL=http://192.168.X.XX:8000
```
*(Cambia `192.168.X.XX` por tu IP real, que puedes ver con `ip addr` o `ipconfig`).*

### 3. Web (`/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 💡 Checklist para el día de la presentación:
1. **Verificar Backend**: Entrar a `https://remind.soyt0ny.site` y ver el mensaje `{"status":"ok"}`.
2. **Conexión a Internet**: Asegurarse de que tanto la laptop como el celular tengan buena conexión (Expo Tunnel depende de esto).
3. **Login de Prueba**: Tener una cuenta lista para loguearse y mostrar el historial vacío vs. con contactos.
4. **Permisos**: Aceptar los permisos de Cámara en el celular apenas se abra la app.

---
*Si necesitas cambiar el backend a local, recuerda actualizar las URLs en los archivos `.env` de Mobile y Web por tu IP local.*
