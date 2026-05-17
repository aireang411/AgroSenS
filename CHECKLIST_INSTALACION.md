# ✅ CHECKLIST DE INSTALACIÓN Y CONFIGURACIÓN - AgroSenS

## 🚀 FASE 1: PREPARACIÓN DEL ENTORNO

### PostgreSQL en D:\
- [ ] Descargar PostgreSQL desde https://www.postgresql.org/download/windows/
- [ ] Instalar en `D:\PostgreSQL`
- [ ] Contraseña superuser: `postgres123`
- [ ] Verificar: `psql --version`

### Verificación Inicial
- [ ] Node.js instalado: `node --version` (debe ser v16+)
- [ ] npm instalado: `npm --version` (debe ser v8+)
- [ ] Git disponible (opcional): `git --version`

---

## 📊 FASE 2: CONFIGURACIÓN DE BASE DE DATOS

### Crear Usuario y BD
```powershell
psql -U postgres
```

- [ ] Usuario creado: `agrosens_user`
- [ ] BD creada: `agrosens_db`
- [ ] Extensión UUID activada

### Ejecutar Script SQL
```powershell
cd c:\Users\carli\OneDrive\Escritorio\agrosens_flutter\agrosens_backend
psql -U agrosens_user -d agrosens_db -f init_db.sql
```

- [ ] Script ejecutado sin errores
- [ ] 13+ tablas creadas verificadas
- [ ] Índices creados correctamente
- [ ] Triggers activos

### Verificación de Tablas
```powershell
psql -U agrosens_user -d agrosens_db
\dt
```

Tablas presentes:
- [ ] usuarios
- [ ] invernaderos
- [ ] lotes
- [ ] sensores
- [ ] lecturas_sensores
- [ ] configuracion_cultivo
- [ ] alertas
- [ ] recomendaciones
- [ ] notificaciones_push
- [ ] registros_reaccion_usuario
- [ ] metricas_rendimiento
- [ ] logs_auditoria
- [ ] errores_sensores_offline
- [ ] presets_configuracion

---

## ⚙️ FASE 3: CONFIGURACIÓN DEL BACKEND

### Preparar Backend
```powershell
cd c:\Users\carli\OneDrive\Escritorio\agrosens_flutter\agrosens_backend
```

- [ ] Carpeta backend accesible
- [ ] Archivo `.env` presente con credenciales correctas
- [ ] archivo `init_db.sql` presente

### Instalar Dependencias
```powershell
npm install
```

- [ ] `node_modules` creado
- [ ] `package-lock.json` generado
- [ ] Sin errores críticos en instalación

### Verificar Estructura Backend
- [ ] `src/controllers/` contiene:
  - [ ] authController.js
  - [ ] sensoresController.js
  - [ ] alertasController.js
  - [ ] lotesController.js ✨
  - [ ] invernadesController.js ✨
  - [ ] recomendacionesController.js ✨

- [ ] `src/services/` contiene:
  - [ ] dpvService.js
  - [ ] predictionService.js
  - [ ] recommendationService.js

- [ ] `src/routes/` contiene:
  - [ ] auth.js
  - [ ] sensores.js
  - [ ] alertas.js
  - [ ] lotes.js
  - [ ] invernaderos.js
  - [ ] recomendaciones.js
  - [ ] metrics.js

- [ ] `src/middlewares/auth.js` presente con funciones de tokens

---

## 🚀 FASE 4: INICIO DEL BACKEND

### Ejecutar Backend
```powershell
npm run dev
```

**Deberías ver:**
```
🚀 Servidor ejecutándose en puerto 3000
✓ Conexión a PostgreSQL establecida correctamente
```

- [ ] Backend iniciado sin errores
- [ ] Conexión a PostgreSQL exitosa
- [ ] Servidor escuchando en puerto 3000
- [ ] No hay errores en consola

### Verificación de Conectividad
Abre otra ventana de PowerShell:
```powershell
curl -X GET http://localhost:3000
```

- [ ] Backend responde (no connection refused)

---

## 📱 FASE 5: CONFIGURACIÓN DEL FRONTEND

### Preparar Flutter
```bash
cd c:\Users\carli\OneDrive\Escritorio\agrosens_flutter\agrosens
```

- [ ] Carpeta frontend accesible
- [ ] `pubspec.yaml` presente y actualizado
- [ ] `lib/` contiene todas las pantallas

### Instalar Dependencias Flutter
```bash
flutter pub get
```

- [ ] Dependencias instaladas
- [ ] Sin errores de pub get
- [ ] `http` y `shared_preferences` disponibles

### Verificar Estructura Frontend
- [ ] `lib/services/api_service.dart` ✨ Creado
- [ ] `lib/screens/dashboard_screen.dart`
- [ ] `lib/screens/alertas_screen.dart`
- [ ] `lib/screens/historial_screen.dart`
- [ ] `lib/screens/registro_screen.dart`
- [ ] `lib/models/models.dart`
- [ ] `lib/widgets/widgets.dart`
- [ ] `lib/theme.dart`
- [ ] `lib/main.dart`

### Verificar Archivo .env del Frontend
- [ ] API_BASE_URL configurada (si es necesario)

---

## 🧪 FASE 6: PRUEBAS DE CONEXIÓN

### Prueba 1: Registrar Usuario
Usar Postman o curl:

```powershell
$json = @{
    email = "test@agrosens.com"
    password = "TestPassword123"
    nombre_completo = "Test User"
    telefono = "+57301234567"
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d $json
```

- [ ] Respuesta: 201 Created
- [ ] Token recibido
- [ ] Usuario guardado en BD

### Prueba 2: Login
```powershell
$json = @{
    email = "test@agrosens.com"
    password = "TestPassword123"
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d $json
```

- [ ] Respuesta: 200 OK
- [ ] Token válido recibido
- [ ] Datos de usuario en respuesta

### Prueba 3: Crear Invernadero (CON TOKEN)
Guardar el token recibido en $TOKEN

```powershell
$json = @{
    nombre = "Invernadero A"
    area_m2 = 500
    ubicacion_latitud = 4.7110
    ubicacion_longitud = -74.0721
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/v1/invernaderos `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d $json
```

- [ ] Respuesta: 201 Created
- [ ] Invernadero guardado
- [ ] ID devuelto

### Prueba 4: Obtener Invernaderos
```powershell
curl -X GET http://localhost:3000/api/v1/invernaderos `
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Respuesta: 200 OK
- [ ] Listado de invernaderos
- [ ] Total mostrado

### Prueba 5: Crear Lote
```powershell
$json = @{
    id_invernadero = 1  # Usar ID del invernadero creado
    nombre_lote = "Lote Tomates"
    especie = "Tomate"
    etapa_fenologica = "Vegetativo"
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/v1/lotes `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $TOKEN" `
  -d $json
```

- [ ] Respuesta: 201 Created
- [ ] Lote guardado
- [ ] Configuración por defecto creada

### Prueba 6: Obtener Alertas
```powershell
curl -X GET http://localhost:3000/api/v1/alertas `
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Respuesta: 200 OK (incluso si está vacío)
- [ ] Estructura JSON correcta

---

## 📱 FASE 7: EJECUTAR FRONTEND

### Opción A: Emulador Android
```bash
flutter emulators --launch <emulator-id>
flutter run
```

- [ ] Emulador iniciado
- [ ] Flutter build exitoso
- [ ] App abierta en emulador
- [ ] Pantalla de inicio visible

### Opción B: Dispositivo Físico
```bash
flutter run
```

- [ ] Dispositivo conectado (adb devices)
- [ ] Flutter build exitoso
- [ ] App instalada en dispositivo
- [ ] Pantalla de inicio visible

### Verificar Conexión Frontend-Backend
En la app Flutter:
- [ ] Intenta ir a la pantalla de registro/login
- [ ] Completa datos
- [ ] Envía formulario
- [ ] ¿Responde el backend? (revisar logs del backend)

---

## 🔍 FASE 8: VALIDACIÓN FINAL

### Base de Datos
- [ ] Conectar con DBeaver o pgAdmin
- [ ] Verificar usuario creado en tabla `usuarios`
- [ ] Verificar lote creado en tabla `lotes`
- [ ] Verificar registros en `logs_auditoria`

### Backend
- [ ] No hay errores en la consola
- [ ] Logs muestran requests entrantes
- [ ] Métricas de rendimiento registrándose
- [ ] Conexión a BD estable

### Frontend
- [ ] App se abre sin crashes
- [ ] Pantalla de login funcional
- [ ] Puede registrarse/loguearse
- [ ] Dashboard muestra datos (aunque sean simulados)

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### PostgreSQL

#### Error: "psql: no se pudo traducir el nombre del host"
- Verifica que PostgreSQL esté corriendo
- Reinicia el servicio: `net start PostgreSQL13`

#### Error: "FATAL: Ident authentication failed"
- Verifica contraseña en `.env`
- Contraseña correcta: `agrosens_secure_2026`

### Backend

#### Error: "Connect ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL no está corriendo
- Comando: `net start PostgreSQL13`

#### Puerto 3000 ya en uso
- Edita `.env`: `PORT=3001`
- O: `netstat -ano | findstr :3000` y mata el proceso

#### Error: "Cannot find module 'express'"
- Ejecuta: `npm install`
- Verifica `node_modules` existe

### Frontend

#### Error: "Failed to connect to server"
- Verifica que backend esté corriendo
- Verifica URL en `api_service.dart`
- Revisa firewall

#### "Connection timeout"
- Backend puede estar caído
- Reinicia con: `npm run dev`

---

## 📞 RECURSOS ADICIONALES

### Documentación Disponible
- ✅ `GUIA_INSTALACION_COMPLETA.md` - Instrucciones detalladas
- ✅ `VERIFICACION_REQUERIMIENTOS.md` - Cumplimiento de requisitos
- ✅ `API_FLUTTER_INTEGRATION.md` - Integración API
- ✅ `DATABASE_SCHEMA.md` - Esquema de BD
- ✅ `RESUMEN_DESARROLLO.md` - Resumen técnico

### Contactos y Support
- Backend documentation: `agrosens_backend/README.md`
- Flutter documentation: Flutter official docs
- PostgreSQL help: postgresql.org

---

## ✅ CONFIRMACIÓN FINAL

Una vez completado TODO, marca esta casilla final:

- [ ] **TODOS LOS PASOS COMPLETADOS**
- [ ] **SISTEMA FUNCIONAL VERIFICADO**
- [ ] **LISTO PARA DESARROLLO/PRODUCCIÓN**

---

**🎉 ¡Felicidades! AgroSenS está completamente instalado y configurado.**

---

**Fecha completada**: ___________________  
**Persona responsable**: ___________________  
**Notas adicionales**: 

_______________________________________________________________________________

_______________________________________________________________________________
