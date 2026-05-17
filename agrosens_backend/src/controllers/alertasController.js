// ============================================================
// CONTROLADOR DE ALERTAS
// Cumple con: RF-AP-04 (Disparo de Alertas Proactivas)
// ============================================================

const db = require('../config/database');
const logger = require('../utils/logger');
const predictionService = require('../services/predictionService');
const recommendationService = require('../services/recommendationService');
const { v4: uuidv4 } = require('uuid');

/**
 * Generar y enviar alerta (RF-AP-04)
 * POST /api/v1/alertas/generar
 */
async function generarAlerta(req, res) {
    const { id_lote, tipo_riesgo, mensaje_texto, dpv_desencadenante, probabilidad_estrés } = req.body;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Validar entrada
        if (!id_lote || !tipo_riesgo) {
            return res.status(400).json({
                error: 'ID lote y tipo de riesgo son requeridos'
            });
        }

        // Validar tipo de riesgo
        if (!['estable', 'pre_critico', 'critico'].includes(tipo_riesgo)) {
            return res.status(400).json({
                error: 'Tipo de riesgo inválido'
            });
        }

        // Verificar que el lote pertenezca al usuario
        const lote = await db.oneOrNone(
            'SELECT id_lote FROM lotes WHERE id_lote = $1 AND id_usuario = $2',
            [id_lote, idUsuario]
        );

        if (!lote) {
            return res.status(403).json({
                error: 'Lote no encontrado',
                code: 'LOTE_NOT_FOUND'
            });
        }

        // Crear alerta en BD
        const alerta = await db.one(
            `INSERT INTO alertas (
                id_lote, id_usuario, tipo_riesgo, mensaje_texto,
                dpv_desencadenante, probabilidad_estrés, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, 'generada')
            RETURNING id_alerta, id_lote, tipo_riesgo, mensaje_texto, probabilidad_estrés, 
                      fecha_generacion, estado`,
            [id_lote, idUsuario, tipo_riesgo, mensaje_texto || '', dpv_desencadenante, probabilidad_estrés]
        );

        // Obtener configuración para generar recomendación
        const config = await db.oneOrNone(
            'SELECT * FROM configuracion_cultivo WHERE id_lote = $1',
            [id_lote]
        );

        const loteInfo = await db.one(
            'SELECT especie, etapa_fenologica FROM lotes WHERE id_lote = $1',
            [id_lote]
        );

        // Generar recomendación
        const riesgo = {
            valido: true,
            estado_riesgo: tipo_riesgo,
            dpv_actual: dpv_desencadenante || 0,
            probabilidad_estrés: probabilidad_estrés || 0,
            tendencia: 'desconocida'
        };

        const recomendacion = recommendationService.generarRecomendacion(
            riesgo,
            { nombre: loteInfo.especie },
            { nombre: loteInfo.etapa_fenologica }
        );

        // Guardar recomendación
        if (recomendacion.valido) {
            await db.query(
                `INSERT INTO recomendaciones (
                    id_alerta, id_lote, nivel_severidad, texto_recomendacion, acciones_sugeridas
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    alerta.id_alerta,
                    id_lote,
                    recomendacion.nivel_severidad,
                    recomendacion.texto,
                    JSON.stringify(recomendacion.acciones_sugeridas)
                ]
            );
        }

        // Crear notificación push (RF-AP-04)
        const notificacion = await db.one(
            `INSERT INTO notificaciones_push (
                id_alerta, id_usuario, titulo, cuerpo, estado
            ) VALUES ($1, $2, $3, $4, 'pendiente')
            RETURNING id_notificacion, id_alerta, id_usuario, titulo, estado, timestamp_creacion`,
            [
                alerta.id_alerta,
                idUsuario,
                recomendacion.titulo || `Alerta: ${tipo_riesgo}`,
                recomendacion.texto || mensaje_texto || 'Se ha detectado una alerta en tu cultivo'
            ]
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'crear_alerta', `Alerta creada: ${tipo_riesgo}`, 'alertas', alerta.id_alerta]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Alerta generada exitosamente',
            alerta,
            notificacion,
            recomendacion: recomendacion.valido ? recomendacion : null
        });

        logger.info(`Alerta generada: Lote ${id_lote}, Tipo: ${tipo_riesgo}`);
    } catch (error) {
        logger.error('Error al generar alerta:', error);
        res.status(500).json({
            error: 'Error al generar alerta',
            code: 'ALERT_ERROR'
        });
    }
}

/**
 * Obtener alertas de un usuario
 * GET /api/v1/alertas
 */
async function obtenerAlertas(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const { id_lote, estado, tipo_riesgo, dias = 7 } = req.query;

    try {
        let query = `
            SELECT a.*, l.nombre_lote, l.especie,
                   (SELECT COUNT(*) FROM recomendaciones WHERE id_alerta = a.id_alerta) as num_recomendaciones
            FROM alertas a
            JOIN lotes l ON a.id_lote = l.id_lote
            WHERE a.id_usuario = $1
                AND a.fecha_generacion > NOW() - INTERVAL '1 day' * $2
        `;

        const params = [idUsuario, dias];

        if (id_lote) {
            query += ` AND a.id_lote = $${params.length + 1}`;
            params.push(id_lote);
        }

        if (estado) {
            query += ` AND a.estado = $${params.length + 1}`;
            params.push(estado);
        }

        if (tipo_riesgo) {
            query += ` AND a.tipo_riesgo = $${params.length + 1}`;
            params.push(tipo_riesgo);
        }

        query += ` ORDER BY a.fecha_generacion DESC`;

        const alertas = await db.query(query, params);

        res.status(200).json({
            success: true,
            total: alertas.length,
            filtros: { dias, id_lote, estado, tipo_riesgo },
            alertas
        });
    } catch (error) {
        logger.error('Error al obtener alertas:', error);
        res.status(500).json({
            error: 'Error al obtener alertas'
        });
    }
}

/**
 * Obtener alerta específica
 * GET /api/v1/alertas/:id
 */
async function obtenerAlerta(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        const alerta = await db.oneOrNone(
            `SELECT a.*, l.nombre_lote, l.especie
             FROM alertas a
             JOIN lotes l ON a.id_lote = l.id_lote
             WHERE a.id_alerta = $1 AND a.id_usuario = $2`,
            [id, idUsuario]
        );

        if (!alerta) {
            return res.status(404).json({
                error: 'Alerta no encontrada',
                code: 'ALERT_NOT_FOUND'
            });
        }

        // Obtener recomendaciones asociadas
        const recomendaciones = await db.query(
            'SELECT * FROM recomendaciones WHERE id_alerta = $1',
            [id]
        );

        // Obtener notificaciones asociadas
        const notificaciones = await db.query(
            'SELECT id_notificacion, titulo, estado, timestamp_envio, timestamp_apertura FROM notificaciones_push WHERE id_alerta = $1',
            [id]
        );

        res.status(200).json({
            success: true,
            alerta,
            recomendaciones,
            notificaciones
        });
    } catch (error) {
        logger.error('Error al obtener alerta:', error);
        res.status(500).json({
            error: 'Error al obtener alerta'
        });
    }
}

/**
 * Actualizar estado de alerta
 * PUT /api/v1/alertas/:id
 */
async function actualizarAlerta(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;
    const { estado, resolvio_usuario } = req.body;

    try {
        // Validar estado
        if (!['generada', 'enviada', 'vista', 'resuelta'].includes(estado)) {
            return res.status(400).json({
                error: 'Estado inválido'
            });
        }

        // Verificar que la alerta pertenezca al usuario
        const alerta = await db.oneOrNone(
            'SELECT id_alerta FROM alertas WHERE id_alerta = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!alerta) {
            return res.status(403).json({
                error: 'Alerta no encontrada',
                code: 'ALERT_NOT_FOUND'
            });
        }

        // Actualizar alerta
        const alertaActualizada = await db.one(
            `UPDATE alertas 
             SET estado = $1,
                 fecha_resolucion = CASE WHEN $1 = 'resuelta' THEN NOW() ELSE fecha_resolucion END,
                 resolvio_usuario = CASE WHEN $1 = 'resuelta' THEN $3 ELSE resolvio_usuario END
             WHERE id_alerta = $2
             RETURNING id_alerta, estado, fecha_resolucion`,
            [estado, id, resolvio_usuario]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Alerta actualizada exitosamente',
            alerta: alertaActualizada
        });

        logger.info(`Alerta actualizada: ${id}, nuevo estado: ${estado}`);
    } catch (error) {
        logger.error('Error al actualizar alerta:', error);
        res.status(500).json({
            error: 'Error al actualizar alerta'
        });
    }
}

/**
 * Marcar alerta como vista (RF-BD-01 - Registro de tiempo de reacción)
 * POST /api/v1/alertas/:id/marcar-vista
 */
async function marcarAlertaVista(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Verificar que la alerta pertenezca al usuario
        const alerta = await db.oneOrNone(
            'SELECT id_alerta FROM alertas WHERE id_alerta = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!alerta) {
            return res.status(403).json({
                error: 'Alerta no encontrada'
            });
        }

        // Actualizar estado de alerta
        await db.query(
            'UPDATE alertas SET estado = \'vista\' WHERE id_alerta = $1',
            [id]
        );

        // Marcar notificación como abierta y registrar tiempo de reacción
        const notificacion = await db.oneOrNone(
            'SELECT id_notificacion, timestamp_envio FROM notificaciones_push WHERE id_alerta = $1 AND estado != \'fallida\'',
            [id]
        );

        if (notificacion && !notificacion.timestamp_apertura) {
            const ahora = new Date();

            // Actualizar notificación
            await db.query(
                'UPDATE notificaciones_push SET timestamp_apertura = $1, estado = \'vista\' WHERE id_notificacion = $2',
                [ahora, notificacion.id_notificacion]
            );

            // Registrar tiempo de reacción (RF-BD-01)
            if (notificacion.timestamp_envio) {
                await db.query(
                    `INSERT INTO registros_reaccion_usuario (
                        id_notificacion, id_usuario, id_alerta, timestamp_envio, timestamp_apertura
                    ) VALUES ($1, $2, $3, $4, $5)`,
                    [notificacion.id_notificacion, idUsuario, id, notificacion.timestamp_envio, ahora]
                );

                logger.info(`Tiempo de reacción registrado: Alerta ${id}`);
            }
        }

        res.status(200).json({
            success: true,
            mensaje: 'Alerta marcada como vista'
        });
    } catch (error) {
        logger.error('Error al marcar alerta como vista:', error);
        res.status(500).json({
            error: 'Error al procesar alerta'
        });
    }
}

async function obtenerAlertasPorCultivo(req, res) {
    const { id_lote } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        const lote = await db.oneOrNone(
            `SELECT id_lote, nombre_lote, especie, etapa_fenologica
             FROM lotes
             WHERE id_lote = $1 AND id_usuario = $2`,
            [id_lote, idUsuario]
        );

        if (!lote) {
            return res.status(404).json({ error: 'Cultivo no encontrado', code: 'LOTE_NOT_FOUND' });
        }

        const lectura = await db.oneOrNone(
            `SELECT id_lectura, id_sensor, timestamp, temperatura_celsius, humedad_relativa,
                    dpv_calculado, presion_vapor_saturacion, presion_vapor_real
             FROM lecturas_sensores
             WHERE id_lote = $1
             ORDER BY timestamp DESC
             LIMIT 1`,
            [id_lote]
        );

        const reglas = [];
        if (lectura) {
            const temperatura = Number(lectura.temperatura_celsius);
            const humedad = Number(lectura.humedad_relativa);
            const dpv = Number(lectura.dpv_calculado);

            if (temperatura >= 36) {
                reglas.push({ clave: 'temperatura', tipo_riesgo: 'critico', valor: temperatura, mensaje: `Temperatura alta (${temperatura.toFixed(1)} °C). El cultivo puede entrar en estrés térmico.`, recomendacion: 'Hace bastante calor en este cultivo. Te conviene ventilar y revisar riego corto para bajar estrés.', acciones: ['Aumentar ventilación o abrir laterales del invernadero', 'Aplicar riego corto de enfriamiento en horas de mayor calor', 'Evitar fertilización fuerte en este momento'] });
            } else if (temperatura >= 32) {
                reglas.push({ clave: 'temperatura', tipo_riesgo: 'pre_critico', valor: temperatura, mensaje: `Temperatura en nivel medio (${temperatura.toFixed(1)} °C). Conviene corregir antes de que suba más.`, recomendacion: 'La temperatura se está saliendo del rango cómodo. Con algo más de ventilación lo puedes estabilizar.', acciones: ['Ventilar en las horas más cálidas', 'Revisar si hay acumulación de calor en zonas cerradas', 'Monitorear de nuevo en 30-60 minutos'] });
            } else if (temperatura >= 29) {
                reglas.push({ clave: 'temperatura', tipo_riesgo: 'estable', valor: temperatura, mensaje: `Temperatura ligeramente alta (${temperatura.toFixed(1)} °C). Nivel bajo de alerta preventiva.`, recomendacion: 'Por ahora está controlable. Haz un ajuste suave de ventilación para no subir a riesgo medio.', acciones: ['Ajustar ventilación de forma suave', 'Evitar riegos en horas de mayor radiación', 'Seguir monitoreo durante el día'] });
            } else if (temperatura <= 12) {
                reglas.push({ clave: 'temperatura', tipo_riesgo: 'critico', valor: temperatura, mensaje: `Temperatura baja (${temperatura.toFixed(1)} °C). Puede reducirse el desarrollo del cultivo.`, recomendacion: 'Está fresco para el cultivo. Ayuda mucho reducir corrientes y conservar calor durante la noche.', acciones: ['Reducir ventilación nocturna', 'Revisar sellado de puertas/cortinas', 'Programar riego en horas más templadas'] });
            } else if (temperatura <= 16) {
                reglas.push({ clave: 'temperatura', tipo_riesgo: 'pre_critico', valor: temperatura, mensaje: `Temperatura en nivel medio-bajo (${temperatura.toFixed(1)} °C).`, recomendacion: 'Se está enfriando más de lo ideal. Te sugiero reducir corrientes para no afectar el desarrollo.', acciones: ['Reducir ventilación durante la noche', 'Revisar puntos fríos del invernadero', 'Controlar nueva lectura en la próxima hora'] });
            } else if (temperatura <= 18) {
                reglas.push({ clave: 'temperatura', tipo_riesgo: 'estable', valor: temperatura, mensaje: `Temperatura ligeramente baja (${temperatura.toFixed(1)} °C). Nivel bajo de alerta preventiva.`, recomendacion: 'No es grave, pero conviene cuidar el calor acumulado para mantener crecimiento estable.', acciones: ['Evitar pérdidas de calor al final del día', 'Ajustar ventilación mínima', 'Mantener seguimiento regular'] });
            }

            if (humedad >= 92) {
                reglas.push({ clave: 'humedad', tipo_riesgo: 'critico', valor: humedad, mensaje: `Humedad relativa alta (${humedad.toFixed(1)} %). Riesgo de hongos y enfermedades.`, recomendacion: 'La humedad está bastante alta. Te recomiendo mover más aire para evitar problemas de hongos.', acciones: ['Incrementar ventilación y circulación de aire', 'Evitar riegos tardíos al final del día', 'Monitorear hojas con signos tempranos de enfermedad'] });
            } else if (humedad >= 85) {
                reglas.push({ clave: 'humedad', tipo_riesgo: 'pre_critico', valor: humedad, mensaje: `Humedad en nivel medio-alto (${humedad.toFixed(1)} %).`, recomendacion: 'La humedad está subiendo. Si ventilas un poco más ahora, evitas que se vuelva crítica.', acciones: ['Aumentar circulación de aire', 'Evitar riego tardío', 'Revisar condensación en hojas'] });
            } else if (humedad >= 80) {
                reglas.push({ clave: 'humedad', tipo_riesgo: 'estable', valor: humedad, mensaje: `Humedad ligeramente alta (${humedad.toFixed(1)} %). Nivel bajo de alerta preventiva.`, recomendacion: 'Vas bien, solo mantén ventilación equilibrada para que no escale a nivel medio.', acciones: ['Ventilar de manera gradual', 'Evitar acumulación de humedad nocturna', 'Seguir monitoreo'] });
            } else if (humedad <= 30) {
                reglas.push({ clave: 'humedad', tipo_riesgo: 'critico', valor: humedad, mensaje: `Humedad relativa baja (${humedad.toFixed(1)} %). Puede aumentar estrés hídrico.`, recomendacion: 'El ambiente está seco. Podrías hacer ajustes de riego y bajar ventilación en picos de calor.', acciones: ['Aplicar riego fraccionado', 'Reducir ventilación en las horas más secas', 'Revisar uniformidad del sistema de riego'] });
            } else if (humedad <= 45) {
                reglas.push({ clave: 'humedad', tipo_riesgo: 'pre_critico', valor: humedad, mensaje: `Humedad en nivel medio-bajo (${humedad.toFixed(1)} %).`, recomendacion: 'La humedad está bajando más de la cuenta; conviene ajustar riego y ventilación fina.', acciones: ['Aplicar riego fraccionado', 'Reducir ventilación en horas secas', 'Verificar uniformidad del sistema'] });
            } else if (humedad <= 50) {
                reglas.push({ clave: 'humedad', tipo_riesgo: 'estable', valor: humedad, mensaje: `Humedad ligeramente baja (${humedad.toFixed(1)} %). Nivel bajo de alerta preventiva.`, recomendacion: 'Todavía es manejable, pero te sirve vigilar para mantener confort hídrico en la planta.', acciones: ['Monitorear evolución en la tarde', 'Evitar exceso de ventilación', 'Mantener riego en pulsos cortos'] });
            }

            if (dpv >= 2.2) {
                reglas.push({ clave: 'dpv', tipo_riesgo: 'critico', valor: dpv, mensaje: `DPV elevado (${dpv.toFixed(2)} kPa). La planta transpira más de lo ideal.`, recomendacion: 'Tu DPV está alto: conviene subir humedad ambiental o bajar temperatura para evitar estrés hídrico.', acciones: ['Aumentar humedad del ambiente de forma gradual', 'Programar pulsos de riego más frecuentes', 'Reducir exposición a calor extremo en horas pico'] });
            } else if (dpv >= 1.6) {
                reglas.push({ clave: 'dpv', tipo_riesgo: 'pre_critico', valor: dpv, mensaje: `DPV en nivel medio (${dpv.toFixed(2)} kPa).`, recomendacion: 'El DPV está subiendo; te recomiendo un ajuste preventivo para no llegar a estrés fuerte.', acciones: ['Subir humedad de forma gradual', 'Ajustar frecuencia de riego', 'Controlar temperatura en horas pico'] });
            } else if (dpv >= 1.3) {
                reglas.push({ clave: 'dpv', tipo_riesgo: 'estable', valor: dpv, mensaje: `DPV ligeramente alto (${dpv.toFixed(2)} kPa). Nivel bajo de alerta preventiva.`, recomendacion: 'Aún no es crítico; con pequeños ajustes de clima puedes mantenerlo en zona cómoda.', acciones: ['Revisar ventilación y humedad', 'Monitorear siguiente lectura', 'Corregir temprano para evitar escalamiento'] });
            } else if (dpv <= 0.25) {
                reglas.push({ clave: 'dpv', tipo_riesgo: 'critico', valor: dpv, mensaje: `DPV muy bajo (${dpv.toFixed(2)} kPa). Riesgo de condensación y baja transpiración.`, recomendacion: 'El DPV está demasiado bajo. Te puede ayudar ventilar un poco para evitar condensación en hojas.', acciones: ['Mejorar ventilación para secar el microclima', 'Evitar exceso de riego en periodos fríos', 'Inspeccionar presencia de condensación en hojas'] });
            } else if (dpv <= 0.4) {
                reglas.push({ clave: 'dpv', tipo_riesgo: 'pre_critico', valor: dpv, mensaje: `DPV en nivel medio-bajo (${dpv.toFixed(2)} kPa).`, recomendacion: 'El DPV está bajo y podría afectar transpiración; una ventilación suave suele ayudar.', acciones: ['Ventilar gradualmente', 'Evitar exceso de humedad sostenida', 'Verificar condensación en el cultivo'] });
            } else if (dpv <= 0.6) {
                reglas.push({ clave: 'dpv', tipo_riesgo: 'estable', valor: dpv, mensaje: `DPV ligeramente bajo (${dpv.toFixed(2)} kPa). Nivel bajo de alerta preventiva.`, recomendacion: 'Todo bajo control, solo mantén vigilancia para sostener un intercambio de vapor adecuado.', acciones: ['Monitorear tendencia próxima', 'Mantener ventilación estable', 'Evitar sobre-riego'] });
            }
        }

        for (const regla of reglas) {
            const existe = await db.oneOrNone(
                `SELECT id_alerta FROM alertas WHERE id_lote = $1 AND id_usuario = $2 AND estado IN ('generada', 'enviada', 'vista') AND tipo_riesgo = $3 AND mensaje_texto ILIKE $4 AND fecha_generacion > NOW() - INTERVAL '6 hour' LIMIT 1`,
                [id_lote, idUsuario, regla.tipo_riesgo, `%${regla.clave}%`]
            );
            if (existe) continue;

            const nuevaAlerta = await db.one(
                `INSERT INTO alertas (id_lote, id_usuario, tipo_riesgo, mensaje_texto, dpv_desencadenante, estado)
                 VALUES ($1, $2, $3, $4, $5, 'generada') RETURNING id_alerta`,
                [id_lote, idUsuario, regla.tipo_riesgo, `[${regla.clave.toUpperCase()}] ${regla.mensaje}`, regla.clave === 'dpv' ? regla.valor : null]
            );

            await db.query(
                `INSERT INTO recomendaciones (id_alerta, id_lote, nivel_severidad, texto_recomendacion, acciones_sugeridas)
                 VALUES ($1, $2, $3, $4, $5)`,
                [nuevaAlerta.id_alerta, id_lote, regla.tipo_riesgo === 'critico' ? 'alto' : (regla.tipo_riesgo === 'pre_critico' ? 'medio' : 'bajo'), regla.recomendacion, JSON.stringify(regla.acciones)]
            );
        }

        const alertas = await db.query(
            `SELECT id_alerta, id_lote, id_usuario, tipo_riesgo, dpv_desencadenante, mensaje_texto,
                    estado, fecha_generacion
             FROM alertas
             WHERE id_lote = $1 AND id_usuario = $2
             ORDER BY fecha_generacion DESC
             LIMIT 30`,
            [id_lote, idUsuario]
        );

        const recomendaciones = await db.query(
            `SELECT r.id_recomendacion, r.id_alerta, r.id_lote, r.nivel_severidad, r.texto_recomendacion
             FROM recomendaciones r
             JOIN alertas a ON a.id_alerta = r.id_alerta
             WHERE r.id_lote = $1 AND a.id_usuario = $2
             ORDER BY r.id_recomendacion DESC
             LIMIT 30`,
            [id_lote, idUsuario]
        );

        return res.status(200).json({ success: true, cultivo: lote, lectura_actual: lectura, alertas, recomendaciones });
    } catch (error) {
        logger.error('Error al obtener alertas por cultivo:', error);
        return res.status(500).json({ error: 'Error al obtener alertas por cultivo', code: 'ALERTAS_CULTIVO_ERROR' });
    }
}

module.exports = {
    generarAlerta,
    obtenerAlertas,
    obtenerAlertasPorCultivo,
    obtenerAlerta,
    actualizarAlerta,
    marcarAlertaVista
};
