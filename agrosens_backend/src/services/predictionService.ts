// ============================================================
// SERVICIO DE PREDICCIÓN Y DETECCIÓN DE TENDENCIAS
// Cumple con: RF-AP-02, RF-AP-04
// ============================================================

import db from '../config/database';
import logger from '../utils/logger';

interface DataPoint {
    x: number;
    y: number;
}

interface RegresionResult {
    valido: boolean;
    pendiente?: number;
    interseccion?: number;
    r2?: number;
    error?: string;
}

interface LecturaData {
    x: number;
    y: number;
    timestamp: Date;
    temperatura_celsius: number;
    humedad_relativa: number;
}

interface TendenciaResult {
    valido: boolean;
    num_lecturas?: number;
    ventana_minutos?: number;
    pendiente?: number;
    interseccion?: number;
    r2?: number;
    dpv_actual?: number;
    timestamp_ultima_lectura?: Date;
    tendencia?: string;
    lecturas?: LecturaData[];
    error?: string;
}

interface ProyeccionResult {
    valido: boolean;
    dpv_proyectado?: number;
    minutos_futuros?: number;
    confianza?: number;
    trayectoria?: string;
    error?: string;
}

interface ProbabilidadResult {
    valido: boolean;
    probabilidad: number;
    error?: string;
}

/**
 * Calcula regresión lineal simple para detectar tendencias
 * @param datos - Array de puntos con x (tiempo) y y (dpv)
 * @returns Parámetros de la recta (pendiente, intersección, r²)
 */
function calcularRegresionLineal(datos: DataPoint[]): RegresionResult {
    if (datos.length < 2) {
        return {
            valido: false,
            error: 'Se requieren al menos 2 puntos de datos'
        };
    }

    const n = datos.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    datos.forEach(punto => {
        sumX += punto.x;
        sumY += punto.y;
        sumXY += punto.x * punto.y;
        sumX2 += punto.x * punto.x;
        sumY2 += punto.y * punto.y;
    });

    const denominador = (n * sumX2) - (sumX * sumX);
    
    if (denominador === 0) {
        return {
            valido: false,
            error: 'No hay variación en los datos'
        };
    }

    const pendiente = ((n * sumXY) - (sumX * sumY)) / denominador;
    const interseccion = (sumY - pendiente * sumX) / n;
    
    // Calcular R² (coeficiente de correlación)
    const ssRes = datos.reduce((acc, p) => acc + Math.pow(p.y - (pendiente * p.x + interseccion), 2), 0);
    const ssTot = datos.reduce((acc, p) => acc + Math.pow(p.y - (sumY / n), 2), 0);
    const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    return {
        valido: true,
        pendiente: parseFloat(pendiente.toFixed(4)),
        interseccion: parseFloat(interseccion.toFixed(4)),
        r2: parseFloat(r2.toFixed(4))
    };
}

/**
 * Analiza tendencias de DPV en un período
 * @param idLote - ID del lote a analizar
 * @param ventanaMinutos - Ventana de tiempo a analizar en minutos
 * @returns Análisis de tendencia
 */
async function analizarTendenciaDPV(idLote: number, ventanaMinutos: number = 120): Promise<TendenciaResult> {
    try {
        // Obtener lecturas en la ventana de tiempo (RF-AP-02)
        const query = `
            SELECT 
                EXTRACT(EPOCH FROM (timestamp - (SELECT MIN(timestamp) FROM lecturas_sensores 
                    WHERE id_lote = $1 AND timestamp > NOW() - INTERVAL '1 minute' * $2))) as x,
                dpv_calculado as y,
                timestamp,
                temperatura_celsius,
                humedad_relativa
            FROM lecturas_sensores
            WHERE id_lote = $1
                AND timestamp > NOW() - INTERVAL '1 minute' * $2
                AND dpv_calculado IS NOT NULL
                AND valida = TRUE
            ORDER BY timestamp ASC
        `;

        const lecturas = await db.query(query, [idLote, ventanaMinutos]) as LecturaData[];

        if (lecturas.length < 4) {
            return {
                valido: false,
                error: 'Se requieren al menos 4 lecturas para análisis de tendencia',
                num_lecturas: lecturas.length
            };
        }

        // Convertir datos para análisis
        const datos: DataPoint[] = lecturas.map(l => ({
            x: l.x || 0,
            y: l.y
        }));

        // Calcular regresión
        const regresion = calcularRegresionLineal(datos);

        if (!regresion.valido) {
            return regresion;
        }

        // Obtener última lectura para proyección
        const ultimaLectura = lecturas[lecturas.length - 1];

        return {
            valido: true,
            num_lecturas: lecturas.length,
            ventana_minutos: ventanaMinutos,
            pendiente: regresion.pendiente,
            interseccion: regresion.interseccion,
            r2: regresion.r2,
            dpv_actual: ultimaLectura.y as unknown as number,
            timestamp_ultima_lectura: ultimaLectura.timestamp,
            tendencia: regresion.pendiente! > 0.01 ? 'creciente' : regresion.pendiente! < -0.01 ? 'decreciente' : 'estable',
            lecturas: lecturas.slice(-5) // Últimas 5 lecturas para contexto
        };
    } catch (error) {
        logger.error('Error al analizar tendencia de DPV:', error);
        return {
            valido: false,
            error: (error as Error).message
        };
    }
}

/**
 * Proyecta DPV futuro basado en tendencia actual
 * @param tendencia - Resultado de analizarTendenciaDPV
 * @param minutosFuturos - Minutos a proyectar hacia el futuro
 * @returns Proyección
 */
function proyectarDPVFuturo(tendencia: TendenciaResult, minutosFuturos: number = 120): ProyeccionResult {
    if (!tendencia.valido) {
        return {
            valido: false,
            error: 'Tendencia inválida para proyección'
        };
    }

    // Calcular tiempo en segundos
    const tiempoSegundos = minutosFuturos * 60;

    // Proyectar usando ecuación de la recta: y = mx + b
    const dpvProyectado = (tendencia.pendiente! * tiempoSegundos) + tendencia.interseccion!;

    return {
        valido: true,
        dpv_proyectado: parseFloat(dpvProyectado.toFixed(2)),
        minutos_futuros: minutosFuturos,
        confianza: tendencia.r2,
        trayectoria: dpvProyectado > tendencia.dpv_actual! ? 'creciente' : 'decreciente'
    };
}

/**
 * Calcula probabilidad de estrés basada en tendencia
 * @param tendencia - Análisis de tendencia
 * @param dpvUmbralCritico - Umbral crítico configurado
 * @param minutosFuturos - Ventana de predicción
 * @returns Probabilidad de estrés
 */
function calcularProbabilidadEstrés(
    tendencia: TendenciaResult,
    dpvUmbralCritico: number = 1.5,
    minutosFuturos: number = 120
): ProbabilidadResult {
    if (!tendencia.valido) {
        return {
            valido: false,
            probabilidad: 0,
            error: 'Tendencia inválida'
        };
    }

    // Proyectar DPV futuro
    const proyeccion = proyectarDPVFuturo(tendencia, minutosFuturos);

    if (!proyeccion.valido) {
        return {
            valido: false,
            probabilidad: 0,
            error: 'No se puede proyectar'
        };
    }

    // Calcular probabilidad
    let probabilidad = 0;

    if (tendencia.dpv_actual! >= dpvUmbralCritico) {
        // Ya está en crisis
        probabilidad = 100;
    } else if (proyeccion.dpv_proyectado! >= dpvUmbralCritico) {
        // Se espera que alcance el umbral
        // Calcular diferencia necesaria
        const diferencia = dpvUmbralCritico - tendencia.dpv_actual!;
        const cambioProyectado = proyeccion.dpv_proyectado! - tendencia.dpv_actual!;

        if (cambioProyectado > 0) {
            // Está creciendo hacia el umbral
            probabilidad = (cambioProyectado / diferencia) * 100;
            probabilidad = Math.min(95, probabilidad); // Máximo 95% si no ha llegado
        }
    } else if (tendencia.pendiente! > 0) {
        // Creciendo pero aún no llega
        const diferencia = dpvUmbralCritico - tendencia.dpv_actual!;
        const cambioProyectado = proyeccion.dpv_proyectado! - tendencia.dpv_actual!;
        probabilidad = (cambioProyectado / diferencia) * 100 * 0.5; // 50% de confianza
    }

    return {
        valido: true,
        probabilidad: Math.max(0, Math.min(100, probabilidad))
    };
}

export default {
    calcularRegresionLineal,
    analizarTendenciaDPV,
    proyectarDPVFuturo,
    calcularProbabilidadEstrés
};
