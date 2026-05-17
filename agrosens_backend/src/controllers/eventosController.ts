// ============================================================
// CONTROLADOR DE EVENTOS OPERATIVOS
// Gestiona registro manual de: riego, fertilización, plagas, cosecha
// ============================================================

import { Response } from 'express';
import db from '../config/database';
import logger from '../utils/logger';
import { CustomRequest } from '../types';

function normalizarSeveridad(value?: string | null): string | null {
    if (!value) return null;
    const normalizado = value.trim().toLowerCase();

    if (normalizado === 'baja' || normalizado === 'leve') return 'leve';
    if (normalizado === 'media' || normalizado === 'moderada') return 'moderada';
    if (normalizado === 'alta' || normalizado === 'grave' || normalizado === 'critica' || normalizado === 'crítica') return 'grave';

    return null;
}

function normalizarCalidadVisual(value?: string | null): string | null {
    if (!value) return null;
    const normalizado = value.trim().toLowerCase();

    if (normalizado === 'excelente') return 'excelente';
    if (normalizado === 'buena') return 'buena';
    if (normalizado === 'regular' || normalizado === 'aceptable') return 'aceptable';
    if (normalizado === 'mala' || normalizado === 'deficiente') return 'deficiente';

    return null;
}

/**
 * Registrar nuevo evento operativo
 * POST /api/v1/eventos
 */
async function registrarEvento(req: CustomRequest, res: Response): Promise<void> {
    const { 
        id_lote, tipo_evento, descripcion,
        volumen_litros, duracion_minutos, metodo_riego,
        tipo_insumo, dosis_gramos, metodo_aplicacion, concentracion_ppm,
        tipo_plaga, severidad, accion_tomada, producto_utilizado, dosis_producto,
        peso_kg, calidad_visual, cantidad_plantas, rendimiento_estimado,
        observaciones, temperatura_ambiental_c, humedad_relativa_pct,
        registrado_por_dispositivo
    } = req.body;
    
    const idUsuario = req.usuario?.id_usuario;

    try {
        // Validaciones
        if (!id_lote || !tipo_evento) {
            res.status(400).json({
                error: 'id_lote y tipo_evento son requeridos'
            });
            return;
        }

        // Verificar que el lote pertenezca al usuario
        const lote = await db.oneOrNone(
            'SELECT id_lote FROM lotes WHERE id_lote = $1 AND id_usuario = $2',
            [id_lote, idUsuario]
        );

        if (!lote) {
            res.status(403).json({
                error: 'Lote no encontrado o no tienes permiso',
                code: 'LOTE_NOT_FOUND'
            });
            return;
        }

        const severidadNormalizada = normalizarSeveridad(severidad);
        const calidadVisualNormalizada = normalizarCalidadVisual(calidad_visual);

        // Insertar evento
        const evento = await db.one(
            `INSERT INTO eventos_operativos (
                id_lote, id_usuario, tipo_evento, descripcion,
                volumen_litros, duracion_minutos, metodo_riego,
                tipo_insumo, dosis_gramos, metodo_aplicacion, concentracion_ppm,
                tipo_plaga, severidad, accion_tomada, producto_utilizado, dosis_producto,
                peso_kg, calidad_visual, cantidad_plantas, rendimiento_estimado,
                observaciones, temperatura_ambiental_c, humedad_relativa_pct,
                registrado_por_dispositivo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24
            ) RETURNING id_evento, id_lote, tipo_evento, timestamp, descripcion`,
            [
                id_lote, idUsuario, tipo_evento, descripcion,
                volumen_litros || null, duracion_minutos || null, metodo_riego || null,
                tipo_insumo || null, dosis_gramos || null, metodo_aplicacion || null, concentracion_ppm || null,
                tipo_plaga || null, severidadNormalizada || null, accion_tomada || null, producto_utilizado || null, dosis_producto || null,
                peso_kg || null, calidadVisualNormalizada || null, cantidad_plantas || null, rendimiento_estimado || null,
                observaciones || null, temperatura_ambiental_c || null, humedad_relativa_pct || null,
                registrado_por_dispositivo || null
            ]
        );

        // Nota: La tabla eventos_operativos tiene sus propios campos de auditoría
        // (fecha_creacion, ultima_actualizacion) así que no necesitamos logs_auditoria

        res.status(201).json({
            success: true,
            mensaje: `Evento ${tipo_evento} registrado exitosamente`,
            data: evento
        });

        logger.info(`Evento ${tipo_evento} registrado para lote ${id_lote}`);
    } catch (error: any) {
        logger.error('Error al registrar evento:', error);

        if (error?.code === '23514') {
            res.status(400).json({
                error: 'Datos inválidos para evento. Revisa severidad/calidad visual y vuelve a intentar'
            });
            return;
        }

        res.status(500).json({
            error: 'Error al registrar evento'
        });
    }
}

/**
 * Obtener eventos de un lote
 * GET /api/v1/eventos/lotes/:id
 */
async function obtenerEventosPorLote(req: CustomRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { tipo_evento, limit = 100, offset = 0 } = req.query;
    const idUsuario = req.usuario?.id_usuario;

    try {
        // Verificar que el lote pertenezca al usuario
        const lote = await db.oneOrNone(
            'SELECT id_lote FROM lotes WHERE id_lote = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!lote) {
            res.status(403).json({
                error: 'Lote no encontrado',
                code: 'LOTE_NOT_FOUND'
            });
            return;
        }

        // Obtener eventos
        let query = 'SELECT * FROM eventos_operativos WHERE id_lote = $1';
        const params: any[] = [id];

        if (tipo_evento) {
            query += ` AND tipo_evento = $${params.length + 1}`;
            params.push(tipo_evento);
        }

        query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const eventos = await db.query(query, params);

        // Contar total
        const total = await db.one(
            'SELECT COUNT(*) as count FROM eventos_operativos WHERE id_lote = $1',
            [id]
        );

        res.status(200).json({
            success: true,
            total: total.count,
            limit,
            offset,
            lote_id: id,
            data: eventos
        });

        logger.info(`Eventos obtenidos para lote ${id}`);
    } catch (error) {
        logger.error('Error al obtener eventos:', error);
        res.status(500).json({
            error: 'Error al obtener eventos'
        });
    }
}

/**
 * Obtener evento específico
 * GET /api/v1/eventos/:id
 */
async function obtenerEvento(req: CustomRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const idUsuario = req.usuario?.id_usuario;

    try {
        const evento = await db.oneOrNone(
            'SELECT * FROM eventos_operativos WHERE id_evento = $1',
            [id]
        );

        if (!evento) {
            res.status(404).json({
                error: 'Evento no encontrado',
                code: 'EVENTO_NOT_FOUND'
            });
            return;
        }

        // Verificar que el evento pertenezca al usuario
        if (evento.id_usuario !== idUsuario) {
            res.status(403).json({
                error: 'No tienes permiso para ver este evento',
                code: 'FORBIDDEN'
            });
            return;
        }

        res.status(200).json({
            success: true,
            evento
        });

        logger.info(`Evento ${id} obtenido`);
    } catch (error) {
        logger.error('Error al obtener evento:', error);
        res.status(500).json({
            error: 'Error al obtener evento'
        });
    }
}

/**
 * Actualizar evento
 * PUT /api/v1/eventos/:id
 */
async function actualizarEvento(req: CustomRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const idUsuario = req.usuario?.id_usuario;
    const updates = req.body;

    try {
        const evento = await db.oneOrNone(
            'SELECT * FROM eventos_operativos WHERE id_evento = $1',
            [id]
        );

        if (!evento) {
            res.status(404).json({
                error: 'Evento no encontrado',
                code: 'EVENTO_NOT_FOUND'
            });
            return;
        }

        if (evento.id_usuario !== idUsuario) {
            res.status(403).json({
                error: 'No tienes permiso para actualizar este evento',
                code: 'FORBIDDEN'
            });
            return;
        }

        // Construir UPDATE dinámico (solo campos proporcionados)
        const allowedFields = [
            'descripcion', 'volumen_litros', 'duracion_minutos', 'metodo_riego',
            'tipo_insumo', 'dosis_gramos', 'metodo_aplicacion', 'concentracion_ppm',
            'tipo_plaga', 'severidad', 'accion_tomada', 'producto_utilizado', 'dosis_producto',
            'peso_kg', 'calidad_visual', 'cantidad_plantas', 'rendimiento_estimado',
            'observaciones', 'temperatura_ambiental_c', 'humedad_relativa_pct'
        ];

        let query = 'UPDATE eventos_operativos SET ';
        const values: any[] = [];
        let paramCount = 1;

        for (const field of allowedFields) {
            if (field in updates) {
                if (paramCount > 1) query += ', ';
                query += `${field} = $${paramCount}`;
                values.push(updates[field]);
                paramCount++;
            }
        }

        query += ` WHERE id_evento = $${paramCount} RETURNING *`;
        values.push(id);

        const eventoActualizado = await db.one(query, values);

        res.status(200).json({
            success: true,
            mensaje: 'Evento actualizado exitosamente',
            data: eventoActualizado
        });

        logger.info(`Evento ${id} actualizado`);
    } catch (error) {
        logger.error('Error al actualizar evento:', error);
        res.status(500).json({
            error: 'Error al actualizar evento'
        });
    }
}

/**
 * Eliminar evento
 * DELETE /api/v1/eventos/:id
 */
async function eliminarEvento(req: CustomRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const idUsuario = req.usuario?.id_usuario;

    try {
        const evento = await db.oneOrNone(
            'SELECT * FROM eventos_operativos WHERE id_evento = $1',
            [id]
        );

        if (!evento) {
            res.status(404).json({
                error: 'Evento no encontrado',
                code: 'EVENTO_NOT_FOUND'
            });
            return;
        }

        if (evento.id_usuario !== idUsuario) {
            res.status(403).json({
                error: 'No tienes permiso para eliminar este evento',
                code: 'FORBIDDEN'
            });
            return;
        }

        await db.query('DELETE FROM eventos_operativos WHERE id_evento = $1', [id]);

        res.status(200).json({
            success: true,
            mensaje: 'Evento eliminado exitosamente'
        });

        logger.info(`Evento ${id} eliminado`);
    } catch (error) {
        logger.error('Error al eliminar evento:', error);
        res.status(500).json({
            error: 'Error al eliminar evento'
        });
    }
}

export default {
    registrarEvento,
    obtenerEventosPorLote,
    obtenerEvento,
    actualizarEvento,
    eliminarEvento
};
