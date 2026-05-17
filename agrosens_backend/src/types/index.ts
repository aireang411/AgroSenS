// ============================================================
// TIPOS GLOBALES COMPARTIDOS
// ============================================================

import { Request } from 'express';

/**
 * Interfaz para Request extendido con información del usuario
 */
export interface CustomRequest extends Request {
    usuario?: {
        id_usuario: number;
        email: string;
        rol: string;
    };
}

/**
 * Interfaz de respuesta estándar
 */
export interface StandardResponse<T> {
    success: boolean;
    mensaje?: string;
    data?: T;
    error?: string;
    code?: string;
}

/**
 * Interfaz de usuario
 */
export interface Usuario {
    id_usuario: string;
    email: string;
    nombre_completo: string;
    rol: 'agricultor' | 'administrador';
    telefono?: string;
    estado: boolean;
    password_hash: string;
    intentos_fallidos?: number;
    bloqueado_hasta?: Date;
}

/**
 * Interfaz de evento operativo
 */
export interface EventoOperativo {
    id_evento: number;
    id_lote: number;
    id_usuario: number;
    tipo_evento: 'riego' | 'fertilizacion' | 'plagas' | 'cosecha' | 'poda' | 'control_enfermedad' | 'mantenimiento' | 'otro';
    descripcion?: string;
    timestamp: Date;
    
    // Riego
    volumen_litros?: number;
    duracion_minutos?: number;
    metodo_riego?: string;
    
    // Fertilización
    tipo_insumo?: string;
    dosis_gramos?: number;
    metodo_aplicacion?: string;
    concentracion_ppm?: number;
    
    // Plagas
    tipo_plaga?: string;
    severidad?: 'leve' | 'moderada' | 'grave';
    accion_tomada?: string;
    producto_utilizado?: string;
    dosis_producto?: number;
    
    // Cosecha
    peso_kg?: number;
    calidad_visual?: 'excelente' | 'buena' | 'aceptable' | 'deficiente';
    cantidad_plantas?: number;
    rendimiento_estimado?: number;
    
    // Otros
    observaciones?: string;
    temperatura_ambiental_c?: number;
    humedad_relativa_pct?: number;
    
    // Auditoría
    fecha_creacion?: Date;
    ultima_actualizacion?: Date;
    registrado_por_dispositivo?: string;
}

export default {};
