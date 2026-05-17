// ============================================================
// SERVICIO DE RECOMENDACIONES EN LENGUAJE NATURAL
// Cumple con: RF-AP-03
// ============================================================

const logger = require('../utils/logger');

/**
 * Diccionario de recomendaciones por estado y severidad
 */
const DICCIONARIO_RECOMENDACIONES = {
    estable: {
        bajo: {
            titulo: '✓ Cultivo en óptimas condiciones',
            texto: 'El cultivo se encuentra en condiciones fisiológicas ideales. Continúa monitoreando.',
            acciones: ['Mantener régimen de riego actual', 'Continuar con ventilación programada']
        }
    },
    pre_critico: {
        medio: {
            titulo: '⚠ Riesgo moderado de estrés hídrico',
            texto: 'Se detecta una tendencia creciente de déficit de presión de vapor. El cultivo puede presentar estrés en las próximas 1-2 horas si las condiciones continúan.',
            acciones: [
                'Incrementar la frecuencia de riego en un 15-20%',
                'Activar sistemas de nebulización si están disponibles',
                'Incrementar ventilación para reducir temperatura',
                'Verificar funcionamiento de sensores'
            ]
        },
        alto: {
            titulo: '⚠ Riesgo elevado de estrés hídrico',
            texto: 'Se detecta una fuerte tendencia hacia el estrés hídrico. Se recomienda intervención inmediata para evitar daños en el cultivo.',
            acciones: [
                'Incrementar riego inmediatamente en 30-40%',
                'Activar todos los sistemas de humidificación disponibles',
                'Aumentar ventilación al máximo para reducir temperatura',
                'Considerar sombreo temporal si hay exceso de luz solar',
                'Revisar estado físico de las plantas para detectar síntomas tempranos'
            ]
        }
    },
    critico: {
        alto: {
            titulo: '🔴 ALERTA CRÍTICA - Estrés hídrico inminente',
            texto: 'El déficit de presión de vapor ha superado umbrales críticos. El cultivo está en riesgo inmediato de daño fisiológico irreversible.',
            acciones: [
                'RIEGO DE EMERGENCIA: Aumentar suministro de agua en 50-60%',
                'Activar máxima potencia de todos sistemas de humidificación',
                'Reducir exposición a luz solar (sombreo de emergencia)',
                'Maximizar ventilación para enfriamiento rápido',
                'Inspeccionar plantas inmediatamente para signos de marchitez',
                'Considerar medidas de recuperación post-estrés (fertilizantes de emergencia)'
            ]
        }
    }
};

/**
 * Diccionario específico por especie
 */
const DICCIONARIO_ESPECIES = {
    tomate: {
        pre_critico: 'Para tomates, un DPV elevado afecta principalmente la fructificación y causa rajaduras en frutos.',
        critico: 'Para tomates, el estrés hídrico severo detiene el cuajado y causa abortamiento floral.'
    },
    lechuga: {
        pre_critico: 'Para lechugas, el estrés hídrico causa endurecimiento de hojas y reduce calidad comercial.',
        critico: 'Para lechugas, el estrés severo causa quemadura de borde y marchitez irreversible.'
    },
    pimiento: {
        pre_critico: 'Para pimientos, el estrés hídrico reduce cuajado de frutos y genera frutos pequeños.',
        critico: 'Para pimientos, el estrés severo causa abortamiento masivo de flores y frutos.'
    },
    pepino: {
        pre_critico: 'Para pepinos, el estrés hídrico causa frutos torcidos y amargos con mayor incidencia de enfermedades.',
        critico: 'Para pepinos, el estrés severo causa colapso de la planta y muerte de yemas apicales.'
    },
    berenjena: {
        pre_critico: 'Para berenjenas, el estrés hídrico reduce tamaño de frutos y aumenta defectos.',
        critico: 'Para berenjenas, el estrés severo causa caída de flores y frutos en desarrollo.'
    }
};

/**
 * Genera recomendación personalizada basada en análisis de riesgo
 * @param {Object} riesgo - Evaluación de riesgo del predictionService
 * @param {Object} especie - Datos de la especie cultivada
 * @param {Object} etapa - Datos de la etapa fenológica
 * @returns {Object} Recomendación generada
 */
function generarRecomendacion(riesgo, especie = {}, etapa = {}) {
    try {
        // Validar entrada
        if (!riesgo || !riesgo.valido) {
            return {
                valido: false,
                error: 'Evaluación de riesgo inválida'
            };
        }

        const {
            estado_riesgo,
            probabilidad_estrés,
            dpv_actual,
            dpv_proyectado,
            tendencia
        } = riesgo;

        // Determinar severidad
        let severidad = 'bajo';
        if (probabilidad_estrés > 80) {
            severidad = 'alto';
        } else if (probabilidad_estrés > 50) {
            severidad = 'medio';
        }

        // Obtener recomendación base del diccionario
        const recomendacionBase = DICCIONARIO_RECOMENDACIONES[estado_riesgo]?.[severidad] || {
            titulo: 'Evaluación requerida',
            texto: 'No se puede generar recomendación con la información disponible.',
            acciones: []
        };

        // Construir contexto técnico
        let contextoTecnico = `DPV actual: ${dpv_actual.toFixed(2)} kPa`;
        if (dpv_proyectado) {
            contextoTecnico += ` (proyectado: ${dpv_proyectado.toFixed(2)} kPa)`;
        }
        contextoTecnico += `. Tendencia: ${tendencia}`;

        // Agregar información específica por especie
        let especieInfo = '';
        if (especie.nombre) {
            const especieNorm = especie.nombre.toLowerCase();
            if (DICCIONARIO_ESPECIES[especieNorm] && DICCIONARIO_ESPECIES[especieNorm][estado_riesgo]) {
                especieInfo = `\n\n📌 Nota importante para ${especie.nombre}: ${DICCIONARIO_ESPECIES[especieNorm][estado_riesgo]}`;
            }
        }

        // Agregar información de etapa fenológica si existe
        let etapaInfo = '';
        if (etapa.nombre) {
            etapaInfo = ` (Etapa: ${etapa.nombre})`;
        }

        // Construir recomendación completa
        const recomendacionCompleta = {
            valido: true,
            titulo: recomendacionBase.titulo + etapaInfo,
            texto: recomendacionBase.texto + especieInfo,
            acciones_sugeridas: recomendacionBase.acciones,
            nivel_severidad: severidad,
            estado_riesgo,
            contexto_tecnico: contextoTecnico,
            urgencia: estado_riesgo === 'critico' ? 'INMEDIATA' : estado_riesgo === 'pre_critico' ? 'ALTA' : 'NORMAL',
            timestamp_generacion: new Date(),
            probabilidad_estrés_porcentaje: probabilidad_estrés
        };

        return recomendacionCompleta;
    } catch (error) {
        logger.error('Error al generar recomendación:', error);
        return {
            valido: false,
            error: error.message
        };
    }
}

/**
 * Genera mensaje corto para notificación push
 * @param {Object} recomendacion - Recomendación generada
 * @returns {string} Mensaje corto
 */
function generarMensajeNotificacion(recomendacion) {
    if (!recomendacion.valido) {
        return 'No se pudo evaluar el estado del cultivo';
    }

    const emoji = recomendacion.urgencia === 'INMEDIATA' ? '🔴' :
                  recomendacion.urgencia === 'ALTA' ? '⚠️' : '✓';

    return `${emoji} ${recomendacion.titulo}`;
}

/**
 * Genera recomendación resumida para la interfaz
 * @param {Object} recomendacion - Recomendación completa
 * @returns {Object} Recomendación resumida
 */
function generarResumenRecomendacion(recomendacion) {
    if (!recomendacion.valido) {
        return {
            valido: false,
            error: recomendacion.error
        };
    }

    return {
        titulo: recomendacion.titulo,
        acciones: recomendacion.acciones_sugeridas.slice(0, 3), // Primeras 3 acciones
        urgencia: recomendacion.urgencia,
        icono: recomendacion.urgencia === 'INMEDIATA' ? '🔴' :
               recomendacion.urgencia === 'ALTA' ? '⚠️' : '✓'
    };
}

module.exports = {
    generarRecomendacion,
    generarMensajeNotificacion,
    generarResumenRecomendacion,
    DICCIONARIO_RECOMENDACIONES,
    DICCIONARIO_ESPECIES
};
