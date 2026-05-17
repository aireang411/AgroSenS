# 🌾 AgroSenS Backend

**Sistema de Predicción de Estrés Hídrico en Cultivos Bajo Invernadero**

## 📋 Descripción

AgroSenS es una plataforma IoT que monitorea cultivos bajo invernadero y predice estrés hídrico antes de que sea visible. El backend procesa datos de sensores, calcula índices fisiológicos (DPV) y genera alertas predictivas personalizadas.

---

## 🎯 Características Principales

✅ **Cálculo de Déficit de Presión de Vapor (DPV)** - RF-AP-01
- Procesamiento automático de temperatura y humedad
- Validación de rangos de entrada
- Almacenamiento de métricas termodinámicas

✅ **Detección de Tendencias** - RF-AP-02
- Análisis de regresión lineal en ventanas temporales
- Proyección de estrés futuro
- Cálculo de probabilidades

✅ **Recomendaciones en Lenguaje Natural** - RF-AP-03
- Traducción de datos técnicos a instrucciones agronómicas
- Personalizadas por especie y etapa fenológica
- Acciones ejecutables para el agricultor

✅ **Alertas Proactivas** - RF-AP-04
- Notificaciones push basadas en predicciones
- Gestión de reintentos en caso de falla
- Registro de tiempos de reacción

✅ **Autenticación Segura** - RF-SEC-01
- JWT (JSON Web Tokens) con expiración
- Control de acceso basado en roles
- Logs de auditoría inmutables

✅ **Gestión de Dispositivos IoT** - RF-ADM-01
- Registro de sensores y dispositivos
- Heartbeat monitoring
- Control de estado activo/inactivo

✅ **Métricas de Rendimiento** - RF-INF-01
- Monitoreo de disponibilidad del backend
- Tracking de latencia de respuestas
- Estadísticas de uptime

---

## 🏗️ Arquitectura

```
agrosens_backend/
├── src/
│   ├── config/          # Configuración (BD, logger)
│   ├── controllers/      # Lógica de negocio
│   ├── middlewares/      # JWT, CORS, etc
│   ├── models/          # (Schemas, validaciones)
│   ├── routes/          # Definición de endpoints
│   ├── services/        # Servicios core
│   │   ├── dpvService.js           # Cálculos de DPV
│   │   ├── predictionService.js    # Tendencias y predicción
│   │   └── recommendationService.js # Recomendaciones
│   ├── utils/           # Helpers, logger
│   └── validators/      # Validación de datos
├── scripts/             # Scripts de utilidad
├── logs/               # Archivos de log
├── init_db.sql         # Script de BD
├── server.js           # Archivo principal
├── package.json        # Dependencias
└── .env.example        # Variables de entorno
```

---

## 🔧 Instalación

### 1. Requisitos

- **Node.js** 16.0.0+
- **npm** 8.0.0+
- **PostgreSQL** 12.0+ (instalar en `D:\PostgreSQL`)

### 2. Clonar/Descargar Proyecto

```bash
cd agrosens_backend
```

### 3. Instalar PostgreSQL

Sigue la guía completa en `INSTALACION_POSTGRESQL.md`:

```bash
# Resumen rápido:
# 1. Descargar instalador de PostgreSQL desde postgresql.org
# 2. Instalar en D:\PostgreSQL
# 3. Recordar contraseña del usuario 'postgres'
# 4. Crear usuario y base de datos con los scripts proporcionados
```

### 4. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrosens_db
DB_USER=agrosens_user
DB_PASSWORD=tu_contraseña_segura
JWT_SECRET=tu_secreto_minimo_32_caracteres_aleatorios
PORT=3000
NODE_ENV=development
```

### 5. Instalar Dependencias

```bash
npm install
```

### 6. Iniciar el Servidor

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

---

## 📡 Endpoints Principales

### Autenticación (RF-SEC-01)

```
POST   /api/v1/auth/register              # Registrar usuario
POST   /api/v1/auth/login                 # Login
POST   /api/v1/auth/refresh               # Refrescar token
POST   /api/v1/auth/cambiar-password      # Cambiar contraseña
```

### Sensores (RF-ADM-01)

```
POST   /api/v1/sensores                   # Crear sensor
GET    /api/v1/sensores                   # Listar sensores
GET    /api/v1/sensores/:id               # Obtener sensor
PUT    /api/v1/sensores/:id               # Actualizar sensor
DELETE /api/v1/sensores/:id               # Eliminar sensor
POST   /api/v1/sensores/:id/lecturas      # Ingresar lectura
GET    /api/v1/sensores/:id/lecturas      # Obtener lecturas
```

### Alertas (RF-AP-04)

```
POST   /api/v1/alertas/generar            # Generar alerta
GET    /api/v1/alertas                    # Listar alertas
GET    /api/v1/alertas/:id                # Obtener alerta
PUT    /api/v1/alertas/:id                # Actualizar alerta
POST   /api/v1/alertas/:id/marcar-vista   # Registrar tiempo de reacción
```

### Lotes

```
POST   /api/v1/lotes                      # Crear lote
GET    /api/v1/lotes                      # Listar lotes
GET    /api/v1/lotes/:id                  # Obtener lote
PUT    /api/v1/lotes/:id                  # Actualizar lote
DELETE /api/v1/lotes/:id                  # Eliminar lote
```

### Métricas (RF-INF-01, RF-BD-01)

```
GET    /api/v1/metrics/reaccion           # Tiempo de reacción usuario
GET    /api/v1/metrics/rendimiento        # Rendimiento backend (admin)
```

---

## 🔐 Autenticación

Todos los endpoints (excepto registro y login) requieren JWT token:

```bash
Authorization: Bearer <token_jwt>
```

**Ejemplo:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     http://localhost:3000/api/v1/sensores
```

---

## 📊 Flujo de Datos

```
1. Sensor → Backend (POST /api/v1/sensores/:id/lecturas)
   └─ Temperatura + Humedad

2. Backend procesa lectura
   └─ Calcula DPV (RF-AP-01)

3. Análisis de tendencia
   └─ Regresión lineal de últimas 4+ lecturas (RF-AP-02)

4. Evaluación de riesgo
   └─ Compara contra umbrales configurables

5. Si probabilidad estrés > 80%
   └─ Genera alerta (RF-AP-04)
   └─ Crea recomendación (RF-AP-03)
   └─ Envía notificación push

6. Usuario recibe alerta
   └─ Registra tiempo de reacción (RF-BD-01)
```

---

## 🧮 Fórmulas Implementadas

### DPV (Déficit de Presión de Vapor)

```
es = 0.6108 × e^((17.27 × T) / (T + 237.3))    # Presión saturación
ea = (HR / 100) × es                             # Presión real
DPV = es - ea                                    # Déficit
```

Donde:
- T = Temperatura (°C)
- HR = Humedad Relativa (%)
- es = Presión vapor saturación (kPa)
- ea = Presión vapor real (kPa)

### Regresión Lineal (Tendencias)

```
y = mx + b

Donde m = (n∑xy - ∑x∑y) / (n∑x² - (∑x)²)
      b = (∑y - m∑x) / n
```

### Probabilidad de Estrés

```
Si DPV_actual ≥ DPV_crítico:
    P = 100%

Si DPV_proyectado ≥ DPV_crítico:
    P = (ΔProyectado / ΔRequerido) × 100%
```

---

## 📝 Requisitos Funcionales Implementados

| Requisito | Servicio | Estado |
|-----------|----------|--------|
| RF-AP-01 | dpvService.calcularDPV() | ✅ |
| RF-AP-02 | predictionService.evaluarRiesgo() | ✅ |
| RF-AP-03 | recommendationService.generarRecomendacion() | ✅ |
| RF-AP-04 | alertasController.generarAlerta() | ✅ |
| RF-AP-05 | configuracion_cultivo (umbrales) | ✅ |
| RF-SEC-01 | auth.js, authController.js | ✅ |
| RF-ADM-01 | sensoresController.js | ✅ |
| RF-BD-01 | registros_reaccion_usuario | ✅ |
| RF-INF-01 | metricas_rendimiento | ✅ |
| RF-UX-01 | (Frontend, envía estado a app) | ✅ |

---

## 🧪 Pruebas

```bash
# Ejecutar tests
npm test

# Con coverage
npm test -- --coverage
```

---

## 📦 Base de Datos

**Ubicación**: `D:\PostgreSQL`

**Tablas principales**:
- usuarios (autenticación)
- sensores (dispositivos IoT)
- lecturas_sensores (mediciones)
- alertas (eventos de riesgo)
- recomendaciones (sugerencias)
- configuracion_cultivo (umbrales)
- notificaciones_push (FCM)
- registros_reaccion_usuario (tiempos)
- metricas_rendimiento (uptime)
- logs_auditoria (seguridad)

Documentación completa: `DATABASE_SCHEMA.md`

---

## 🚀 Deployment

### Producción

1. Cambiar `NODE_ENV=production` en `.env`
2. Usar contraseña fuerte para `JWT_SECRET`
3. Habilitar `DB_SSL=true` si es remota
4. Usar servicio de PM2 o similar:

```bash
npm install -g pm2
pm2 start server.js --name agrosens-backend
pm2 save
pm2 startup
```

### Docker

```bash
docker build -t agrosens-backend .
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=secure_pwd \
  agrosens-backend
```

---

## 📚 Documentación Adicional

- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) - Diseño de BD
- [`INSTALACION_POSTGRESQL.md`](./INSTALACION_POSTGRESQL.md) - Setup PostgreSQL
- [`init_db.sql`](./init_db.sql) - Script de inicialización

---

## 🔍 Monitoreo y Logs

Los logs se guardan en `logs/`:

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Ver solo errores
tail -f logs/error.log
```

---

## 🤝 Contribuir

1. Crear rama: `git checkout -b feature/mi-feature`
2. Hacer cambios
3. Commit: `git commit -am 'Descripción'`
4. Push: `git push origin feature/mi-feature`

---

## 📄 Licencia

MIT

---

## 📞 Soporte

Para problemas:
1. Verifica que PostgreSQL está corriendo
2. Revisa `.env` tiene valores correctos
3. Consulta `INSTALACION_POSTGRESQL.md`
4. Revisa logs en `logs/app.log`

---

**Versión**: 1.0.0  
**Última actualización**: Abril 2026  
**Estado**: ✅ Listo para producción
