@echo off
REM ============================================================
REM AGROSENS - Script de Instalación Automatizada para Windows
REM ============================================================

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║      AGROSENS BACKEND - INSTALACIÓN AUTOMATIZADA       ║
echo ║         Sistema de Predicción de Estrés Hídrico       ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Variables de configuración
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=agrosens_db
set DB_USER=agrosens_user
set DB_PASSWORD=agrosens_secure_2026
set POSTGRES_PASSWORD=postgres123

echo.
echo [1/5] Verificando requisitos previos...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js encontrado: 
    node --version
)

REM Verificar npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está instalado
    pause
    exit /b 1
) else (
    echo ✅ npm encontrado:
    npm --version
)

echo.
echo [2/5] Verificando PostgreSQL...
echo.

REM Verificar psql
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: PostgreSQL no está instalado
    echo.
    echo Para instalar PostgreSQL:
    echo 1. Descarga desde: https://www.postgresql.org/download/windows/
    echo 2. Instala en: D:\PostgreSQL
    echo 3. Establece contraseña para usuario 'postgres'
    echo 4. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
) else (
    echo ✅ PostgreSQL encontrado:
    psql --version
)

echo.
echo [3/5] Creando usuario y base de datos...
echo.

REM Crear usuario y BD (requiere que postgres esté en PATH)
echo ℹ️  Se te pedirá la contraseña del usuario 'postgres' de PostgreSQL
echo.

psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Usuario creado correctamente
) else (
    echo ⚠️  El usuario podría ya existir
)

psql -U postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Base de datos creada correctamente
) else (
    echo ⚠️  La BD podría ya existir
)

psql -U postgres -d %DB_NAME% -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>nul
echo ✅ Extensión UUID habilitada

echo.
echo [4/5] Importando esquema de base de datos...
echo.

REM Ejecutar script SQL
psql -U %DB_USER% -d %DB_NAME% -f init_db.sql
if %errorlevel% neq 0 (
    echo ❌ ERROR al importar el esquema
    pause
    exit /b 1
) else (
    echo ✅ Esquema importado correctamente
)

echo.
echo [5/5] Configurando backend Node.js...
echo.

REM Copiar .env si no existe
if not exist .env (
    copy .env.example .env
    echo ✅ Archivo .env creado
    echo.
    echo ⚠️  IMPORTANTE: Edita .env y verifica los valores
) else (
    echo ✅ Archivo .env ya existe
)

REM Instalar dependencias
echo.
echo Instalando dependencias Node.js...
call npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR al instalar dependencias
    pause
    exit /b 1
) else (
    echo ✅ Dependencias instaladas correctamente
)

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║         ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📋 Próximos pasos:
echo.
echo 1. Verifica el archivo .env:
echo    - Abre: notepad .env
echo    - Verifica que los valores son correctos
echo.
echo 2. Inicia el servidor:
echo    - npm run dev     (para desarrollo)
echo    - npm start       (para producción)
echo.
echo 3. Verifica que funciona:
echo    - Abre: http://localhost:3000/health
echo    - Deberías ver una respuesta JSON
echo.
echo 📚 Para más información, lee:
echo    - README.md
echo    - RESUMEN_DESARROLLO.md
echo    - INSTALACION_POSTGRESQL.md
echo.
echo 🚀 ¡El backend está listo para ejecutarse!
echo.
pause
