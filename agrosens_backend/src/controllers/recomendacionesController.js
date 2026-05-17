// ============================================================
// CONTROLADOR DE RECOMENDACIONES
// Cumple con: RF-AP-03 (Generación de Recomendaciones)
// ============================================================

const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Obtener recomendación de una alerta
 * GET /api/v1/recomendaciones/:id_alerta
 */
async function obtenerRecomendacion(req, res) {
    const { id_alerta } = req.params;
    const idUsuario = req.usuario.id_usuario;

    try {
        // Verificar que la alerta pertenezca al usuario
        const alerta = await db.oneOrNone(
            'SELECT id_alerta FROM alertas WHERE id_alerta = $1 AND id_usuario = $2',
            [id_alerta, idUsuario]
        );

        if (!alerta) {
            return res.status(403).json({
                error: 'Alerta no encontrada o no tienes permiso',
                code: 'ALERT_NOT_FOUND'
            });
        }

        // Obtener recomendación
        const recomendacion = await db.oneOrNone(
            `SELECT * FROM recomendaciones
             WHERE id_alerta = $1`,
            [id_alerta]
        );

        if (!recomendacion) {
            return res.status(404).json({
                error: 'No hay recomendación para esta alerta',
                code: 'RECOMMENDATION_NOT_FOUND'
            });
        }

        res.status(200).json({
            success: true,
            recomendacion: {
                ...recomendacion,
                acciones_sugeridas: typeof recomendacion.acciones_sugeridas === 'string' 
                    ? JSON.parse(recomendacion.acciones_sugeridas)
                    : recomendacion.acciones_sugeridas
            }
        });
    } catch (error) {
        logger.error('Error al obtener recomendación:', error);
        res.status(500).json({
            error: 'Error al obtener recomendación'
        });
    }
}

/**
 * Obtener recomendaciones de un lote
 * GET /api/v1/recomendaciones/lote/:id_lote
 */
async function obtenerRecomendacionesPorLote(req, res) {
    const { id_lote } = req.params;
    const idUsuario = req.usuario.id_usuario;
    const { limite = 10 } = req.query;

    try {
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

        // Obtener recomendaciones recientes
        const recomendaciones = await db.query(
            `SELECT r.*, a.tipo_riesgo, a.fecha_generacion
             FROM recomendaciones r
             JOIN alertas a ON r.id_alerta = a.id_alerta
             WHERE r.id_lote = $1
             ORDER BY r.fecha_generacion DESC
             LIMIT $2`,
            [id_lote, limite]
        );

        const recomendacionesFormateadas = recomendaciones.map(r => ({
            ...r,
            acciones_sugeridas: typeof r.acciones_sugeridas === 'string'
                ? JSON.parse(r.acciones_sugeridas)
                : r.acciones_sugeridas
        }));

        res.status(200).json({
            success: true,
            total: recomendacionesFormateadas.length,
            recomendaciones: recomendacionesFormateadas
        });
    } catch (error) {
        logger.error('Error al obtener recomendaciones del lote:', error);
        res.status(500).json({
            error: 'Error al obtener recomendaciones'
        });
    }
}

/**
 * Obtener recomendaciones activas del usuario
 * GET /api/v1/recomendaciones
 */
async function obtenerRecomendaciones(req, res) {
    const idUsuario = req.usuario.id_usuario;
    const { severidad, limite = 20 } = req.query;

    try {
        let query = `
            SELECT r.*, a.tipo_riesgo, a.fecha_generacion, l.nombre_lote, l.especie
            FROM recomendaciones r
            JOIN alertas a ON r.id_alerta = a.id_alerta
            JOIN lotes l ON r.id_lote = l.id_lote
            WHERE a.id_usuario = $1 AND a.estado != 'resuelta'
        `;
        
        const params = [idUsuario];

        if (severidad) {
            query += ` AND r.nivel_severidad = $${params.length + 1}`;
            params.push(severidad);
        }

        query += ` ORDER BY r.fecha_generacion DESC LIMIT $${params.length + 1}`;
        params.push(limite);

        const recomendaciones = await db.query(query, params);

        const recomendacionesFormateadas = recomendaciones.map(r => ({
            ...r,
            acciones_sugeridas: typeof r.acciones_sugeridas === 'string'
                ? JSON.parse(r.acciones_sugeridas)
                : r.acciones_sugeridas
        }));

        res.status(200).json({
            success: true,
            total: recomendacionesFormateadas.length,
            recomendaciones: recomendacionesFormateadas
        });
    } catch (error) {
        logger.error('Error al obtener recomendaciones:', error);
        res.status(500).json({
            error: 'Error al obtener recomendaciones'
        });
    }
}

/**
 * Obtener estadísticas de recomendaciones
 * GET /api/v1/recomendaciones/stats
 */
async function obtenerEstadisticas(req, res) {
    const idUsuario = req.usuario.id_usuario;

    try {
        const stats = await db.one(
            `SELECT 
                COUNT(*) as total_recomendaciones,
                COUNT(CASE WHEN nivel_severidad = 'critico' THEN 1 END) as criticas,
                COUNT(CASE WHEN nivel_severidad = 'alto' THEN 1 END) as altas,
                COUNT(CASE WHEN nivel_severidad = 'medio' THEN 1 END) as medias,
                COUNT(CASE WHEN nivel_severidad = 'bajo' THEN 1 END) as bajas
            FROM recomendaciones r
            JOIN alertas a ON r.id_alerta = a.id_alerta
            WHERE a.id_usuario = $1`,
            [idUsuario]
        );

        res.status(200).json({
            success: true,
            estadisticas: stats
        });
    } catch (error) {
        logger.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas'
        });
    }
}

module.exports = {
    obtenerRecomendacion,
    obtenerRecomendacionesPorLote,
    obtenerRecomendaciones,
    obtenerEstadisticas
};
