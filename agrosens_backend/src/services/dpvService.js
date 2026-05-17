// ============================================================
// SERVICIO DE CÁLCULO DPV (Déficit de Presión de Vapor)
// Cumple con: RF-AP-01
// ============================================================

const logger = require('../utils/logger');

/**
 * Calcula la presión de vapor de saturación usando la fórmula de Magnus
 * @param {number} temperatura - Temperatura en grados Celsius
 * @returns {number} Presión de vapor de saturación en kPa
 */
function calcularPresionVaporSaturacion(temperatura) {
    const a = 17.27;
    const b = 237.7; // Celsius
    
    const numerador = a * temperatura;
    const denominador = b + temperatura;
    
    const es = 0.6108 * Math.exp((numerador) / (denominador));
    
    return parseFloat(es.toFixed(2));
}

/**
 * Calcula la presión de vapor real
 * @param {number} humedadRelativa - Humedad relativa en porcentaje (0-100)
 * @param {number} presionVaporSaturacion - Presión de vapor de saturación en kPa
 * @returns {number} Presión de vapor real en kPa
 */
function calcularPresionVaporReal(humedadRelativa, presionVaporSaturacion) {
    const ea = (humedadRelativa / 100) * presionVaporSaturacion;
    return parseFloat(ea.toFixed(2));
}

/**
 * Calcula el DPV (Déficit de Presión de Vapor)
 * DPV = es - ea
 * @param {number} temperatura - Temperatura en grados Celsius
 * @param {number} humedadRelativa - Humedad relativa en porcentaje (0-100)
 * @returns {Object} Objeto con dpv, es, ea y validaciones
 */
function calcularDPV(temperatura, humedadRelativa) {
    // Validar rangos de entrada (RF-AP-01)
    if (temperatura < -10 || temperatura > 60) {
        logger.warn(`Temperatura fuera de rango: ${temperatura}°C`);
        return {
            valido: false,
            error: 'Temperatura fuera de rango (-10 a 60°C)',
            dpv: null
        };
    }

    if (humedadRelativa < 0 || humedadRelativa > 100) {
        logger.warn(`Humedad relativa fuera de rango: ${humedadRelativa}%`);
        return {
            valido: false,
            error: 'Humedad relativa fuera de rango (0 a 100%)',
            dpv: null
        };
    }

    try {
        // Calcular presión de vapor de saturación
        const es = calcularPresionVaporSaturacion(temperatura);

        // Calcular presión de vapor real
        const ea = calcularPresionVaporReal(humedadRelativa, es);

        // Calcular DPV
        const dpv = es - ea;

        // Validar resultado
        if (!isFinite(dpv)) {
            logger.error('DPV calculado es infinito o NaN');
            return {
                valido: false,
                error: 'Error en el cálculo del DPV',
                dpv: 0,
                es,
                ea
            };
        }

        return {
            valido: true,
            dpv: parseFloat(dpv.toFixed(2)),
            es: parseFloat(es.toFixed(2)),
            ea: parseFloat(ea.toFixed(2)),
            temperatura,
            humedadRelativa
        };
    } catch (error) {
        logger.error('Error al calcular DPV:', error);
        return {
            valido: false,
            error: 'Error al calcular DPV',
            dpv: 0
        };
    }
}

/**
 * Interpreta el estado del DPV según umbrales configurables
 * @param {number} dpv - Valor de DPV calculado
 * @param {Object} umbrales - Objeto con dpv_optimo, dpv_preventivo, dpv_critico
 * @returns {string} Estado: 'estable', 'pre_critico' o 'critico'
 */
function interpretarEstadoDPV(dpv, umbrales = {}) {
    const {
        dpv_optimo = 0.8,
        dpv_preventivo = 1.0,
        dpv_critico = 1.5
    } = umbrales;

    if (dpv <= dpv_optimo) {
        return 'estable';
    } else if (dpv <= dpv_preventivo) {
        return 'estable'; // Aún dentro de lo óptimo
    } else if (dpv <= dpv_critico) {
        return 'pre_critico';
    } else {
        return 'critico';
    }
}

/**
 * Procesa un conjunto de lecturas y calcula su DPV
 * @param {Object} lectura - Objeto con temperatura_celsius y humedad_relativa
 * @param {Object} umbrales - Umbrales para interpretación
 * @returns {Object} Objeto procesado con DPV e interpretación
 */
function procesarLectura(lectura, umbrales = {}) {
    const { temperatura_celsius, humedad_relativa } = lectura;

    // Calcular DPV
    const dpvResult = calcularDPV(temperatura_celsius, humedad_relativa);

    if (!dpvResult.valido) {
        return {
            ...lectura,
            dpv_calculado: null,
            estado_dpv: null,
            error: dpvResult.error,
            procesada: false
        };
    }

    // Interpretar estado
    const estadoDPV = interpretarEstadoDPV(dpvResult.dpv, umbrales);

    return {
        ...lectura,
        dpv_calculado: dpvResult.dpv,
        presion_vapor_saturacion: dpvResult.es,
        presion_vapor_real: dpvResult.ea,
        estado_dpv: estadoDPV,
        procesada: true,
        timestamp_procesamiento: new Date()
    };
}

module.exports = {
    calcularDPV,
    calcularPresionVaporSaturacion,
    calcularPresionVaporReal,
    interpretarEstadoDPV,
    procesarLectura
};
