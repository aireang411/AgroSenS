# 📊 AUDITORÍA DE VARIABLES CAPTURADAS - AgroSenS

## Estado de Implementación

### 1. ✅ VARIABLES AMBIENTALES (Sensores DHT22)

**Tabla:** `lecturas_sensores`

| Variable | Unidad | Estado | BD | API | Modelo | Simulación |
|----------|--------|--------|----|----|--------|-----------|
| Temperatura del aire | °C | ✅ SÍ | ✅ | ✅ | ✅ | ✅ |
| Humedad Relativa (HR) | % | ✅ SÍ | ✅ | ✅ | ✅ | ✅ |
| Presión Vapor Saturación | kPa | ✅ SÍ | ✅ | ✅ | ✅ | ✅ |
| Presión Vapor Real | kPa | ✅ SÍ | ✅ | ✅ | ✅ | ✅ |

**Frecuencia:** Cada 30 min (en simulación), campo timestamp registra cada lectura

---

### 2. ❌ VARIABLES EDÁFICAS (Sustrato/Raíz) 

**Tabla:** NO EXISTE

| Variable | Unidad | Estado | BD | API | Modelo | Nota |
|----------|--------|--------|----|----|--------|------|
| pH del sustrato | pH | ❌ NO | ❌ | ❌ | ❌ | Requiere sensor Atlas Scientific |
| Conductividad Eléctrica (CE) | mS/cm | ❌ NO | ❌ | ❌ | ❌ | Requiere sensor Atlas Scientific |
| Temperatura de raíz | °C | ❌ NO | ❌ | ❌ | ❌ | Requiere sensor DS18B20 |

**Por qué no:** 
- No está implementado en hardware
- No hay endpoints en API
- No hay tabla en BD para almacenarlas

---

### 3. ❌ VARIABLES OPERATIVAS (Registro Manual/App)

**Tabla:** NO EXISTE (`eventos_operativos` no se creó)

| Variable | Tipo | Estado | BD | API | Modelo | Pantalla |
|----------|------|--------|----|----|--------|----------|
| Evento de riego | {volumen, duración, timestamp} | ❌ NO | ❌ | ❌ | ❌ | ❌ |
| Fertilización | {tipo_insumo, dosis, método} | ❌ NO | ❌ | ❌ | ❌ | ❌ |
| Incidencia de plagas | {tipo, severidad, acción} | ❌ NO | ❌ | ❌ | ❌ | ❌ |
| Cosecha | {peso_kg, calidad_visual} | ❌ NO | ❌ | ❌ | ❌ | ❌ |
| Interacción con alertas | {timestamp_apertura, acción} | ❌ NO | ❌ | ❌ | ❌ | ❌ |

**Pantalla existente:** `registro_screen.dart` existe pero NO persiste datos al backend

---

### 4. ⚠️ VARIABLES DERIVADAS (Calculadas)

| Variable | Fórmula | Estado | Backend | Alerta |
|----------|---------|--------|---------|--------|
| **DPV (Déficit de Presión de Vapor)** | e_s - e_a | ✅ SÍ | Ecuación Magnus | > 1.5 kPa |
| **Tendencia de DPV** | Regresión lineal últimas 4 | ❌ NO | No implementada | N/A |
| **Probabilidad de desviación** | Heurística histórico | ❌ NO | No implementada | N/A |
| **Estado semafórico** | DPV + tendencia | ⚠️ PARCIAL | Solo usa DPV | Verde/Amarillo/Rojo |

---

## 📋 RESUMEN

### ✅ Completamente Implementado (25%)
- ✅ Temperatura del aire
- ✅ Humedad Relativa  
- ✅ DPV (cálculo básico)
- ✅ Presiones vapor

### ⚠️ Parcialmente Implementado (25%)
- ⚠️ Estado semafórico (solo usa DPV, no tendencia)
- ⚠️ Registro manual de eventos (UI existe, pero no guarda)

### ❌ NO Implementado (50%)
- ❌ pH del sustrato
- ❌ Conductividad eléctrica
- ❌ Temperatura de raíz
- ❌ Registro de riego
- ❌ Registro de fertilización
- ❌ Registro de plagas
- ❌ Registro de cosecha
- ❌ Tendencia de DPV
- ❌ Probabilidad de desviación

---

## 🔧 IMPACTO EN FUNCIONALIDADES

### Funcionalidades Bloqueadas por Variables Faltantes

| Requisito | Bloqueado por |
|-----------|---------------|
| RF-AP-05 (Ajuste dinámico por etapa) | Variables edáficas + operativas |
| RF-ADM-01 (Auditoría de prácticas) | Eventos operativos |
| RF-AP-04 (Predicción de riesgos) | Histórico de plagas + probabilidad |
| Objetivo #3 (Validación de impacto) | Registro de cosecha |
| Análisis de tendencia | Cálculo de regresión lineal |

---

## 💡 PRIORIDAD DE IMPLEMENTACIÓN

### 🔴 CRÍTICO (Afecta requerimientos core)
1. **Evento de riego** - RF-ADM-01
2. **DPV Tendencia** - Mejor anticipación de estrés
3. **Incidencia de plagas** - RF-AP-04

### 🟡 IMPORTANTE (Funcionalidades secundarias)
4. Evento de fertilización
5. Temperatura de raíz (sensor opcional)
6. Probabilidad de desviación

### 🟢 NICE-TO-HAVE (Mejoras)
7. pH y conductividad (requiere hardware adicional)
8. Registro de cosecha

---

## 📝 CONCLUSIÓN

El sistema está **50% implementado** en variables. Concentrarse en:
1. **Persistencia de eventos operativos** (riego, fertilización, plagas)
2. **Cálculos derivados avanzados** (tendencia, probabilidad)
3. **Validación de impacto** mediante cosecha
