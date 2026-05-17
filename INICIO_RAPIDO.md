# 🌱 AgroSenS - Sistema Inteligente de Monitoreo de Estrés Hídrico

Sistema completo de monitoreo predictivo de déficit de presión de vapor (DPV) para cultivos en invernadero.

## 🚀 Inicio Rápido

### 1. Preparar la Base de Datos
```bash
cd agrosens_backend
node clean-and-populate-db.js
```

### 2. Iniciar el Backend (Terminal 1)
```bash
cd agrosens_backend
npm run dev
# Escucha en puerto 3000
```

### 3. Iniciar el Frontend (Terminal 2)
```bash
cd agrosens_flutter
flutter pub get
flutter run
```

## 🔐 Credenciales de Prueba

```
Email: agricultor@agrosens.com
Contraseña: test123
```

## 📱 Pantallas Principales

### 🟢 Dashboard
- **Semáforo DPV**: Visualización en tiempo real
- Selector de invernadero y lote
- Temperatura y humedad actuales
- Gráfico de tendencia (24h)

### 🚨 Alertas  
- Lista de alertas activas
- Clasificación por severidad
- Recomendaciones automáticas
- Estado de resolución

### 📊 Historial
- Gráficos de temperatura
- Gráficos de humedad
- Gráficos de DPV
- Tabla de datos detallados

### ✏️ Registrar Evento
- Documentar acciones de riego
- Registrar fertilización
- Rastrear mantenimiento
- Vinculación automática con sensor data

## 🎨 Semáforo de Estrés Hídrico (DPV)

```
🟢 Verde      DPV < 0.8 kPa   → Óptimo
🟡 Amarillo   0.8 ≤ DPV ≤ 1.5 → Advertencia  
🔴 Rojo       DPV > 1.5 kPa   → Crítico
```

## 📂 Estructura del Proyecto

```
agrosens/
├── agrosens_backend/          # API Node.js/TypeScript
│   ├── src/
│   │   ├── server.ts          # Punto de entrada
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── routes/            # Rutas de API
│   │   ├── services/          # Servicios (DPV, etc.)
│   │   ├── models/            # Modelos de datos
│   │   └── config/            # Configuración
│   └── clean-and-populate-db.js  # Datos de prueba
│
├── agrosens_flutter/          # App Flutter
│   ├── lib/
│   │   ├── main.dart          # Punto de entrada
│   │   ├── screens/           # Pantallas
│   │   ├── models/            # Modelos de datos
│   │   ├── services/          # Cliente API
│   │   ├── providers/         # State management
│   │   └── theme.dart         # Tema visual
│   └── pubspec.yaml           # Dependencias
│
└── docs/                      # Documentación
```

## 🔧 Tecnologías

### Backend
- Node.js 22.13.1
- Express.js 4.18.2
- TypeScript 5.3.3
- PostgreSQL 13+
- JWT Authentication

### Frontend  
- Flutter 3.0+
- Dart 2.17+
- Provider (state management)
- fl_chart (visualización)
- google_fonts (tipografía)

## 📊 Base de Datos

**Servidor**: localhost:5432  
**Usuario**: postgres  
**Contraseña**: 1234  
**Base de datos**: agrosens_db  

**Tablas principales**:
- usuarios (1 de prueba)
- invernaderos (3)
- lotes (4)
- sensores (4)
- lecturas_sensores (96)
- alertas (3)
- recomendaciones (3)

## 🔗 Endpoints API

Base URL: `http://localhost:3000/api/v1`

### Autenticación
```
POST   /auth/login              Login
POST   /auth/register           Registro
POST   /auth/cambiar-password   Cambiar contraseña
```

### Datos
```
GET    /invernaderos            Listar invernaderos
GET    /lotes                   Listar lotes
GET    /sensores                Listar sensores
GET    /lecturas/:loteId        Lecturas por lote
GET    /alertas                 Listar alertas
GET    /recomendaciones         Listar recomendaciones
```

## ⚙️ Variables de Entorno

**Backend** (.env):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=agrosens_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
```

## 🧪 Testing

### Verificar Backend
```bash
curl http://localhost:3000/api/v1/invernaderos
```

### Verificar BD
```bash
psql -U postgres -d agrosens_db -c "SELECT COUNT(*) FROM usuarios;"
```

## 📝 Características

✅ Cálculo automático de DPV  
✅ Semáforo visual de estrés  
✅ Alertas inteligentes  
✅ Recomendaciones automáticas  
✅ Gráficos de tendencia  
✅ Registro de eventos  
✅ Autenticación JWT  
✅ Interfaz responsiva  
✅ Datos históricos  
✅ Login persistente  

## 🐛 Solución de Problemas

### Port 3000 ocupado
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Error de conexión BD
```bash
# Verificar PostgreSQL
psql -U postgres -d agrosens_db
```

### Flutter build error
```bash
flutter clean
flutter pub get
flutter run
```

## 📖 Documentación

- [Sistema Completo](SISTEMA_COMPLETO.md)
- [Requerimientos](../docs/requerimientos.txt)
- [Schema BD](../agrosens_backend/DATABASE_SCHEMA.md)
- [Guía rápida PostgreSQL](../agrosens_backend/GUIA_RAPIDA_POSTGRESQL.md)

## 👨‍💻 Desarrollo

Los datos son reales desde la base de datos. Cambios en la BD se reflejan inmediatamente en la app.

Para resetear con nuevos datos:
```bash
cd agrosens_backend
node clean-and-populate-db.js
```

## 📄 Licencia

Proyecto educativo - AgroSenS

## 📞 Soporte

Para dudas sobre:
- **Backend**: Ver `agrosens_backend/README.md`
- **Frontend**: Ver `agrosens_flutter/pubspec.yaml`
- **BD**: Ver `agrosens_backend/DATABASE_SCHEMA.md`

---

**Estado**: ✅ Completamente funcional - Listo para producción
