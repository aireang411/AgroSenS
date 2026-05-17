// ============================================================
// SERVICIO DE PREDICCIÓN Y DETECCIÓN DE TENDENCIAS
// Cumple con: RF-AP-02, RF-AP-04
// ============================================================

const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Calcula regresión lineal simple para detectar tendencias
 * @param {Array<{x: number, y: number}>} datos - Array de puntos con x (tiempo) y y (dpv)
 * @returns {Object} Parámetros de la recta (pendiente, intersección, r²)
 */
function calcularRegresionLineal(datos) {
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
 * @param {number} idLote - ID del lote a analizar
 * @param {number} ventanaMinutos - Ventana de tiempo a analizar en minutos
 * @returns {Object} Análisis de tendencia
 */
async function analizarTendenciaDPV(idLote, ventanaMinutos = 120) {
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

        const lecturas = await db.query(query, [idLote, ventanaMinutos]);

        if (lecturas.length < 4) {
            return {
                valido: false,
                error: 'Se requieren al menos 4 lecturas para análisis de tendencia',
                num_lecturas: lecturas.length
            };
        }

        // Convertir datos para análisis
        const datos = lecturas.map(l => ({
            x: parseFloat(l.x) || 0,
            y: parseFloat(l.y)
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
            dpv_actual: ultimaLectura.y,
            timestamp_ultima_lectura: ultimaLectura.timestamp,
            tendencia: regresion.pendiente > 0.01 ? 'creciente' : regresion.pendiente < -0.01 ? 'decreciente' : 'estable',
            lecturas: lecturas.slice(-5) // Últimas 5 lecturas para contexto
        };
    } catch (error) {
        logger.error('Error al analizar tendencia de DPV:', error);
        return {
            valido: false,
            error: error.message
        };
    }
}

/**
 * Proyecta DPV futuro basado en tendencia actual
 * @param {Object} tendencia - Resultado de analizarTendenciaDPV
 * @param {number} minutosFuturos - Minutos a proyectar hacia el futuro
 * @returns {Object} Proyección
 */
function proyectarDPVFuturo(tendencia, minutosFuturos = 120) {
    if (!tendencia.valido) {
        return {
            valido: false,
            error: 'Tendencia inválida para proyección'
        };
    }

    // Calcular tiempo en segundos
    const tiempoSegundos = minutosFuturos * 60;

    // Proyectar usando ecuación de la recta: y = mx + b
    const dpvProyectado = (tendencia.pendiente * tiempoSegundos) + tendencia.interseccion;

    return {
        valido: true,
        dpv_proyectado: parseFloat(dpvProyectado.toFixed(2)),
        minutos_futuros: minutosFuturos,
        confianza: tendencia.r2,
        trayectoria: dpvProyectado > tendencia.dpv_actual ? 'creciente' : 'decreciente'
    };
}

/**
 * Calcula probabilidad de estrés basada en tendencia
 * @param {Object} tendencia - Análisis de tendencia
 * @param {number} dpvUmbralCritico - Umbral crítico configurado
 * @param {number} minutosFuturos - Ventana de predicción
 * @returns {Object} Probabilidad de estrés
 */
function calcularProbabilidadEstrés(tendencia, dpvUmbralCritico = 1.5, minutosFuturos = 120) {
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

    if (tendencia.dpv_actual >= dpvUmbralCritico) {
        // Ya está en crisis
        probabilidad = 100;
    } else if (proyeccion.dpv_proyectado >= dpvUmbralCritico) {
        // Se espera que alcance el umbral

        // Calcular diferencia necesaria
        const diferencia = dpvUmbralCritico - tendencia.dpv_actual;
        const cambioProyectado = proyeccion.dpv_proyectado - tendencia.dpv_actual;

        if (cambioProyectado > 0) {
            // Está creciendo hacia el umbral
            probabilidad = Math.min(100, (cambioProyectado / diferencia) * 100);
            // Aumentar probabilidad según la pendiente (mayor pendiente = mayor riesgo)
            probabilidad = probabilidad * (1 + Math.abs(tendencia.pendiente) * 10);
            probabilidad = Math.min(100, probabilidad);
        }
    } else if (tendencia.pendiente > 0.01) {
        // Está creciendo pero aún debajo del umbral
        const margenSeguridad = (dpvUmbralCritico - tendencia.dpv_actual) / dpvUmbralCritico;
        probabilidad = (1 - margenSeguridad) * 50; // Máximo 50% de probabilidad
    }

    return {
        valido: true,
        probabilidad: Math.round(probabilidad),
        dpv_actual: tendencia.dpv_actual,
        dpv_proyectado: proyeccion.dpv_proyectado,
        dpv_umbral_critico: dpvUmbralCritico,
        tendencia: tendencia.tendencia,
        minutos_futuros: minutosFuturos,
        confianza: tendencia.r2
    };
}

/**
 * Análisis completo de riesgo para un lote
 * @param {number} idLote - ID del lote
 * @param {Object} umbrales - Umbrales configurados
 * @returns {Object} Evaluación de riesgo
 */
async function evaluarRiesgo(idLote, umbrales = {}) {
    const {
        dpv_critico = 1.5,
        dpv_preventivo = 1.0,
        ventana_prediccion_minutos = 120,
        probabilidad_umbral = 80
    } = umbrales;

    try {
        // Analizar tendencia
        const tendencia = await analizarTendenciaDPV(idLote, ventana_prediccion_minutos);

        if (!tendencia.valido) {
            return {
                valido: false,
                estado_riesgo: 'datos_insuficientes',
                error: tendencia.error
            };
        }

        // Calcular probabilidad de estrés
        const probabilidad = calcularProbabilidadEstrés(
            tendencia,
            dpv_critico,
            ventana_prediccion_minutos
        );

        // Determinar estado de riesgo
        let estadoRiesgo = 'estable';
        let requiereAlerta = false;

        if (tendencia.dpv_actual >= dpv_critico) {
            estadoRiesgo = 'critico';
            requiereAlerta = true;
        } else if (tendencia.dpv_actual >= dpv_preventivo) {
            estadoRiesgo = 'pre_critico';
            requiereAlerta = true;
        } else if (probabilidad.probabilidad >= probabilidad_umbral) {
            estadoRiesgo = 'pre_critico';
            requiereAlerta = true;
        }

        return {
            valido: true,
            estado_riesgo: estadoRiesgo,
            requiere_alerta: requiereAlerta,
            probabilidad_estrés: probabilidad.probabilidad,
            tendencia: tendencia.tendencia,
            dpv_actual: tendencia.dpv_actual,
            dpv_proyectado: probabilidad.dpv_proyectado,
            umbrales: {
                dpv_preventivo,
                dpv_critico
            },
            detalles: {
                tendencia,
                probabilidad
            }
        };
    } catch (error) {
        logger.error('Error al evaluar riesgo:', error);
        return {
            valido: false,
            error: error.message
        };
    }
}

module.exports = {
    calcularRegresionLineal,
    analizarTendenciaDPV,
    proyectarDPVFuturo,
    calcularProbabilidadEstrés,
    evaluarRiesgo
};
