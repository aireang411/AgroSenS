// ============================================================
// RUTAS DE MÉTRICAS
// ============================================================

import { Router, Response } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth';
import db from '../config/database';
import { CustomRequest } from '../types';

const router = Router();

/**
 * GET /api/v1/metrics/reaccion
 * Obtener métricas de tiempo de reacción del usuario (RF-BD-01)
 */
router.get('/reaccion', verificarToken, async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const idUsuario = req.usuario?.id_usuario;
        const { dias = 30 } = req.query;

        const metricas = await db.query(
            `SELECT 
                AVG(tiempo_reaccion_segundos) as promedio_segundos,
                MIN(tiempo_reaccion_segundos) as minimo_segundos,
                MAX(tiempo_reaccion_segundos) as maximo_segundos,
                COUNT(*) as total_alertas_procesadas,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY tiempo_reaccion_segundos) as mediana_segundos
             FROM registros_reaccion_usuario
             WHERE id_usuario = $1
                AND fecha_registro > NOW() - INTERVAL '1 day' * $2`,
            [idUsuario, dias]
        );

        res.json({ success: true, metricas: metricas[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
});

/**
 * GET /api/v1/metrics/rendimiento
 * Obtener métricas de rendimiento del backend (RF-INF-01)
 * Disponible solo para administradores
 */
router.get('/rendimiento', verificarToken, verificarRol('administrador'), async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { horas = 24 } = req.query;

        const metricas = await db.query(
            `SELECT 
                COUNT(*) as total_solicitudes,
                AVG(tiempo_respuesta_ms) as latencia_promedio_ms,
                MIN(tiempo_respuesta_ms) as latencia_minima_ms,
                MAX(tiempo_respuesta_ms) as latencia_maxima_ms,
                ROUND(100.0 * COUNT(CASE WHEN estado_http = 200 THEN 1 END) / COUNT(*), 2) as tasa_exito_porcentaje,
                COUNT(CASE WHEN estado_servicio = true THEN 1 END) as periodos_online,
                timestamp
             FROM metricas_rendimiento
             WHERE timestamp > NOW() - INTERVAL '1 hour' * $1
             GROUP BY DATE_TRUNC('hour', timestamp), timestamp
             ORDER BY timestamp DESC`,
            [horas]
        );

        // Calcular uptime general
        const uptimeData = await db.query(
            `SELECT 
                ROUND(100.0 * COUNT(CASE WHEN estado_servicio = true THEN 1 END) / COUNT(*), 2) as uptime_porcentaje
             FROM metricas_rendimiento
             WHERE timestamp > NOW() - INTERVAL '1 hour' * $1`,
            [horas]
        );

        res.json({
            success: true,
            periodo_horas: horas,
            uptime_general: uptimeData[0].uptime_porcentaje,
            metricas
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
});

/**
 * POST /api/v1/metrics/registrar
 * Registrar métrica de rendimiento (uso interno del backend)
 */
router.post('/registrar', async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { endpoint, metodo_http, tiempo_respuesta_ms, estado_http, estado_servicio } = req.body;

        await db.query(
            `INSERT INTO metricas_rendimiento (
                endpoint, metodo_http, tiempo_respuesta_ms, estado_http, estado_servicio
            ) VALUES ($1, $2, $3, $4, $5)`,
            [endpoint, metodo_http, tiempo_respuesta_ms, estado_http, estado_servicio !== false]
        );

        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar métrica' });
    }
});

export default router;
