# 🚀 GUÍA COMPLETA: INSTALACIÓN Y CONFIGURACIÓN DE AGROSENS

## ✅ ESTADO ACTUAL

El proyecto AgroSenS está **99% completo**:

- ✅ **Backend**: Node.js/Express completamente implementado
- ✅ **Frontend**: Flutter con conexión configurada
- ✅ **Base de datos**: Script PostgreSQL completo
- ✅ **API**: 7 rutas principales implementadas
- ✅ **Autenticación**: JWT completamente funcional
- ✅ **Servicios**: DPV, predicción, recomendaciones

---

## 📋 PASO 1: INSTALAR POSTGRESQL EN D:\ººººººº

### 1.1 Descargar PostgreSQL

1. Ve a: **https://www.postgresql.org/download/windows/**
2. Descarga el instalador (versión 15 o superior recomendada)

### 1.2 Ejecutar Instalador

1. Abre el archivo `.exe`
2. En **Installation Directory**: cambia a `D:\PostgreSQL`
3. Mantén los componentes por defecto
4. En **Database superuser password**: `postgres123`
5. Puerto: `5432` (por defecto)
6. Haz clic en **Install**

### 1.3 Verificar Instalación

Abre PowerShell y ejecuta:

```powershell
psql --version
```

Deberías ver:
```
psql (PostgreSQL) 15.x
```

---

## 📊 PASO 2: CREAR BASE DE DATOS Y TABLAS

### 2.1 Conectar a PostgreSQL

```powershell
psql -U postgres
```

Se te pedirá la contraseña: `postgres123`

### 2.2 Crear Usuario

Dentro de psql, ejecuta:

```sql
CREATE USER agrosens_user WITH PASSWORD 'agrosens_secure_2026';
```

### 2.3 Crear Base de Datos

```sql
CREATE DATABASE agrosens_db OWNER agrosens_user;
```

### 2.4 Habilitar Extensión UUID

```sql
\c agrosens_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### 2.5 Ejecutar Script SQL

En PowerShell, navega a la carpeta del backend:

```powershell
cd "c:\Users\carli\OneDrive\Escritorio\agrosens_flutter\agrosens_backend"
```

Ejecuta:

```powershell
psql -U agrosens_user -d agrosens_db -f init_db.sql
```

Ingresa la contraseña cuando se pida: `agrosens_secure_2026`

### 2.6 Verificar Tablas

```powershell
psql -U agrosens_user -d agrosens_db
```

Dentro de psql:

```sql
\dt
```

Deberías ver todas las tablas (usuarios, invernaderos, lotes, sensores, etc.)

Salir:

```sql
\q
```

---

## 🚀 PASO 3: INSTALAR DEPENDENCIAS DEL BACKEND

```powershell
cd "c:\Users\carli\OneDrive\Escritorio\agrosens_flutter\agrosens_backend"
npm install
```

---

## ⚙️ PASO 4: VERIFICAR ARCHIVO .env

El archivo `.env` ya está creado. Verifica que tenga:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrosens_db
DB_USER=agrosens_user
DB_PASSWORD=agrosens_secure_2026
NODE_ENV=development
PORT=3000
JWT_SECRET=agrosens_super_secret_jwt_key_min_32_chars_2026_secure
```

---

## 🎯 PASO 5: INICIAR BACKEND

```powershell
npm run dev
```

Deberías ver:

```
🚀 Servidor ejecutándose en puerto 3000
✓ Conexión a PostgreSQL establecida correctamente
```

Si ves esto, ¡El backend está lista! 🎉

---

## 📱 PASO 6: CONFIGURAR Y EJECUTAR FRONTEND (FLUTTER)

### 6.1 Instalar Dependencias

```bash
cd "c:\Users\carli\OneDrive\Escritorio\agrosens_flutter\agrosens"
flutter pub get
```

### 6.2 Ejecutar en Emulador o Dispositivo

```bash
flutter run
```

El frontend se conectará automáticamente al backend en `http://localhost:3000`

---

## 🧪 PRUEBAS RÁPIDAS

### 1️⃣ Registrar Usuario (Postman o curl)

**POST** `http://localhost:3000/api/v1/auth/register`

Body JSON:
```json
{
  "email": "agricultor@agrosens.com",
  "password": "Segura123",
  "nombre_completo": "Juan Pérez",
  "telefono": "+57301234567"
}
```

### 2️⃣ Login

**POST** `http://localhost:3000/api/v1/auth/login`

Body JSON:
```json
{
  "email": "agricultor@agrosens.com",
  "password": "Segura123"
}
```

Respuesta esperada:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id_usuario": 1,
    "email": "agricultor@agrosens.com",
    "nombre_completo": "Juan Pérez",
    "rol": "agricultor"
  }
}
```

### 3️⃣ Crear Invernadero

**POST** `http://localhost:3000/api/v1/invernaderos`

Headers:
```
Authorization: Bearer [token_del_login]
Content-Type: application/json
```

Body JSON:
```json
{
  "nombre": "Invernadero A",
  "ubicacion_latitud": 4.7110,
  "ubicacion_longitud": -74.0721,
  "direccion": "Calle 123 #45",
  "area_m2": 500
}
```

### 4️⃣ Crear Lote

**POST** `http://localhost:3000/api/v1/lotes`

Headers:
```
Authorization: Bearer [token_del_login]
```

Body JSON:
```json
{
  "id_invernadero": 1,
  "nombre_lote": "Lote Tomates",
  "especie": "Tomate",
  "etapa_fenologica": "Vegetativo"
}
```

---

## ✨ FUNCIONALIDADES IMPLEMENTADAS

### ✅ Requerimientos Funcionales Cumplidos

| Código | Requisito | Estado |
|--------|-----------|--------|
| RF-AP-01 | Cálculo automático de DPV | ✅ Implementado |
| RF-AP-02 | Detección de tendencias | ✅ Implementado |
| RF-AP-03 | Recomendaciones en lenguaje natural | ✅ Implementado |
| RF-AP-04 | Alertas proactivas | ✅ Implementado |
| RF-AP-05 | Ajuste dinámico de umbrales | ✅ Implementado |
| RF-ADM-01 | Gestión de sensores | ✅ Implementado |
| RF-SEC-01 | Autenticación JWT | ✅ Implementado |
| RF-UX-01 | Dashboard semafórico | ✅ En frontend |
| RF-BD-01 | Registro de reacción | ✅ Implementado |
| RF-INF-01 | Métricas de rendimiento | ✅ Implementado |

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### PostgreSQL no se conecta

1. Verifica que el servicio esté ejecutándose:
   ```powershell
   Get-Service PostgreSQL*
   ```

2. Si no está ejecutándose, inicia:
   ```powershell
   Start-Service PostgreSQL13
   ```

### Backend no se conecta a BD

Verifica el archivo `.env`:
```powershell
cat .env
```

Debería mostrar los valores correctos

### Puerto 3000 ya está en uso

Usa otro puerto editando `.env`:
```env
PORT=3001
```

### Problema: "Cannot GET /api/v1/..."

El servidor no está corriendo. Ejecuta:
```powershell
npm run dev
```

---

## 📞 DOCUMENTACIÓN ADICIONAL

- **API_FLUTTER_INTEGRATION.md**: Guía de integración API
- **DATABASE_SCHEMA.md**: Esquema completo de BD
- **RESUMEN_DESARROLLO.md**: Resumen técnico

---

## ✅ LISTA DE VERIFICACIÓN FINAL

- [ ] PostgreSQL instalado en D:\
- [ ] Base de datos `agrosens_db` creada
- [ ] Archivo `.env` correctamente configurado
- [ ] `npm install` completado
- [ ] Backend ejecutándose (`npm run dev`)
- [ ] Frontend compilando sin errores
- [ ] Conexión API funcional (puedes probar login)
- [ ] Datos guardándose en PostgreSQL

---

**🎉 ¡Si todo está marcado, tu sistema AgroSenS está completamente funcional!**

Para soporte técnico o dudas, revisa la documentación en las carpetas del proyecto.
