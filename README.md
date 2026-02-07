# ReMind — Asistente Visual de Memoria

Aplicación de asistencia visual para personas con Alzheimer. Identifica rostros y recuerda nombres y parentescos usando reconocimiento facial.

## Requisitos previos

| Herramienta | Versión mínima                                |
| ----------- | --------------------------------------------- |
| **Node.js** | 18+                                           |
| **npm**     | 9+                                            |
| **Python**  | 3.10+                                         |
| **cmake**   | 3.x (solo para compilar `dlib`)               |
| **g++**     | Cualquiera (solo Linux, para compilar `dlib`) |

> No se requiere PostgreSQL. El backend usa **SQLite** de forma local (archivo `backend/remind.db`).

### Instalar requisitos en Linux (Ubuntu / Debian)

```bash
# Actualizar paquetes
sudo apt-get update

# Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3, pip, venv y dependencias de compilación para dlib
sudo apt-get install -y python3 python3-pip python3-venv python3-dev \
  cmake g++ build-essential

# Verificar versiones
node --version    # v20.x.x
npm --version     # 10.x.x
python3 --version # 3.10+
```

### Instalar requisitos en Linux (Fedora / RHEL)

```bash
# Node.js
sudo dnf install -y nodejs npm

# Python y herramientas de compilación
sudo dnf install -y python3 python3-pip python3-devel cmake gcc-c++
```

### Instalar requisitos en macOS

```bash
# Con Homebrew
brew install node python cmake
```

### Instalar requisitos en Windows

1. Descarga e instala [Node.js](https://nodejs.org/) (incluye npm).
2. Descarga e instala [Python](https://www.python.org/downloads/) (marca "Add to PATH").
3. `cmake` se instala vía pip o descarga desde [cmake.org](https://cmake.org/download/) (marcar "Add to PATH").

---

## Instalación rápida

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd re-mind-visual-assistance-app
```

### 2. Instalar dependencias del frontend

```bash
npm install
```

### 3. Crear entorno virtual de Python e instalar dependencias del backend

**Windows (PowerShell):**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

> **Nota sobre `dlib` en Windows:** si la instalación de `dlib` falla, instala primero `cmake` y `dlib-bin`:
>
> ```powershell
> pip install cmake setuptools wheel
> pip install dlib-bin
> pip install face_recognition --no-deps
> pip install Pillow face-recognition-models Click
> ```

**Linux / macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

> **Nota sobre `dlib` en Linux:** necesitas `cmake` y un compilador C++:
>
> ```bash
> # Ubuntu / Debian
> sudo apt-get update
> sudo apt-get install -y cmake g++ python3-dev
>
> # Fedora / RHEL
> sudo dnf install cmake gcc-c++ python3-devel
>
> # macOS (con Homebrew)
> brew install cmake
>
> # Luego instala normalmente
> pip install dlib face_recognition
> ```

---

## Ejecución

### Opción 1 — Comando único

**Windows (PowerShell):** abre dos ventanas automáticamente:

```powershell
npm run dev:all
```

**Linux / macOS:** ejecuta ambos procesos en paralelo:

```bash
npm run dev:linux
```

### Opción 2 — Manual (dos terminales)

**Terminal 1 — Frontend:**

```bash
npm run dev
```

**Terminal 2 — Backend:**

Windows:

```powershell
.\.venv\Scripts\Activate.ps1
cd backend
python -m uvicorn main:app --reload --port 8000
```

Linux / macOS:

```bash
source .venv/bin/activate
cd backend
python3 -m uvicorn main:app --reload --port 8000
```

---

## URLs

| Servicio           | URL                        |
| ------------------ | -------------------------- |
| Frontend (Next.js) | http://localhost:3000      |
| Backend (FastAPI)  | http://localhost:8000      |
| Docs API (Swagger) | http://localhost:8000/docs |

---

## Endpoints de la API

| Método   | Ruta                   | Descripción                                            |
| -------- | ---------------------- | ------------------------------------------------------ |
| `GET`    | `/`                    | Health check                                           |
| `GET`    | `/people`              | Lista personas registradas                             |
| `POST`   | `/register`            | Registra una persona (nombre, parentesco, foto base64) |
| `POST`   | `/identify`            | Identifica un rostro en un frame base64                |
| `DELETE` | `/people/{id}`         | Elimina una persona por ID                             |
| `DELETE` | `/people?confirm=true` | Elimina todos los registros                            |

---

## Estructura del proyecto

```
re-mind-visual-assistance-app/
├── app/                    # Next.js - páginas y estilos globales
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── remind/             # Componentes principales de la app
│       ├── header.tsx
│       ├── navigation.tsx
│       ├── camera-capture.tsx
│       ├── identification-card.tsx
│       └── register-form.tsx
├── backend/
│   ├── main.py             # FastAPI + SQLite + face_recognition
│   ├── remind.db           # Base de datos SQLite (se crea automáticamente)
│   ├── requirements.txt
│   └── schema.sql          # Esquema de referencia
├── scripts/
│   ├── run-all.ps1         # Script para iniciar frontend y backend (Windows)
│   └── run-all.sh          # Script para iniciar frontend y backend (Linux/macOS)
├── package.json
└── README.md
```

---

## Verificar que funciona

1. Abre http://localhost:3000 en tu navegador.
2. Ve a **Registrar** → ingresa nombre, parentesco y toma una foto.
3. Cambia a **Identificar** → enciende la cámara y apúntala a un rostro registrado.

---

## Troubleshooting

- **El backend no inicia:** verifica que el entorno virtual esté activado y que `face_recognition` se importa correctamente:

  ```bash
  # Windows
  python -c "import face_recognition; print('OK')"

  # Linux / macOS
  python3 -c "import face_recognition; print('OK')"
  ```

- **Puerto 3000 ocupado:** cierra otros procesos de Next.js:
  ```bash
  npx kill-port 3000
  # o en Linux:
  lsof -ti:3000 | xargs kill -9
  ```
- **Puerto 8000 ocupado:**
  ```bash
  npx kill-port 8000
  # o en Linux:
  lsof -ti:8000 | xargs kill -9
  ```
- **La cámara no funciona:** asegúrate de acceder desde `localhost` (no IP) para que el navegador permita el acceso a la cámara.
- **`Permission denied` en Linux al ejecutar el script:**
  ```bash
  chmod +x scripts/run-all.sh
  ```
