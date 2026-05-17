# AgroSenS Backend - Guía de Instalación y Configuración

## 📋 Requisitos Previos

- Node.js 16.0.0 o superior
- npm 8.0.0 o superior
- PostgreSQL 12.0 o superior

---

## 🗄️ Instalación de PostgreSQL en Disco D

### Paso 1: Descargar PostgreSQL

1. Ve a [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Descarga la versión más reciente del instalador de PostgreSQL para Windows

### Paso 2: Instalar PostgreSQL en Disco D

1. Ejecuta el instalador descargado
2. Cuando se solicite la **ruta de instalación**, elige: `D:\PostgreSQL`
3. **Nota el puerto** (por defecto es 5432)
4. Establece una **contraseña para el usuario postgres** (recuerda esta contraseña)
5. Elige instalar **pgAdmin** (gestor gráfico, opcional pero recomendado)
6. Completa la instalación

### Paso 3: Verificar la Instalación

Abre PowerShell y ejecuta:

```powershell
# Verificar que PostgreSQL está instalado
psql --version

# Conectar a PostgreSQL (usando usuario postgres)
psql -U postgres
```

Si te pide contraseña, ingresa la que configuraste.

---

## 📦 Creación de la Base de Datos

### Paso 1: Conectarse como Administrador

```powershell
psql -U postgres
```

Ingresa la contraseña de postgres.

### Paso 2: Crear Usuario para AgroSenS

```sql
-- Crear usuario
CREATE USER agrosens_user WITH PASSWORD 'your_secure_password_here';

-- Otorgar permisos de creación de base de datos
ALTER USER agrosens_user CREATEDB;
```

### Paso 3: Crear la Base de Datos

```sql
-- Crear base de datos
CREATE DATABASE agrosens_db OWNER agrosens_user;

-- Conectar a la base de datos
\c agrosens_db

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Paso 4: Ejecutar Script de Inicialización

```powershell
# Salir de psql si estás dentro
\q

# Ejecutar el script SQL desde la carpeta del backend
psql -U agrosens_user -d agrosens_db -f init_db.sql
```

**Nota**: Si solicita contraseña, usa: `your_secure_password_here`

---

## 🚀 Configuración del Backend

### Paso 1: Instalar Dependencias

```powershell
cd agrosens_backend
npm install
```

### Paso 2: Crear Archivo .env

Copia `.env.example` a `.env`:

```powershell
Copy-Item .env.example .env
```

Edita el archivo `.env` con tus valores reales:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrosens_db
DB_USER=agrosens_user
DB_PASSWORD=your_secure_password_here
DB_SSL=false

# JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro_minimo_32_caracteres_aqui
JWT_EXPIRE=24h

# Puerto
PORT=3000

# Ambiente
NODE_ENV=development
```

### Paso 3: Iniciar el Servidor

**Desarrollo (con reinicio automático):**
```powershell
npm run dev
```

**Producción:**
```powershell
npm start
```

Deberías ver:
```
✓ Conexión a base de datos establecida
🚀 Servidor AgroSenS ejecutándose en puerto 3000
```

---

## ✅ Pruebas de Conexión

### Opción 1: Usar Postman o similar

**Registrar Usuario:**
```
POST http://localhost:3000/api/v1/auth/register

{
  "email": "test@example.com",
  "password": "password123",
  "nombre_completo": "Usuario Prueba",
  "rol": "agricultor"
}
```

**Login:**
```
POST http://localhost:3000/api/v1/auth/login

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Opción 2: Verificar directamente con psql

```powershell
psql -U agrosens_user -d agrosens_db

# En psql, ejecuta:
SELECT COUNT(*) FROM usuarios;
```

---

## 🔍 Verificar la Base de Datos desde pgAdmin

1. Abre pgAdmin (instalado con PostgreSQL)
2. **Servidores** > Click derecho > **Registrar** > **Servidor**
3. **General**: Nombre = "AgroSenS"
4. **Conexión**:
   - Host: `localhost`
   - Puerto: `5432`
   - Nombre BD: `agrosens_db`
   - Usuario: `agrosens_user`
   - Contraseña: (la que configuraste)
5. Guarda

Ahora puedes ver todas las tablas, datos y ejecutar queries desde pgAdmin.

---

## 📊 Estructura de Tablas Creadas

Las siguientes tablas se crearán automáticamente con el script `init_db.sql`:

1. **usuarios** - Usuarios del sistema
2. **invernaderos** - Instalaciones físicas
3. **lotes** - Unidades de cultivo
4. **sensores** - Dispositivos IoT
5. **lecturas_sensores** - Mediciones de sensores
6. **configuracion_cultivo** - Umbrales por especie
7. **alertas** - Eventos de riesgo
8. **recomendaciones** - Sugerencias agronómicas
9. **notificaciones_push** - Registro de notificaciones
10. **registros_reaccion_usuario** - Tiempos de reacción
11. **metricas_rendimiento** - Monitoreo del backend
12. **logs_auditoria** - Auditoría de actividades
13. **errores_sensores_offline** - Registro de sensores sin conexión

---

## 🔧 Troubleshooting

### PostgreSQL no inicia después de instalar en D:

```powershell
# Verifica el estado del servicio
Get-Service PostgreSQL*

# Si no está corriendo, inicia el servicio
Start-Service postgresql-x64-15  # (ajusta la versión)
```

### Error: "could not connect to database server"

```powershell
# Verifica que PostgreSQL está escuchando en el puerto correcto
netstat -an | findstr 5432

# Si no aparece, reinicia el servicio
Stop-Service postgresql-x64-15
Start-Service postgresql-x64-15
```

### Error: "password authentication failed"

Verifica:
1. El usuario `agrosens_user` existe: `psql -U postgres -c "SELECT * FROM pg_user;"`
2. La contraseña es correcta en `.env`
3. El usuario tiene permisos adecuados

### Error: "database does not exist"

```powershell
# Verifica que la BD se creó
psql -U postgres -c "SELECT datname FROM pg_database;"
```

---

## 📝 Variables de Entorno Importantes

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la BD | `agrosens_db` |
| `DB_USER` | Usuario de BD | `agrosens_user` |
| `DB_PASSWORD` | Contraseña de usuario | (segura) |
| `JWT_SECRET` | Clave para tokens JWT | (mínimo 32 caracteres) |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Ambiente | `development` o `production` |

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `tail -f logs/app.log`
2. Verifica que PostgreSQL está corriendo: `psql -U postgres`
3. Asegúrate de que el puerto 3000 no está en uso
4. Reinicia el servidor: `npm run dev`

---

## ✨ Próximos Pasos

Una vez que el backend esté corriendo:

1. Conecta tu aplicación Flutter a `http://localhost:3000`
2. Crea usuarios de prueba
3. Registra sensores y lotes
4. Prueba el envío de lecturas
5. Verifica la generación de alertas

---

**Última actualización**: Abril 2026
**Versión**: 1.0.0
