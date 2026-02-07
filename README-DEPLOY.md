# Guía de Despliegue en Vercel - ReMind

Este proyecto contiene tanto el **frontend** (Next.js) como el **backend** (FastAPI) y se puede desplegar completo en Vercel.

## 📋 Requisitos Previos

1. Cuenta en [Vercel](https://vercel.com)
2. GitHub conectado a Vercel
3. Tu código subido a un repositorio de GitHub

## 🚀 Pasos para Desplegar

### Opción 1: Desde v0 (Recomendado)

1. **Haz clic en el botón "Publish" en la parte superior derecha de v0**
2. Vercel automáticamente:
   - Detectará tu proyecto Next.js
   - Instalará las dependencias de Python
   - Desplegará ambos servicios (frontend y backend)

### Opción 2: Desde Vercel Dashboard

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. Configura el proyecto:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (por defecto)
   - **Output Directory**: `.next` (por defecto)
4. Haz clic en "Deploy"

## 🔧 Configuración Importante

### Variables de Entorno (Opcional)

Si quieres personalizar el backend, puedes añadir estas variables en Vercel:

- `IDENTIFICATION_THRESHOLD`: Umbral de reconocimiento facial (default: 0.6)
- Para producción, considera usar PostgreSQL en lugar de SQLite

### Backend en Serverless

El backend FastAPI se ejecuta como **Vercel Serverless Function** en la ruta `/api/*`:

- **Endpoints del backend**: `https://tu-app.vercel.app/api/`
- **Frontend**: `https://tu-app.vercel.app/`

## 📁 Estructura del Proyecto

```
/
├── app/                 # Frontend Next.js
├── components/          # Componentes React
├── backend/            # Backend FastAPI
│   └── main.py
├── api/                # Wrapper para Vercel
│   └── index.py
├── vercel.json         # Configuración de Vercel
├── requirements.txt    # Dependencias Python
└── package.json        # Dependencias Node.js
```

## ⚠️ Limitaciones de SQLite en Vercel

**Importante**: SQLite no persiste datos en Vercel Serverless porque el filesystem es efímero.

### Soluciones para Producción:

1. **Usar PostgreSQL** (Recomendado):
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Supabase](https://supabase.com)
   - [Neon](https://neon.tech)

2. **Modificar el código** para usar una base de datos persistente:
   ```python
   # En backend/main.py, cambiar:
   DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://...")
   ```

## 🔗 URLs Importantes

Después del despliegue, tendrás:

- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend API**: `https://tu-proyecto.vercel.app/api/`
- **Health Check**: `https://tu-proyecto.vercel.app/api/`
- **Registrar persona**: `POST https://tu-proyecto.vercel.app/api/register`
- **Identificar persona**: `POST https://tu-proyecto.vercel.app/api/identify`

## 🐛 Solución de Problemas

### Error: "Module not found" (Python)

- Verifica que `requirements.txt` esté en la raíz del proyecto
- Asegúrate de que todas las dependencias estén listadas

### Error: "Function execution timed out"

- Las funciones serverless de Vercel tienen límite de 10s (hobby) / 60s (pro)
- El reconocimiento facial puede ser lento en la primera ejecución (cold start)
- Considera optimizar el modelo o usar un servicio dedicado

### Frontend no encuentra el backend

- Actualiza las URLs del API en tu código frontend
- Usa rutas relativas: `/api/identify` en lugar de `http://localhost:8000/identify`

## 📊 Monitoreo

- Ve al dashboard de Vercel para ver:
  - Logs de las funciones
  - Métricas de uso
  - Errores en tiempo real

## 🎯 Próximos Pasos

1. ✅ Despliega el proyecto
2. ⚠️ Migra de SQLite a PostgreSQL para persistencia
3. 🔒 Añade autenticación si es necesario
4. 📈 Configura analytics y monitoreo
5. 🌍 Configura un dominio personalizado

---

**¿Necesitas ayuda?** Consulta la [documentación de Vercel](https://vercel.com/docs) o abre un issue en GitHub.
