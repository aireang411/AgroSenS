# 🚀 Guía Rápida: Instalar PostgreSQL en D:\

## Paso 1: Descargar PostgreSQL

1. Ve a: https://www.postgresql.org/download/windows/
2. Haz clic en **"Download the installer"**
3. Descarga la **versión más reciente** (ej: PostgreSQL 15.x)

## Paso 2: Ejecutar el Instalador

1. Abre el archivo `.exe` descargado
2. Haz clic en **"Next"** en la pantalla de bienvenida
3. **Installation Directory**: 
   - **Cambia** de `C:\Program Files\PostgreSQL` a `D:\PostgreSQL`
   - Copia y pega: `D:\PostgreSQL`
   - Haz clic en **"Next"**

## Paso 3: Seleccionar Componentes

Asegúrate de que estén marcados:
- ✅ PostgreSQL Server
- ✅ pgAdmin 4
- ✅ Stack Builder
- ✅ Command Line Tools

Haz clic en **"Next"**

## Paso 4: Configurar Base de Datos

**Data Directory**: Déjalo como está (D:\PostgreSQL\data)

**Database superuser password**: 
- Ingresa una contraseña segura (ej: `postgres123`)
- **IMPORTANTE: Anótala en un lugar seguro**
- Repite la contraseña

Haz clic en **"Next"**

## Paso 5: Puerto

**Port**: 5432 (por defecto)

Haz clic en **"Next"**

## Paso 6: Locale

**Locale**: Selecciona tu idioma

Haz clic en **"Next"**

## Paso 7: Resumen

Revisa los datos y haz clic en **"Install"**

*Esto tardará 2-5 minutos*

## Paso 8: Stack Builder

Cuando pregunte sobre Stack Builder: **Desmarcar** y hacer clic en **"Finish"**

---

## ✅ Verificar que PostgreSQL Está Instalado

Abre **PowerShell** y ejecuta:

```powershell
psql --version
```

Deberías ver algo como:
```
psql (PostgreSQL) 15.2
```

---

## 🗄️ Crear Base de Datos para AgroSenS

### Paso 1: Conectar a PostgreSQL

```powershell
psql -U postgres
```

Se te pedirá la contraseña que configuraste (ej: `postgres123`)

### Paso 2: Crear Usuario

Cuando estés dentro de psql, ejecuta:

```sql
CREATE USER agrosens_user WITH PASSWORD 'agrosens_secure_2026';
```

Deberías ver: `CREATE ROLE`

### Paso 3: Crear Base de Datos

```sql
CREATE DATABASE agrosens_db OWNER agrosens_user;
```

Deberías ver: `CREATE DATABASE`

### Paso 4: Habilitar Extensión UUID

```sql
\c agrosens_db
```

Luego:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Paso 5: Salir de psql

```
\q
```

---

## 📊 Crear Tablas

En PowerShell, navega a la carpeta del backend:

```powershell
cd "C:\Users\carli\OneDrive\Escritorio\agrosens_flutter\agrosens_backend"
```

Ejecuta el script SQL:

```powershell
psql -U agrosens_user -d agrosens_db -f init_db.sql
```

Si pregunta por contraseña, ingresa: `agrosens_secure_2026`

Deberías ver múltiples líneas con `CREATE TABLE`, `CREATE INDEX`, etc.

---

## 🔍 Verificar que Funcionó

En PowerShell:

```powershell
psql -U agrosens_user -d agrosens_db
```

Dentro de psql, ejecuta:

```sql
\dt
```

Deberías ver una lista de tablas:
```
              List of relations
 usuarios
 invernaderos
 lotes
 sensores
 lecturas_sensores
 configuracion_cultivo
 alertas
 recomendaciones
 notificaciones_push
 registros_reaccion_usuario
 metricas_rendimiento
 logs_auditoria
 errores_sensores_offline
```

Si ves esto, ¡PostgreSQL está correctamente configurado!

```sql
\q
```

---

## 📝 Valores para el archivo .env

Copia estos valores a tu archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrosens_db
DB_USER=agrosens_user
DB_PASSWORD=agrosens_secure_2026
```

---

## 🐛 Si Algo Sale Mal

### PostgreSQL no inicia
```powershell
# Ver estado del servicio
Get-Service PostgreSQL*

# Iniciar si está detenido
Start-Service postgresql-x64-15
```

### Error: "password authentication failed"
- Verifica que la contraseña en `.env` es: `agrosens_secure_2026`
- O usa la contraseña que estableciste durante la instalación

### Error: "database does not exist"
- Verifica que ejecutaste los pasos de creación de BD
- Ejecuta nuevamente: `psql -U agrosens_user -d agrosens_db -f init_db.sql`

### Error: "psql command not found"
- PostgreSQL no está en el PATH
- Intenta usar la ruta completa: `D:\PostgreSQL\bin\psql`

---

## 🎉 ¡Listo!

Cuando veas la lista de tablas, PostgreSQL está configurado correctamente.

Ahora puedes:

1. Editar `.env` con los valores correctos
2. Ejecutar `npm install`
3. Ejecutar `npm run dev`
4. El backend debería conectarse a PostgreSQL automáticamente

---

## 🔗 Usar pgAdmin (Interfaz Gráfica)

Si instalaste pgAdmin 4:

1. Abre el navegador: http://localhost:5050
2. Inicia sesión (usuario: `postgres`, contraseña: la que configuraste)
3. Servidor → PostgreSQL → agrosens_db
4. Ahora puedes ver y editar datos visualmente

---

**¡Listo! PostgreSQL está instalado en D:\ y AgroSenS está configurado.**
