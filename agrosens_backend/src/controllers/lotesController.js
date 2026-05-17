// ============================================================
// CONTROLADOR DE LOTES
// Cumple con: RF-ADM-01 (Gestión de cultivos)
// ============================================================

const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Crear nuevo lote
 * POST /api/v1/lotes
 */
async function crearLote(req, res) {
    const { id_invernadero, nombre_lote, especie, etapa_fenologica, fecha_siembra, fecha_cosecha_estimada } = req.body;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Validar entrada
        if (!id_invernadero || !nombre_lote || !especie) {
            return res.status(400).json({
                error: 'ID invernadero, nombre y especie son requeridos'
            });
        }

        // Verificar que el invernadero pertenezca al usuario
        const invernadero = await db.oneOrNone(
            'SELECT id_invernadero FROM invernaderos WHERE id_invernadero = $1 AND id_usuario = $2',
            [id_invernadero, idUsuario]
        );

        if (!invernadero) {
            return res.status(403).json({
                error: 'Invernadero no encontrado o no tienes permiso',
                code: 'GREENHOUSE_NOT_FOUND'
            });
        }

        // Crear lote
        const lote = await db.one(
            `INSERT INTO lotes (id_invernadero, id_usuario, nombre_lote, especie, etapa_fenologica, fecha_siembra, fecha_cosecha_estimada)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id_lote, nombre_lote, especie, etapa_fenologica, fecha_siembra, fecha_cosecha_estimada, activo, fecha_creacion`,
            [id_invernadero, idUsuario, nombre_lote, especie, etapa_fenologica || null, fecha_siembra || null, fecha_cosecha_estimada || null]
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'crear_lote', `Lote creado: ${nombre_lote}`, 'lotes', lote.id_lote]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Lote creado exitosamente',
            lote
        });

        logger.info(`Lote creado: ${nombre_lote} (${especie})`);
    } catch (error) {
        logger.error('Error al crear lote:', error);
        res.status(500).json({
            error: 'Error al crear lote',
            code: 'CREATE_LOTE_ERROR'
        });
    }
}

/**
 * Obtener lotes de un usuario
 * GET /api/v1/lotes
 */
async function obtenerLotes(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const { id_invernadero, activo } = req.query;

    try {
        let query = `
            SELECT l.*, i.nombre as nombre_invernadero
            FROM lotes l
            JOIN invernaderos i ON l.id_invernadero = i.id_invernadero
            WHERE l.id_usuario = $1
        `;
        
        const params = [idUsuario];

        if (id_invernadero) {
            query += ` AND l.id_invernadero = $${params.length + 1}`;
            params.push(id_invernadero);
        }

        if (activo !== undefined) {
            query += ` AND l.activo = $${params.length + 1}`;
            params.push(activo === 'true');
        }

        query += ` ORDER BY l.fecha_creacion DESC`;

        const lotes = await db.query(query, params);

        res.status(200).json({
            success: true,
            total: lotes.length,
            lotes
        });
    } catch (error) {
        logger.error('Error al obtener lotes:', error);
        res.status(500).json({
            error: 'Error al obtener lotes'
        });
    }
}

/**
 * Obtener lote específico
 * GET /api/v1/lotes/:id
 */
async function obtenerLote(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        const lote = await db.oneOrNone(
            `SELECT l.*, i.nombre as nombre_invernadero
             FROM lotes l
             JOIN invernaderos i ON l.id_invernadero = i.id_invernadero
             WHERE l.id_lote = $1 AND l.id_usuario = $2`,
            [id, idUsuario]
        );

        if (!lote) {
            return res.status(404).json({
                error: 'Lote no encontrado',
                code: 'LOTE_NOT_FOUND'
            });
        }

        // Obtener configuración del lote
        const config = await db.oneOrNone(
            'SELECT * FROM configuracion_cultivo WHERE id_lote = $1',
            [id]
        );

        res.status(200).json({
            success: true,
            lote,
            configuracion: config || null
        });
    } catch (error) {
        logger.error('Error al obtener lote:', error);
        res.status(500).json({
            error: 'Error al obtener lote'
        });
    }
}

/**
 * Actualizar lote
 * PUT /api/v1/lotes/:id
 */
async function actualizarLote(req, res) {
    const { id } = req.params;
    const { nombre_lote, especie, etapa_fenologica, fecha_siembra, fecha_cosecha_estimada, activo } = req.body;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Verificar que el lote pertenezca al usuario
        const loteLote = await db.oneOrNone(
            'SELECT id_lote FROM lotes WHERE id_lote = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!loteLote) {
            return res.status(403).json({
                error: 'Lote no encontrado o no tienes permiso',
                code: 'LOTE_NOT_FOUND'
            });
        }

        // Construir query de actualización
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nombre_lote !== undefined) {
            updates.push(`nombre_lote = $${paramCount++}`);
            values.push(nombre_lote);
        }
        if (especie !== undefined) {
            updates.push(`especie = $${paramCount++}`);
            values.push(especie);
        }
        if (etapa_fenologica !== undefined) {
            updates.push(`etapa_fenologica = $${paramCount++}`);
            values.push(etapa_fenologica);
        }
        if (fecha_siembra !== undefined) {
            updates.push(`fecha_siembra = $${paramCount++}`);
            values.push(fecha_siembra || null);
        }
        if (fecha_cosecha_estimada !== undefined) {
            updates.push(`fecha_cosecha_estimada = $${paramCount++}`);
            values.push(fecha_cosecha_estimada || null);
        }
        if (activo !== undefined) {
            updates.push(`activo = $${paramCount++}`);
            values.push(activo);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'No hay campos para actualizar'
            });
        }

        values.push(id);

        const query = `
            UPDATE lotes
            SET ${updates.join(', ')}
            WHERE id_lote = $${paramCount}
            RETURNING id_lote, nombre_lote, especie, etapa_fenologica, fecha_siembra, fecha_cosecha_estimada, activo
        `;

        const lote = await db.one(query, values);

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'actualizar_umbral', `Lote actualizado: ${id}`, 'lotes', id]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Lote actualizado exitosamente',
            lote
        });
    } catch (error) {
        logger.error('Error al actualizar lote:', error);
        res.status(500).json({
            error: 'Error al actualizar lote'
        });
    }
}

/**
 * Eliminar lote
 * DELETE /api/v1/lotes/:id
 */
async function eliminarLote(req, res) {
    const { id } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Verificar que el lote pertenezca al usuario
        const lote = await db.oneOrNone(
            'SELECT id_lote FROM lotes WHERE id_lote = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!lote) {
            return res.status(403).json({
                error: 'Lote no encontrado o no tienes permiso',
                code: 'LOTE_NOT_FOUND'
            });
        }

        // Eliminar lote (cascada eliminará sensores, lecturas, etc.)
        await db.query('DELETE FROM lotes WHERE id_lote = $1', [id]);

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'eliminar_lote', `Lote eliminado: ${id}`, 'lotes', id]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Lote eliminado exitosamente'
        });

        logger.info(`Lote eliminado: ${id}`);
    } catch (error) {
        logger.error('Error al eliminar lote:', error);
        res.status(500).json({
            error: 'Error al eliminar lote'
        });
    }
}

module.exports = {
    crearLote,
    obtenerLotes,
    obtenerLote,
    actualizarLote,
    eliminarLote
};
