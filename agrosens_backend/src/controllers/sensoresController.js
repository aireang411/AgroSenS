// ============================================================
// CONTROLADOR DE SENSORES
// Cumple con: RF-ADM-01 (Gestión de Nodos y Dispositivos)
// ============================================================

const db = require('../config/database');
const logger = require('../utils/logger');
const dpvService = require('../services/dpvService');

/**
 * Registrar nuevo sensor
 * POST /api/v1/sensores
 */
async function crearSensor(req, res) {
    const { id_dispositivo, nombre_sensor, tipo_sensor, id_lote } = req.body;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Validar entrada
        if (!id_dispositivo || !nombre_sensor || !tipo_sensor || !id_lote) {
            return res.status(400).json({
                error: 'ID dispositivo, nombre, tipo y lote son requeridos'
            });
        }

        if (nombre_sensor.length > 255) {
            return res.status(400).json({
                error: 'El nombre del sensor no debe exceder 255 caracteres'
            });
        }

        // Verificar que el dispositivo no esté duplicado
        const dispositoDuplicado = await db.oneOrNone(
            'SELECT id_sensor FROM sensores WHERE id_dispositivo = $1',
            [id_dispositivo]
        );

        if (dispositoDuplicado) {
            return res.status(409).json({
                error: 'El dispositivo ya está registrado en el sistema',
                code: 'DEVICE_EXISTS'
            });
        }

        // Verificar que el lote pertenezca al usuario
        const lote = await db.oneOrNone(
            'SELECT id_lote FROM lotes WHERE id_lote = $1 AND id_usuario = $2',
            [id_lote, idUsuario]
        );

        if (!lote) {
            return res.status(403).json({
                error: 'Lote no encontrado o no tienes permiso',
                code: 'LOTE_NOT_FOUND'
            });
        }

        // Crear sensor
        const sensor = await db.one(
            `INSERT INTO sensores (id_lote, id_usuario, id_dispositivo, nombre_sensor, tipo_sensor)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id_sensor, id_dispositivo, nombre_sensor, tipo_sensor, estado_activo, fecha_creacion`,
            [id_lote, idUsuario, id_dispositivo, nombre_sensor, tipo_sensor]
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'modificar_sensor', 'Creación de nuevo sensor', 'sensores', sensor.id_sensor]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Sensor registrado exitosamente',
            sensor
        });

        logger.info(`Sensor creado: ${id_dispositivo} en lote ${id_lote}`);
    } catch (error) {
        logger.error('Error al crear sensor:', error);
        res.status(500).json({
            error: 'Error al registrar sensor',
            code: 'CREATE_SENSOR_ERROR'
        });
    }
}

/**
 * Obtener sensores de un usuario
 * GET /api/v1/sensores
 */
async function obtenerSensores(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const { id_lote } = req.query;

    try {
        let query = `
            SELECT s.*, l.nombre_lote, l.especie
            FROM sensores s
            JOIN lotes l ON s.id_lote = l.id_lote
            WHERE s.id_usuario = $1
        `;
        
        const params = [idUsuario];

        if (id_lote) {
            query += ` AND s.id_lote = $${params.length + 1}`;
            params.push(id_lote);
        }

        query += ` ORDER BY s.fecha_creacion DESC`;

        const sensores = await db.query(query, params);

        res.status(200).json({
            success: true,
            total: sensores.length,
            sensores
        });
    } catch (error) {
        logger.error('Error al obtener sensores:', error);
        res.status(500).json({
            error: 'Error al obtener sensores'
        });
    }
}

/**
 * Obtener sensor específico
 * GET /api/v1/sensores/:id
 */
async function obtenerSensor(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        const sensor = await db.oneOrNone(
            `SELECT s.*, l.nombre_lote, l.especie
             FROM sensores s
             JOIN lotes l ON s.id_lote = l.id_lote
             WHERE s.id_sensor = $1 AND s.id_usuario = $2`,
            [id, idUsuario]
        );

        if (!sensor) {
            return res.status(404).json({
                error: 'Sensor no encontrado',
                code: 'SENSOR_NOT_FOUND'
            });
        }

        res.status(200).json({
            success: true,
            sensor
        });
    } catch (error) {
        logger.error('Error al obtener sensor:', error);
        res.status(500).json({
            error: 'Error al obtener sensor'
        });
    }
}

/**
 * Actualizar sensor
 * PUT /api/v1/sensores/:id
 */
async function actualizarSensor(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;
    const { nombre_sensor, estado_activo } = req.body;

    try {
        // Verificar que el sensor pertenezca al usuario
        const sensor = await db.oneOrNone(
            'SELECT id_sensor FROM sensores WHERE id_sensor = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!sensor) {
            return res.status(403).json({
                error: 'Sensor no encontrado o no tienes permiso',
                code: 'SENSOR_NOT_FOUND'
            });
        }

        // Actualizar solo los campos permitidos
        let query = 'UPDATE sensores SET ';
        const params = [];
        const campos = [];

        if (nombre_sensor !== undefined) {
            campos.push(`nombre_sensor = $${params.length + 1}`);
            params.push(nombre_sensor);
        }

        if (estado_activo !== undefined) {
            campos.push(`estado_activo = $${params.length + 1}`);
            params.push(estado_activo);
        }

        if (campos.length === 0) {
            return res.status(400).json({
                error: 'No hay campos para actualizar'
            });
        }

        query += campos.join(', ') + ` WHERE id_sensor = $${params.length + 1}`;
        params.push(id);

        const sensorActualizado = await db.one(
            query + ' RETURNING *',
            params
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'modificar_sensor', 'Actualización de sensor', 'sensores', id]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Sensor actualizado exitosamente',
            sensor: sensorActualizado
        });

        logger.info(`Sensor actualizado: ${id}`);
    } catch (error) {
        logger.error('Error al actualizar sensor:', error);
        res.status(500).json({
            error: 'Error al actualizar sensor'
        });
    }
}

/**
 * Ingresar lectura de sensor
 * POST /api/v1/sensores/:id/lecturas
 */
async function ingresarLectura(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;
    const { temperatura_celsius, humedad_relativa } = req.body;

    try {
        // Validar entrada
        if (temperatura_celsius === undefined || humedad_relativa === undefined) {
            return res.status(400).json({
                error: 'Temperatura y humedad relativa son requeridas'
            });
        }

        // Verificar que el sensor pertenezca al usuario
        const sensor = await db.oneOrNone(
            `SELECT s.id_sensor, s.id_lote
             FROM sensores s
             WHERE s.id_sensor = $1 AND s.id_usuario = $2`,
            [id, idUsuario]
        );

        if (!sensor) {
            return res.status(403).json({
                error: 'Sensor no encontrado',
                code: 'SENSOR_NOT_FOUND'
            });
        }

        // Procesar lectura (calcular DPV)
        const resultado = dpvService.procesarLectura({
            temperatura_celsius,
            humedad_relativa
        });

        if (!resultado.procesada) {
            return res.status(400).json({
                error: resultado.error,
                code: 'INVALID_DATA'
            });
        }

        // Guardar lectura en BD
        const lectura = await db.one(
            `INSERT INTO lecturas_sensores (
                id_sensor, id_lote, temperatura_celsius, humedad_relativa,
                dpv_calculado, presion_vapor_saturacion, presion_vapor_real, valida
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id_lectura, timestamp, temperatura_celsius, humedad_relativa, 
                      dpv_calculado, presion_vapor_saturacion, presion_vapor_real`,
            [
                id, sensor.id_lote, temperatura_celsius, humedad_relativa,
                resultado.dpv_calculado, resultado.presion_vapor_saturacion,
                resultado.presion_vapor_real, resultado.procesada
            ]
        );

        // Actualizar última comunicación del sensor
        await db.query(
            'UPDATE sensores SET ultima_comunicacion = NOW() WHERE id_sensor = $1',
            [id]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Lectura registrada exitosamente',
            lectura
        });

        logger.debug(`Lectura registrada para sensor ${id}: DPV=${resultado.dpv_calculado}`);
    } catch (error) {
        logger.error('Error al ingresar lectura:', error);
        res.status(500).json({
            error: 'Error al registrar lectura'
        });
    }
}

/**
 * Obtener lecturas de un sensor
 * GET /api/v1/sensores/:id/lecturas
 */
async function obtenerLecturas(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;
    const { horas = 24, limit = 100 } = req.query;

    try {
        // Verificar que el sensor pertenezca al usuario
        const sensor = await db.oneOrNone(
            'SELECT id_sensor FROM sensores WHERE id_sensor = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!sensor) {
            return res.status(403).json({
                error: 'Sensor no encontrado',
                code: 'SENSOR_NOT_FOUND'
            });
        }

        const lecturas = await db.query(
            `SELECT id_lectura, timestamp, temperatura_celsius, humedad_relativa,
                    dpv_calculado, presion_vapor_saturacion, presion_vapor_real, valida
             FROM lecturas_sensores
             WHERE id_sensor = $1 AND timestamp > NOW() - INTERVAL '1 hour' * $2
             ORDER BY timestamp DESC
             LIMIT $3`,
            [id, horas, limit]
        );

        res.status(200).json({
            success: true,
            total: lecturas.length,
            sensor_id: id,
            horas: parseInt(horas),
            lecturas
        });
    } catch (error) {
        logger.error('Error al obtener lecturas:', error);
        res.status(500).json({
            error: 'Error al obtener lecturas'
        });
    }
}

/**
 * Simular lectura de sensor desde evento operativo
 * POST /api/v1/sensores/simulacion/evento
 */
async function simularLecturaDesdeEvento(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const {
        id_lote,
        tipo_evento,
        temperatura_ambiental_c,
        humedad_relativa_pct,
        volumen_litros,
        duracion_minutos,
        concentracion_ppm,
        dosis_gramos,
        severidad,
        rendimiento_estimado
    } = req.body;

    try {
        if (!id_lote || !tipo_evento) {
            return res.status(400).json({
                error: 'id_lote y tipo_evento son requeridos'
            });
        }

        const lote = await db.oneOrNone(
            'SELECT id_lote FROM lotes WHERE id_lote = $1 AND id_usuario = $2',
            [id_lote, idUsuario]
        );

        if (!lote) {
            return res.status(403).json({
                error: 'Lote no encontrado o sin permisos',
                code: 'LOTE_NOT_FOUND'
            });
        }

        const sensor = await db.oneOrNone(
            `SELECT id_sensor, id_lote
             FROM sensores
             WHERE id_lote = $1 AND id_usuario = $2 AND estado_activo = TRUE
             ORDER BY ultima_comunicacion DESC NULLS LAST, fecha_creacion DESC
             LIMIT 1`,
            [id_lote, idUsuario]
        );

        if (!sensor) {
            return res.status(404).json({
                error: 'No hay sensores activos para este lote',
                code: 'SENSOR_NOT_FOUND'
            });
        }

        const ultimaLectura = await db.oneOrNone(
            `SELECT temperatura_celsius, humedad_relativa
             FROM lecturas_sensores
             WHERE id_sensor = $1
             ORDER BY timestamp DESC
             LIMIT 1`,
            [sensor.id_sensor]
        );

        let temperaturaBase = Number(temperatura_ambiental_c);
        let humedadBase = Number(humedad_relativa_pct);

        if (!Number.isFinite(temperaturaBase)) {
            temperaturaBase = ultimaLectura ? Number(ultimaLectura.temperatura_celsius) : 24;
        }
        if (!Number.isFinite(humedadBase)) {
            humedadBase = ultimaLectura ? Number(ultimaLectura.humedad_relativa) : 65;
        }

        let deltaTemp = 0;
        let deltaHum = 0;

        switch (tipo_evento) {
            case 'riego': {
                const volumen = Number(volumen_litros) || 0;
                const duracion = Number(duracion_minutos) || 0;
                deltaTemp = -(0.3 + Math.min(volumen / 100, 1.5));
                deltaHum = 3 + Math.min(duracion / 8, 12);
                break;
            }
            case 'fertilizacion': {
                const concentracion = Number(concentracion_ppm) || 0;
                const dosis = Number(dosis_gramos) || 0;
                deltaTemp = 0.1 + Math.min(concentracion / 2500, 0.9);
                deltaHum = -0.8 + Math.min(dosis / 200, 1.2);
                break;
            }
            case 'plagas': {
                const sev = (severidad || '').toString().toLowerCase();
                if (sev.includes('alta') || sev.includes('crit')) {
                    deltaTemp = 1.1;
                    deltaHum = -4.5;
                } else if (sev.includes('media')) {
                    deltaTemp = 0.6;
                    deltaHum = -2.5;
                } else {
                    deltaTemp = 0.2;
                    deltaHum = -1.0;
                }
                break;
            }
            case 'cosecha': {
                const rendimiento = Number(rendimiento_estimado) || 0;
                deltaTemp = -0.2;
                deltaHum = -0.6 - Math.min(rendimiento / 120, 2.0);
                break;
            }
            case 'poda':
                deltaTemp = 0.3;
                deltaHum = -1.5;
                break;
            case 'control_enfermedad':
                deltaTemp = -0.1;
                deltaHum = -1.2;
                break;
            case 'mantenimiento':
                deltaTemp = 0;
                deltaHum = -0.5;
                break;
            default:
                deltaTemp = 0;
                deltaHum = 0;
        }

        const temperaturaFinal = Math.max(5, Math.min(45, temperaturaBase + deltaTemp));
        const humedadFinal = Math.max(10, Math.min(100, humedadBase + deltaHum));

        const resultado = dpvService.procesarLectura({
            temperatura_celsius: temperaturaFinal,
            humedad_relativa: humedadFinal
        });

        if (!resultado.procesada) {
            return res.status(400).json({
                error: resultado.error,
                code: 'SIMULATION_INVALID_DATA'
            });
        }

        const lectura = await db.one(
            `INSERT INTO lecturas_sensores (
                id_sensor, id_lote, temperatura_celsius, humedad_relativa,
                dpv_calculado, presion_vapor_saturacion, presion_vapor_real, valida
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            RETURNING id_lectura, id_sensor, id_lote, timestamp, temperatura_celsius,
                      humedad_relativa, dpv_calculado, presion_vapor_saturacion, presion_vapor_real`,
            [
                sensor.id_sensor,
                sensor.id_lote,
                temperaturaFinal,
                humedadFinal,
                resultado.dpv_calculado,
                resultado.presion_vapor_saturacion,
                resultado.presion_vapor_real
            ]
        );

        await db.query(
            'UPDATE sensores SET ultima_comunicacion = NOW() WHERE id_sensor = $1',
            [sensor.id_sensor]
        );

        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'modificar_sensor', `Simulación por evento ${tipo_evento}`, 'sensores', sensor.id_sensor]
        );

        return res.status(201).json({
            success: true,
            mensaje: 'Lectura simulada desde evento registrada',
            lectura,
            sensor_id: sensor.id_sensor
        });
    } catch (error) {
        logger.error('Error al simular lectura desde evento:', error);
        return res.status(500).json({
            error: 'Error al simular lectura desde evento',
            code: 'SIMULATION_ERROR'
        });
    }
}

/**
 * Eliminar sensor
 * DELETE /api/v1/sensores/:id
 */
async function eliminarSensor(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Verificar que el sensor pertenezca al usuario
        const sensor = await db.oneOrNone(
            'SELECT id_sensor FROM sensores WHERE id_sensor = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!sensor) {
            return res.status(403).json({
                error: 'Sensor no encontrado',
                code: 'SENSOR_NOT_FOUND'
            });
        }

        // Soft delete - simplemente desactivar
        await db.query(
            'UPDATE sensores SET estado_activo = FALSE WHERE id_sensor = $1',
            [id]
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'modificar_sensor', 'Eliminación de sensor', 'sensores', id]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Sensor eliminado exitosamente'
        });

        logger.info(`Sensor eliminado: ${id}`);
    } catch (error) {
        logger.error('Error al eliminar sensor:', error);
        res.status(500).json({
            error: 'Error al eliminar sensor'
        });
    }
}

module.exports = {
    crearSensor,
    obtenerSensores,
    obtenerSensor,
    actualizarSensor,
    ingresarLectura,
    simularLecturaDesdeEvento,
    obtenerLecturas,
    eliminarSensor
};
