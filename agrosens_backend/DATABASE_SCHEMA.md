# Schema de Base de Datos - AgroSenS
## PostgreSQL Database Design

### Descripción General
Este documento define el schema completo de la base de datos PostgreSQL para AgroSenS, incluyendo todas las tablas, relaciones y restricciones necesarias para cumplir con los requisitos funcionales.

---

## 1. Tabla: usuarios
**Propósito**: Almacenar información de usuarios (agricultores y administradores)
**Cumple con**: RF-SEC-01 (Gestión de Autenticación)

```sql
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    rol ENUM('agricultor', 'administrador') NOT NULL DEFAULT 'agricultor',
    telefono VARCHAR(20),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT password_length CHECK (LENGTH(password_hash) > 0)
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
```

---

## 2. Tabla: invernaderos
**Propósito**: Representar unidades físicas macro de producción
**Cumple con**: RF-ADM-01 (Gestión de Dispositivos)

```sql
CREATE TABLE invernaderos (
    id_invernadero SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    ubicacion_latitud DECIMAL(10, 8),
    ubicacion_longitud DECIMAL(11, 8),
    direccion TEXT,
    orientacion VARCHAR(50),
    area_m2 DECIMAL(10, 2),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invernaderos_usuario ON invernaderos(id_usuario);
CREATE INDEX idx_invernaderos_estado ON invernaderos(estado);
```

---

## 3. Tabla: lotes
**Propósito**: Unidad operativa mínima de análisis (cultivos específicos dentro de invernaderos)
**Cumple con**: RF-ADM-01 (Gestión de Dispositivos)

```sql
CREATE TABLE lotes (
    id_lote SERIAL PRIMARY KEY,
    id_invernadero INTEGER NOT NULL REFERENCES invernaderos(id_invernadero) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    nombre_lote VARCHAR(255) NOT NULL,
    especie VARCHAR(100) NOT NULL,
    etapa_fenologica VARCHAR(100),
    fecha_siembra DATE,
    fecha_cosecha_estimada DATE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lotes_invernadero ON lotes(id_invernadero);
CREATE INDEX idx_lotes_usuario ON lotes(id_usuario);
CREATE INDEX idx_lotes_activo ON lotes(activo);
```

---

## 4. Tabla: sensores
**Propósito**: Representación digital de dispositivos IoT
**Cumple con**: RF-ADM-01 (Gestión de Nodos y Dispositivos)

```sql
CREATE TABLE sensores (
    id_sensor SERIAL PRIMARY KEY,
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_dispositivo VARCHAR(255) UNIQUE NOT NULL,
    nombre_sensor VARCHAR(255) NOT NULL,
    tipo_sensor VARCHAR(50) NOT NULL CHECK (tipo_sensor IN ('temperatura', 'humedad', 'dht22', 'multiparametro')),
    estado_activo BOOLEAN DEFAULT TRUE,
    ultima_comunicacion TIMESTAMP,
    fecha_calibracion DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sensores_lote ON sensores(id_lote);
CREATE INDEX idx_sensores_dispositivo ON sensores(id_dispositivo);
CREATE INDEX idx_sensores_estado ON sensores(estado_activo);
```

---

## 5. Tabla: lecturas_sensores
**Propósito**: Registro inmutable de mediciones (temperatura, humedad, DPV)
**Cumple con**: RF-AP-01, RF-AP-02, RF-AP-03

```sql
CREATE TABLE lecturas_sensores (
    id_lectura BIGSERIAL PRIMARY KEY,
    id_sensor INTEGER NOT NULL REFERENCES sensores(id_sensor) ON DELETE CASCADE,
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperatura_celsius DECIMAL(5, 2) NOT NULL CHECK (temperatura_celsius >= -10 AND temperatura_celsius <= 60),
    humedad_relativa DECIMAL(5, 2) NOT NULL CHECK (humedad_relativa >= 0 AND humedad_relativa <= 100),
    dpv_calculado DECIMAL(5, 2),
    presion_vapor_saturacion DECIMAL(5, 2),
    presion_vapor_real DECIMAL(5, 2),
    valida BOOLEAN DEFAULT TRUE,
    fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lecturas_sensor_timestamp ON lecturas_sensores(id_sensor, timestamp DESC);
CREATE INDEX idx_lecturas_lote_timestamp ON lecturas_sensores(id_lote, timestamp DESC);
CREATE INDEX idx_lecturas_timestamp ON lecturas_sensores(timestamp DESC);
CREATE INDEX idx_lecturas_dpv ON lecturas_sensores(dpv_calculado);
```

---

## 6. Tabla: configuracion_cultivo
**Propósito**: Umbrales y reglas agronómicas por especie y etapa fenológica
**Cumple con**: RF-AP-05 (Ajuste Dinámico de Umbrales)

```sql
CREATE TABLE configuracion_cultivo (
    id_configuracion SERIAL PRIMARY KEY,
    id_lote INTEGER UNIQUE REFERENCES lotes(id_lote) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    especie VARCHAR(100) NOT NULL,
    etapa_fenologica VARCHAR(100),
    temp_min DECIMAL(5, 2) NOT NULL DEFAULT 10,
    temp_max DECIMAL(5, 2) NOT NULL DEFAULT 30,
    humedad_min DECIMAL(5, 2) NOT NULL DEFAULT 60,
    humedad_max DECIMAL(5, 2) NOT NULL DEFAULT 95,
    dpv_critico DECIMAL(5, 2) NOT NULL DEFAULT 1.5 CHECK (dpv_critico > 0 AND dpv_critico <= 5),
    dpv_preventivo DECIMAL(5, 2) NOT NULL DEFAULT 1.0 CHECK (dpv_preventivo > 0 AND dpv_preventivo <= 5),
    dpv_optimo DECIMAL(5, 2) NOT NULL DEFAULT 0.8,
    ventana_prediccion_minutos INTEGER DEFAULT 120 CHECK (ventana_prediccion_minutos > 0),
    probabilidad_umbral INTEGER DEFAULT 80 CHECK (probabilidad_umbral > 0 AND probabilidad_umbral <= 100),
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INTEGER REFERENCES usuarios(id_usuario),
    CONSTRAINT dpv_order CHECK (dpv_optimo < dpv_preventivo AND dpv_preventivo < dpv_critico)
);

CREATE INDEX idx_configuracion_lote ON configuracion_cultivo(id_lote);
CREATE INDEX idx_configuracion_usuario ON configuracion_cultivo(id_usuario);
```

---

## 7. Tabla: alertas
**Propósito**: Eventos de riesgo detectados por el sistema
**Cumple con**: RF-AP-04 (Disparo de Alertas Proactivas)

```sql
CREATE TABLE alertas (
    id_alerta SERIAL PRIMARY KEY,
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_lectura INTEGER REFERENCES lecturas_sensores(id_lectura),
    tipo_riesgo VARCHAR(50) NOT NULL CHECK (tipo_riesgo IN ('estable', 'pre_critico', 'critico')),
    dpv_desencadenante DECIMAL(5, 2),
    probabilidad_estrés INTEGER CHECK (probabilidad_estrés >= 0 AND probabilidad_estrés <= 100),
    mensaje_texto TEXT NOT NULL,
    estado ENUM('generada', 'enviada', 'vista', 'resuelta') DEFAULT 'generada',
    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_envio TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    resolvio_usuario INTEGER REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_alertas_lote ON alertas(id_lote);
CREATE INDEX idx_alertas_usuario ON alertas(id_usuario);
CREATE INDEX idx_alertas_estado ON alertas(estado);
CREATE INDEX idx_alertas_fecha ON alertas(fecha_generacion DESC);
```

---

## 8. Tabla: recomendaciones
**Propósito**: Traducción de datos técnicos a instrucciones humanas comprensibles
**Cumple con**: RF-AP-03 (Generación de Recomendaciones)

```sql
CREATE TABLE recomendaciones (
    id_recomendacion SERIAL PRIMARY KEY,
    id_alerta INTEGER NOT NULL REFERENCES alertas(id_alerta) ON DELETE CASCADE,
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    nivel_severidad VARCHAR(50) NOT NULL CHECK (nivel_severidad IN ('bajo', 'medio', 'alto', 'critico')),
    texto_recomendacion TEXT NOT NULL,
    acciones_sugeridas JSON,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recomendaciones_alerta ON recomendaciones(id_alerta);
CREATE INDEX idx_recomendaciones_lote ON recomendaciones(id_lote);
```

---

## 9. Tabla: notificaciones_push
**Propósito**: Registro de notificaciones enviadas
**Cumple con**: RF-AP-04 (Disparo de Alertas Proactivas), RF-BD-01 (Tiempos de Reacción)

```sql
CREATE TABLE notificaciones_push (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_alerta INTEGER NOT NULL REFERENCES alertas(id_alerta) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token_fcm VARCHAR(500),
    titulo VARCHAR(255) NOT NULL,
    cuerpo TEXT NOT NULL,
    payload JSON,
    estado ENUM('pendiente', 'enviada', 'fallida', 'expirada') DEFAULT 'pendiente',
    intentos_envio INTEGER DEFAULT 0,
    timestamp_envio TIMESTAMP,
    timestamp_apertura TIMESTAMP,
    timestamp_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    codigo_error VARCHAR(100)
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones_push(id_usuario);
CREATE INDEX idx_notificaciones_estado ON notificaciones_push(estado);
CREATE INDEX idx_notificaciones_alerta ON notificaciones_push(id_alerta);
```

---

## 10. Tabla: registros_reaccion_usuario
**Propósito**: Registro de tiempos de reacción del usuario ante alertas
**Cumple con**: RF-BD-01 (Registro de Tiempos de Reacción)

```sql
CREATE TABLE registros_reaccion_usuario (
    id_registro SERIAL PRIMARY KEY,
    id_notificacion UUID UNIQUE NOT NULL REFERENCES notificaciones_push(id_notificacion) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    id_alerta INTEGER NOT NULL REFERENCES alertas(id_alerta),
    timestamp_envio TIMESTAMP NOT NULL,
    timestamp_apertura TIMESTAMP NOT NULL,
    tiempo_reaccion_segundos INTEGER NOT NULL GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (timestamp_apertura - timestamp_envio))::INTEGER) STORED,
    accion_usuario VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reaccion_usuario ON registros_reaccion_usuario(id_usuario);
CREATE INDEX idx_reaccion_tiempo ON registros_reaccion_usuario(tiempo_reaccion_segundos);
```

---

## 11. Tabla: metricas_rendimiento
**Propósito**: Monitoreo de disponibilidad y rendimiento del backend
**Cumple con**: RF-INF-01 (Monitoreo de Disponibilidad)

```sql
CREATE TABLE metricas_rendimiento (
    id_metrica SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endpoint VARCHAR(255),
    metodo_http VARCHAR(10),
    tiempo_respuesta_ms INTEGER,
    estado_http INTEGER,
    estado_servicio BOOLEAN,
    latencia_promedio_ms DECIMAL(8, 2),
    tasa_error_porcentaje DECIMAL(5, 2),
    usuario_concurrentes INTEGER,
    sensores_procesados INTEGER,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metricas_timestamp ON metricas_rendimiento(timestamp DESC);
CREATE INDEX idx_metricas_endpoint ON metricas_rendimiento(endpoint);
```

---

## 12. Tabla: logs_auditoria
**Propósito**: Registro inmutable de actividades críticas
**Cumple con**: Requisito de Seguridad (Logs de Actividad)

```sql
CREATE TABLE logs_auditoria (
    id_log SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    tipo_evento VARCHAR(100) NOT NULL,
    descripcion TEXT,
    entidad_afectada VARCHAR(100),
    id_entidad INTEGER,
    valores_anteriores JSON,
    valores_nuevos JSON,
    direccion_ip VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT event_types CHECK (tipo_evento IN ('login', 'logout', 'crear_lote', 'actualizar_umbral', 'crear_alerta', 'modificar_sensor', 'cambio_contraseña'))
);

CREATE INDEX idx_auditoria_usuario ON logs_auditoria(id_usuario);
CREATE INDEX idx_auditoria_evento ON logs_auditoria(tipo_evento);
CREATE INDEX idx_auditoria_timestamp ON logs_auditoria(timestamp DESC);
```

---

## 13. Tabla: errores_sensores_offline
**Propósito**: Registro de sensores sin comunicación
**Cumple con**: Validación de Datos (Heartbeat)

```sql
CREATE TABLE errores_sensores_offline (
    id_error SERIAL PRIMARY KEY,
    id_sensor INTEGER NOT NULL REFERENCES sensores(id_sensor),
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote),
    timestamp_deteccion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tiempo_offline_minutos INTEGER,
    resuelto BOOLEAN DEFAULT FALSE,
    fecha_resolucion TIMESTAMP
);

CREATE INDEX idx_errores_sensor ON errores_sensores_offline(id_sensor);
CREATE INDEX idx_errores_sin_resolver ON errores_sensores_offline(resuelto);
```

---

## Relaciones Principales

```
usuarios (1) ---- (*) invernaderos
usuarios (1) ---- (*) lotes
usuarios (1) ---- (*) sensores
usuarios (1) ---- (*) alertas
usuarios (1) ---- (*) configuracion_cultivo
usuarios (1) ---- (*) logs_auditoria

invernaderos (1) ---- (*) lotes

lotes (1) ---- (*) sensores
lotes (1) ---- (*) lecturas_sensores
lotes (1) ---- (*) alertas
lotes (1) ---- (*) recomendaciones
lotes (1) ---- (1) configuracion_cultivo

sensores (1) ---- (*) lecturas_sensores
sensores (1) ---- (*) errores_sensores_offline

alertas (1) ---- (*) recomendaciones
alertas (1) ---- (*) notificaciones_push
alertas (1) ---- (*) registros_reaccion_usuario

notificaciones_push (1) ---- (1) registros_reaccion_usuario
```

---

## Requisitos de Seguridad Implementados

1. **Autenticación**: Tabla `usuarios` con `password_hash` (sin texto plano)
2. **Control de Acceso**: Restricciones FK para garantizar que usuarios solo accedan sus datos
3. **Auditoría**: Tabla `logs_auditoria` para eventos críticos
4. **Integridad**: Constraints CHECK en valores numéricos
5. **Timestamps**: Todos los registros incluyen metadata temporal

---

## Politica de Retención de Datos

- **Telemetría detallada** (lecturas_sensores): 6 meses
- **Alertas y recomendaciones**: 1 año
- **Logs de auditoría**: 2 años (requisito legal)
- **Métricas de rendimiento**: 90 días (comprimida a promedios después)

