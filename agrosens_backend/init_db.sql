-- ============================================================
-- AGROSENS - Database Creation Script
-- PostgreSQL Database Setup
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA 1: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'agricultor' CHECK (rol IN ('agricultor', 'administrador')),
    telefono VARCHAR(20),
    estado BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ============================================================
-- TABLA 2: invernaderos
-- ============================================================
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

-- ============================================================
-- TABLA 3: lotes
-- ============================================================
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

-- ============================================================
-- TABLA 4: sensores
-- ============================================================
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

-- ============================================================
-- TABLA 5: lecturas_sensores
-- ============================================================
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

-- ============================================================
-- TABLA 6: configuracion_cultivo
-- ============================================================
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

-- ============================================================
-- TABLA 7: alertas
-- ============================================================
CREATE TABLE alertas (
    id_alerta SERIAL PRIMARY KEY,
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_lectura BIGINT REFERENCES lecturas_sensores(id_lectura),
    tipo_riesgo VARCHAR(50) NOT NULL CHECK (tipo_riesgo IN ('estable', 'pre_critico', 'critico')),
    dpv_desencadenante DECIMAL(5, 2),
    probabilidad_estrés INTEGER CHECK (probabilidad_estrés >= 0 AND probabilidad_estrés <= 100),
    mensaje_texto TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'generada' CHECK (estado IN ('generada', 'enviada', 'vista', 'resuelta')),
    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_envio TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    resolvio_usuario INTEGER REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_alertas_lote ON alertas(id_lote);
CREATE INDEX idx_alertas_usuario ON alertas(id_usuario);
CREATE INDEX idx_alertas_estado ON alertas(estado);
CREATE INDEX idx_alertas_fecha ON alertas(fecha_generacion DESC);

-- ============================================================
-- TABLA 8: recomendaciones
-- ============================================================
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

-- ============================================================
-- TABLA 9: notificaciones_push
-- ============================================================
CREATE TABLE notificaciones_push (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_alerta INTEGER NOT NULL REFERENCES alertas(id_alerta) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token_fcm VARCHAR(500),
    titulo VARCHAR(255) NOT NULL,
    cuerpo TEXT NOT NULL,
    payload JSON,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'fallida', 'expirada')),
    intentos_envio INTEGER DEFAULT 0,
    timestamp_envio TIMESTAMP,
    timestamp_apertura TIMESTAMP,
    timestamp_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    codigo_error VARCHAR(100)
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones_push(id_usuario);
CREATE INDEX idx_notificaciones_estado ON notificaciones_push(estado);
CREATE INDEX idx_notificaciones_alerta ON notificaciones_push(id_alerta);

-- ============================================================
-- TABLA 10: registros_reaccion_usuario
-- ============================================================
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

-- ============================================================
-- TABLA 11: metricas_rendimiento
-- ============================================================
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

-- ============================================================
-- TABLA 12: logs_auditoria
-- ============================================================
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

-- ============================================================
-- TABLA 13: errores_sensores_offline
-- ============================================================
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

-- ============================================================
-- TABLA 14: presets_configuracion (Para cultivos predefinidos)
-- ============================================================
CREATE TABLE presets_configuracion (
    id_preset SERIAL PRIMARY KEY,
    especie VARCHAR(100) NOT NULL,
    etapa_fenologica VARCHAR(100),
    temp_min DECIMAL(5, 2),
    temp_max DECIMAL(5, 2),
    humedad_min DECIMAL(5, 2),
    humedad_max DECIMAL(5, 2),
    dpv_critico DECIMAL(5, 2),
    dpv_preventivo DECIMAL(5, 2),
    dpv_optimo DECIMAL(5, 2),
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

INSERT INTO presets_configuracion (especie, etapa_fenologica, temp_min, temp_max, humedad_min, humedad_max, dpv_critico, dpv_preventivo, dpv_optimo, descripcion)
VALUES
    ('Tomate', 'Vegetativo', 15, 28, 65, 85, 1.8, 1.2, 0.9, 'Tomate en fase de crecimiento vegetativo'),
    ('Tomate', 'Floración', 18, 26, 60, 80, 1.5, 1.0, 0.8, 'Tomate en floración'),
    ('Tomate', 'Fructificación', 20, 28, 65, 80, 1.6, 1.1, 0.8, 'Tomate en producción'),
    ('Lechuga', 'Vegetativo', 10, 20, 70, 90, 1.2, 0.8, 0.6, 'Lechuga en crecimiento'),
    ('Pimiento', 'Vegetativo', 18, 28, 60, 80, 1.6, 1.0, 0.8, 'Pimiento en crecimiento'),
    ('Pepino', 'Vegetativo', 18, 30, 70, 90, 1.4, 0.9, 0.7, 'Pepino en crecimiento'),
    ('Berenjena', 'Fructificación', 20, 30, 60, 75, 1.7, 1.2, 0.9, 'Berenjena en producción');

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Función para calcular DPV
CREATE OR REPLACE FUNCTION calcular_dpv(
    temperatura DECIMAL,
    humedad_relativa DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    es DECIMAL;
    ea DECIMAL;
    dpv DECIMAL;
BEGIN
    -- Cálculo de presión de vapor de saturación (es) usando Magnus
    es := 0.6108 * EXP((17.27 * temperatura) / (temperatura + 237.3));
    
    -- Cálculo de presión de vapor actual (ea)
    ea := (humedad_relativa / 100) * es;
    
    -- Cálculo de DPV
    dpv := es - ea;
    
    RETURN ROUND(dpv::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para actualizar timestamp de última actualización
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLA: eventos_operativos
-- Registro de actividades manuales: riego, fertilización, plagas
-- ============================================================
CREATE TABLE eventos_operativos (
    id_evento SERIAL PRIMARY KEY,
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN (
        'riego', 'fertilizacion', 'plagas', 'cosecha', 
        'poda', 'control_enfermedad', 'mantenimiento', 'otro'
    )),
    descripcion TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Riego
    volumen_litros DECIMAL(10, 2),
    duracion_minutos INTEGER,
    metodo_riego VARCHAR(100),
    
    -- Fertilización
    tipo_insumo VARCHAR(100),
    dosis_gramos DECIMAL(10, 2),
    metodo_aplicacion VARCHAR(100),
    concentracion_ppm DECIMAL(10, 2),
    
    -- Plagas
    tipo_plaga VARCHAR(100),
    severidad VARCHAR(20) CHECK (severidad IN ('leve', 'moderada', 'grave')),
    accion_tomada TEXT,
    producto_utilizado VARCHAR(100),
    dosis_producto DECIMAL(10, 2),
    
    -- Cosecha
    peso_kg DECIMAL(10, 2),
    calidad_visual VARCHAR(50) CHECK (calidad_visual IN ('excelente', 'buena', 'aceptable', 'deficiente')),
    cantidad_plantas INTEGER,
    rendimiento_estimado DECIMAL(10, 2),
    
    -- Otros
    observaciones TEXT,
    temperatura_ambiental_c DECIMAL(5, 2),
    humedad_relativa_pct DECIMAL(5, 2),
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por_dispositivo VARCHAR(255)
);

CREATE INDEX idx_eventos_lote ON eventos_operativos(id_lote);
CREATE INDEX idx_eventos_usuario ON eventos_operativos(id_usuario);
CREATE INDEX idx_eventos_tipo ON eventos_operativos(tipo_evento);
CREATE INDEX idx_eventos_timestamp ON eventos_operativos(timestamp DESC);
CREATE INDEX idx_eventos_lote_timestamp ON eventos_operativos(id_lote, timestamp DESC);

-- Triggers para actualizar timestamps
CREATE TRIGGER trg_usuarios_update BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_invernaderos_update BEFORE UPDATE ON invernaderos
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_lotes_update BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_sensores_update BEFORE UPDATE ON sensores
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_eventos_operativos_update BEFORE UPDATE ON eventos_operativos
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ============================================================
-- DATOS INICIALES PARA PRUEBAS
-- ============================================================

-- Usuario de prueba (contraseña: será hasheada en la aplicación)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol, telefono)
VALUES 
    ('admin@agrosens.com', '$2b$10$YourHashedPasswordHere1', 'Administrador Sistema', 'administrador', '+57301234567'),
    ('agricultor@agrosens.com', '$2b$10$YourHashedPasswordHere2', 'Juan Pérez', 'agricultor', '+57301234568');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

