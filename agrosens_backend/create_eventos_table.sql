CREATE TABLE eventos_operativos (
    id_evento SERIAL PRIMARY KEY,
    id_lote INTEGER NOT NULL REFERENCES lotes(id_lote) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN (
        'riego', 'fertilizacion', 'plagas', 'cosecha', 'poda', 
        'control_enfermedad', 'mantenimiento', 'otro'
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
    peso_kg DECIMAL(12, 2),
    calidad_visual VARCHAR(20) CHECK (calidad_visual IN ('excelente', 'buena', 'aceptable', 'deficiente')),
    cantidad_plantas INTEGER,
    rendimiento_estimado DECIMAL(10, 2),
    
    -- Otros
    observaciones TEXT,
    temperatura_ambiental_c DECIMAL(5, 2),
    humedad_relativa_pct DECIMAL(5, 2),
    registrado_por_dispositivo VARCHAR(100),
    
    -- Auditoría
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices para búsquedas frecuentes
CREATE INDEX idx_eventos_lote ON eventos_operativos(id_lote);
CREATE INDEX idx_eventos_usuario ON eventos_operativos(id_usuario);
CREATE INDEX idx_eventos_tipo ON eventos_operativos(tipo_evento);
CREATE INDEX idx_eventos_timestamp ON eventos_operativos(timestamp DESC);

-- Trigger para actualizar ultima_actualizacion
CREATE OR REPLACE FUNCTION actualizar_timestamp_eventos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_eventos_update BEFORE UPDATE ON eventos_operativos
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_eventos();
