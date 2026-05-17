// ============================================================
// CONTROLADOR DE INVERNADEROS
// Cumple con: RF-ADM-01 (Gestión de Nodos y Dispositivos)
// ============================================================

import { Response } from 'express';
import db from '../config/database';
import logger from '../utils/logger';
import { CustomRequest } from '../types';

/**
 * Crear nuevo invernadero
 * POST /api/v1/invernaderos
 */
async function crearInvernadero(req: CustomRequest, res: Response): Promise<void> {
    const { nombre, ubicacion_latitud, ubicacion_longitud, direccion, orientacion, area_m2 } = req.body;
    const idUsuario = req.usuario?.id_usuario;

    try {
        // Validar entrada
        if (!nombre) {
            res.status(400).json({
                error: 'El nombre del invernadero es requerido'
            });
            return;
        }

        // Crear invernadero
        const invernadero = await db.one(
            `INSERT INTO invernaderos (id_usuario, nombre, ubicacion_latitud, ubicacion_longitud, direccion, orientacion, area_m2)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id_invernadero, nombre, ubicacion_latitud, ubicacion_longitud, direccion, orientacion, area_m2, estado, fecha_creacion`,
            [idUsuario, nombre, ubicacion_latitud || null, ubicacion_longitud || null, direccion || null, orientacion || null, area_m2 || null]
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'crear_lote', `Invernadero creado: ${nombre}`, 'invernaderos', invernadero.id_invernadero]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Invernadero creado exitosamente',
            invernadero
        });

        logger.info(`Invernadero creado: ${nombre}`);
    } catch (error) {
        logger.error('Error al crear invernadero:', error);
        res.status(500).json({
            error: 'Error al crear invernadero',
            code: 'CREATE_GREENHOUSE_ERROR'
        });
    }
}

/**
 * Obtener invernaderos de un usuario
 * GET /api/v1/invernaderos
 */
async function obtenerInvernaderos(req: CustomRequest, res: Response): Promise<void> {
    const idUsuario = req.usuario?.id_usuario;
    const { estado } = req.query;

    try {
        let query = `
            SELECT i.*, COUNT(DISTINCT l.id_lote) as total_lotes
            FROM invernaderos i
            LEFT JOIN lotes l ON i.id_invernadero = l.id_invernadero
            WHERE i.id_usuario = $1
        `;
        
        const params: any[] = [idUsuario];

        if (estado !== undefined) {
            query += ` AND i.estado = $${params.length + 1}`;
            params.push(estado === 'true');
        }

        query += ` GROUP BY i.id_invernadero ORDER BY i.fecha_creacion DESC`;

        const invernaderos = await db.query(query, params);

        res.status(200).json({
            success: true,
            total: invernaderos.length,
            invernaderos
        });
    } catch (error) {
        logger.error('Error al obtener invernaderos:', error);
        res.status(500).json({
            error: 'Error al obtener invernaderos'
        });
    }
}

/**
 * Obtener invernadero específico con sus lotes
 * GET /api/v1/invernaderos/:id
 */
async function obtenerInvernadero(req: CustomRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const idUsuario = req.usuario?.id_usuario;

    try {
        const invernadero = await db.oneOrNone(
            `SELECT * FROM invernaderos
             WHERE id_invernadero = $1 AND id_usuario = $2`,
            [id, idUsuario]
        );

        if (!invernadero) {
            res.status(404).json({
                error: 'Invernadero no encontrado',
                code: 'GREENHOUSE_NOT_FOUND'
            });
            return;
        }

        // Obtener lotes asociados
        const lotes = await db.query(
            `SELECT * FROM lotes
             WHERE id_invernadero = $1 AND id_usuario = $2
             ORDER BY fecha_creacion DESC`,
            [id, idUsuario]
        );

        res.status(200).json({
            success: true,
            invernadero,
            lotes,
            total_lotes: lotes.length
        });
    } catch (error) {
        logger.error('Error al obtener invernadero:', error);
        res.status(500).json({
            error: 'Error al obtener invernadero'
        });
    }
}

/**
 * Actualizar invernadero
 * PUT /api/v1/invernaderos/:id
 */
async function actualizarInvernadero(req: CustomRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { nombre, ubicacion_latitud, ubicacion_longitud, direccion, orientacion, area_m2, estado } = req.body;
    const idUsuario = req.usuario?.id_usuario;

    try {
        // Verificar que el invernadero pertenezca al usuario
        const invernadero = await db.oneOrNone(
            'SELECT id_invernadero FROM invernaderos WHERE id_invernadero = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!invernadero) {
            res.status(403).json({
                error: 'Invernadero no encontrado o no tienes permiso',
                code: 'GREENHOUSE_NOT_FOUND'
            });
            return;
        }

        // Construir query de actualización
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (nombre !== undefined) {
            updates.push(`nombre = $${paramCount++}`);
            values.push(nombre);
        }
        if (ubicacion_latitud !== undefined) {
            updates.push(`ubicacion_latitud = $${paramCount++}`);
            values.push(ubicacion_latitud || null);
        }
        if (ubicacion_longitud !== undefined) {
            updates.push(`ubicacion_longitud = $${paramCount++}`);
            values.push(ubicacion_longitud || null);
        }
        if (direccion !== undefined) {
            updates.push(`direccion = $${paramCount++}`);
            values.push(direccion || null);
        }
        if (orientacion !== undefined) {
            updates.push(`orientacion = $${paramCount++}`);
            values.push(orientacion || null);
        }
        if (area_m2 !== undefined) {
            updates.push(`area_m2 = $${paramCount++}`);
            values.push(area_m2 || null);
        }
        if (estado !== undefined) {
            updates.push(`estado = $${paramCount++}`);
            values.push(estado);
        }

        if (updates.length === 0) {
            res.status(400).json({
                error: 'No hay campos para actualizar'
            });
            return;
        }

        values.push(id);

        const query = `
            UPDATE invernaderos
            SET ${updates.join(', ')}
            WHERE id_invernadero = $${paramCount}
            RETURNING id_invernadero, nombre, ubicacion_latitud, ubicacion_longitud, direccion, orientacion, area_m2, estado
        `;

        const updatedInvernadero = await db.one(query, values);

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'crear_lote', `Invernadero actualizado: ${id}`, 'invernaderos', id]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Invernadero actualizado exitosamente',
            invernadero: updatedInvernadero
        });
    } catch (error) {
        logger.error('Error al actualizar invernadero:', error);
        res.status(500).json({
            error: 'Error al actualizar invernadero'
        });
    }
}

/**
 * Eliminar invernadero
 * DELETE /api/v1/invernaderos/:id
 */
async function eliminarInvernadero(req: CustomRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const idUsuario = req.usuario?.id_usuario;

    try {
        // Verificar que el invernadero pertenezca al usuario
        const invernadero = await db.oneOrNone(
            'SELECT id_invernadero FROM invernaderos WHERE id_invernadero = $1 AND id_usuario = $2',
            [id, idUsuario]
        );

        if (!invernadero) {
            res.status(403).json({
                error: 'Invernadero no encontrado o no tienes permiso',
                code: 'GREENHOUSE_NOT_FOUND'
            });
            return;
        }

        // Eliminar invernadero (cascada eliminará lotes, sensores, etc.)
        await db.query('DELETE FROM invernaderos WHERE id_invernadero = $1', [id]);

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [idUsuario, 'crear_lote', `Invernadero eliminado: ${id}`, 'invernaderos', id]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Invernadero eliminado exitosamente'
        });

        logger.info(`Invernadero eliminado: ${id}`);
    } catch (error) {
        logger.error('Error al eliminar invernadero:', error);
        res.status(500).json({
            error: 'Error al eliminar invernadero'
        });
    }
}

export default {
    crearInvernadero,
    obtenerInvernaderos,
    obtenerInvernadero,
    actualizarInvernadero,
    eliminarInvernadero
};
