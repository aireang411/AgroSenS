# 🚀 AgroSens - Actualización de Auto-Simulación e Interfaz

## ✅ CAMBIOS COMPLETADOS

### 1. Backend - Servicio de Scheduler Automático
**Archivo:** `src/services/schedulerService.ts` (NUEVO)

**Características:**
- Ejecuta simulación automática cada 5 minutos
- Genera lecturas de sensores realistas para todos los lotes activos
- Genera eventos operativos sintéticos con valores contextuales:
  - **Riego (40%)**: 200-800L, 15-60 min, método aleatorio (goteo/aspersión/microaspersión)
  - **Fertilización (30%)**: 4 tipos de insumos, 100-500g, 500-1500ppm
  - **Plagas (15%)**: 4 tipos comunes, severidad aleatoria (leve/moderada/grave)
  - **Cosecha (10%)**: kg realistas, 3 calidades, cantidad plantas
  - **Otros (5%)**: poda, mantenimiento, control de enfermedad

**Métodos principales:**
- `start()` - Inicia el scheduler
- `stop()` - Detiene el scheduler  
- `runSimulation()` - Ejecuta simulación completa
- `generateSensorReadings()` - Crea datos de sensores
- `generateOperationalEvents()` - Crea eventos operativos

### 2. Backend - Servidor Principal Actualizado
**Archivo:** `src/server.ts` (MODIFICADO)

**Cambios:**
```typescript
// Nuevo import
import SchedulerService from './services/schedulerService';

// En app.listen() - Después de conectar a BD
SchedulerService.start();

// En SIGTERM/SIGINT handlers
SchedulerService.stop();
```

**Efecto:** El servidor ahora inicia automáticamente la simulación cada 5 minutos

### 3. Frontend - Dashboard Mejorado
**Archivo:** `lib/screens/dashboard_screen.dart` (ACTUALIZADO)

**Nuevas funcionalidades:**
- ✅ Carga de datos en paralelo (sensores, lecturas, alertas, eventos)
- ✅ Pull-to-refresh (deslizar hacia abajo para actualizar)
- ✅ Grid de 4 métricas: Temperatura, Humedad, Presión Vapor Sat., VP Real
- ✅ Sección "Sensores Activos" mostrando los 3 primeros sensores
- ✅ Sección "Alertas Recientes" con las últimas 3 alertas
- ✅ Sección "Eventos Recientes" con los últimos 5 eventos operativos
- ✅ Badges de eventos con colores personalizados

**Cambios clave:**
```dart
// Nueva variable de estado
List<Sensor> _sensores = [];
List<Alerta> _alertas = [];
List<EventoOperativo> _eventosRecientes = [];

// Método renombrado y mejorado
_loadLecturasReales() → _loadLoteDashboard()
// Ahora carga todo en paralelo con Future.wait()

// RefreshIndicator para pull-to-refresh
RefreshIndicator(
  onRefresh: _loadLoteDashboard,
  child: SingleChildScrollView(...)
)

// Nuevo método para mostrar tarjetas de estadísticas
_buildStatCard(label, value, color)
```

---

## 📋 COMPILACIÓN

✅ **Backend compilado exitosamente**
```bash
npm run build
# Resultado: Sin errores (TypeScript compilation SUCCESS)
```

---

## 🧪 PRUEBAS RECOMENDADAS

### Paso 1: Iniciar el Backend
```bash
cd agrosens_backend
npm run dev
```

**Indicadores esperados en los logs:**
```
[info]: ✓ Conexión a base de datos establecida
[info]: ✅ Scheduler iniciado - Simulación cada 5 minutos
[info]: 📊 Ejecutando simulación automática...
[info]: ✅ Simulación completada: X lecturas, Y eventos
```

### Paso 2: Verificar Base de Datos
Ejecutar en PostgreSQL:
```sql
-- Ver nuevas lecturas de sensores (generadas cada 5 min)
SELECT id_lectura, id_sensor, temperatura, humedad, dpv, timestamp 
FROM lecturas_sensores 
ORDER BY timestamp DESC 
LIMIT 20;

-- Ver nuevos eventos operativos
SELECT id_evento, tipo_evento, timestamp, volumen_litros, tipo_insumo, tipo_plaga
FROM eventos_operativos 
ORDER BY timestamp DESC 
LIMIT 10;
```

**Resultado esperado:** Nuevas filas aparecen cada 5 minutos

### Paso 3: Ejecutar la App Flutter
```bash
cd agrosens
flutter run
```

**Verificar:**
1. ✅ Dashboard muestra tarjetas de métricas (Temp, Humedad, VP)
2. ✅ Lista de sensores activos aparece
3. ✅ Alertas recientes se muestran
4. ✅ Eventos operativos últimos aparecen
5. ✅ Pull-to-refresh funciona (deslizar hacia abajo)
6. ✅ Datos se actualizan automáticamente cada 5 min

---

## 🔧 DEBUGGING

### Problema: Puerto 3000 ya en uso
```bash
# Windows - Encontrar proceso
netstat -ano | grep 3000

# Linux/Mac
lsof -i :3000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Problema: Scheduler no genera eventos
**Verificar:**
1. Hay lotes con `activo = true` en BD
2. Hay sensores con `activo = true` en los lotes
3. Revisar logs para errores en `SchedulerService`

### Problema: Dashboard no muestra datos
**Verificar:**
1. Token JWT válido
2. Lote seleccionado existe
3. Revisar errores en Flutter DevTools

---

## 📊 DATOS DE PRUEBA

- **Usuario:** prueba@agrosens.com / Prueba123!
- **Lote:** ID 29 "Lote Test"
- **Sensores:** 2 sensores en el lote de prueba

---

## ✨ PRÓXIMOS PASOS OPCIONALES

1. **Auto-refresh en Frontend** - Agregar Timer.periodic() a 60 segundos
2. **Mejorar Alertas** - Visualización más detallada en alertas_screen.dart
3. **Mejorar Registro** - Mejor organización de formularios por tipo en registro_screen.dart
4. **Gráficos mejorados** - Charts de tendencias en dashboard

---

## 📝 NOTAS TÉCNICAS

**SchedulerService:**
- Evita sincronización si ya está corriendo
- Manejo robusto de errores por lote
- Logging detallado de operaciones
- Limpieza elegante al apagar

**Dashboard:**
- Usa `Future.wait()` para carga paralela (más eficiente)
- `RefreshIndicator` con `AlwaysScrollableScrollPhysics` para mejorar UX
- `GridView.count(shrinkWrap: true)` evita overflow
- Estado separado para cada sección (escalable)

**Compilación:**
- TypeScript estricto sin errores
- Compatible con versiones existentes del backend
- Sin breaking changes en las APIs
