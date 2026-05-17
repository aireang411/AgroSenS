// ============================================================
// SERVICIO DE CÁLCULO DPV (Déficit de Presión de Vapor)
// Cumple con: RF-AP-01
// ============================================================

import logger from '../utils/logger';

interface DPVResult {
    valido: boolean;
    dpv?: number | null;
    es?: number;
    ea?: number;
    error?: string;
    temperatura?: number;
    humedadRelativa?: number;
}

interface LecturaInput {
    temperatura_celsius: number;
    humedad_relativa: number;
}

interface LecturaProcessada extends LecturaInput {
    dpv_calculado: number | null;
    presion_vapor_saturacion?: number;
    presion_vapor_real?: number;
    estado_dpv?: string | null;
    error?: string;
    procesada: boolean;
    timestamp_procesamiento?: Date;
}

interface UmbralesConfig {
    dpv_optimo?: number;
    dpv_preventivo?: number;
    dpv_critico?: number;
}

/**
 * Calcula la presión de vapor de saturación usando la fórmula de Magnus
 * @param temperatura - Temperatura en grados Celsius
 * @returns Presión de vapor de saturación en kPa
 */
function calcularPresionVaporSaturacion(temperatura: number): number {
    const a = 17.27;
    const b = 237.7; // Celsius
    
    const numerador = a * temperatura;
    const denominador = b + temperatura;
    
    const es = 0.6108 * Math.exp((numerador) / (denominador));
    
    return parseFloat(es.toFixed(2));
}

/**
 * Calcula la presión de vapor real
 * @param humedadRelativa - Humedad relativa en porcentaje (0-100)
 * @param presionVaporSaturacion - Presión de vapor de saturación en kPa
 * @returns Presión de vapor real en kPa
 */
function calcularPresionVaporReal(
    humedadRelativa: number,
    presionVaporSaturacion: number
): number {
    const ea = (humedadRelativa / 100) * presionVaporSaturacion;
    return parseFloat(ea.toFixed(2));
}

/**
 * Calcula el DPV (Déficit de Presión de Vapor)
 * DPV = es - ea
 * @param temperatura - Temperatura en grados Celsius
 * @param humedadRelativa - Humedad relativa en porcentaje (0-100)
 * @returns Objeto con dpv, es, ea y validaciones
 */
function calcularDPV(temperatura: number, humedadRelativa: number): DPVResult {
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
 * @param dpv - Valor de DPV calculado
 * @param umbrales - Objeto con dpv_optimo, dpv_preventivo, dpv_critico
 * @returns Estado: 'estable', 'pre_critico' o 'critico'
 */
function interpretarEstadoDPV(dpv: number, umbrales: UmbralesConfig = {}): string {
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
 * @param lectura - Objeto con temperatura_celsius y humedad_relativa
 * @param umbrales - Umbrales para interpretación
 * @returns Objeto procesado con DPV e interpretación
 */
function procesarLectura(lectura: LecturaInput, umbrales: UmbralesConfig = {}): LecturaProcessada {
    const { temperatura_celsius, humedad_relativa } = lectura;

    // Calcular DPV
    const dpvResult = calcularDPV(temperatura_celsius, humedad_relativa);

    if (!dpvResult.valido) {
        return {
            temperatura_celsius,
            humedad_relativa,
            dpv_calculado: null,
            estado_dpv: null,
            error: dpvResult.error,
            procesada: false
        };
    }

    // Interpretar estado
    const estadoDPV = interpretarEstadoDPV(dpvResult.dpv!, umbrales);

    return {
        temperatura_celsius,
        humedad_relativa,
        dpv_calculado: dpvResult.dpv || 0,
        presion_vapor_saturacion: dpvResult.es,
        presion_vapor_real: dpvResult.ea,
        estado_dpv: estadoDPV,
        procesada: true,
        timestamp_procesamiento: new Date()
    };
}

export default {
    calcularDPV,
    calcularPresionVaporSaturacion,
    calcularPresionVaporReal,
    interpretarEstadoDPV,
    procesarLectura
};
