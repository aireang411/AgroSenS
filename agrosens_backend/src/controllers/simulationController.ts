// ============================================================
// CONTROLADOR DE SIMULACIÓN
// Endpoints para generar y gestionar datos simulados
// ============================================================

import { Response } from 'express';
import { CustomRequest } from '../types';
import SimulationService from '../services/simulationService';
import logger from '../utils/logger';

/**
 * Generar lectura simulada para un lote específico
 * POST /api/v1/simulation/lotes/:id/generate-reading
 */
async function generateReadingForLote(req: CustomRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const idUsuario = req.usuario?.id_usuario;

  try {
    // Verificar que el lote pertenezca al usuario
    const db = require('../config/database').default;
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

    const reading = await SimulationService.generateReadingsForLote(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Lecturas simuladas generadas exitosamente',
      lote_id: id,
      readings_count: reading.length,
      readings: reading
    });

    logger.info(`Lecturas simuladas generadas para lote ${id}`);
  } catch (error) {
    logger.error('Error generando lectura simulada:', error);
    res.status(500).json({
      error: 'Error generando datos simulados'
    });
  }
}

/**
 * Generar histórico de lecturas simuladas
 * POST /api/v1/simulation/lotes/:id/generate-history
 */
async function generateHistoryForLote(req: CustomRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { hours = 24, sensor_id } = req.body;
  const idUsuario = req.usuario?.id_usuario;

  try {
    // Verificar que el lote pertenezca al usuario
    const db = require('../config/database').default;
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

    // Obtener sensor del lote
    const sensor = await db.oneOrNone(
      'SELECT id_sensor FROM sensores WHERE id_lote = $1 LIMIT 1',
      [id]
    );

    if (!sensor) {
      res.status(400).json({
        error: 'El lote no tiene sensores asignados'
      });
      return;
    }

    const readings = await SimulationService.generateHistoricalData(
      parseInt(id),
      parseInt(sensor.id_sensor),
      parseInt(String(hours))
    );

    res.status(200).json({
      success: true,
      message: 'Histórico de lecturas simuladas generado',
      lote_id: id,
      hours: hours,
      readings_count: readings.length,
      readings: readings
    });

    logger.info(`Histórico simulado generado para lote ${id}: ${readings.length} lecturas`);
  } catch (error) {
    logger.error('Error generando histórico simulado:', error);
    res.status(500).json({
      error: 'Error generando histórico simulado'
    });
  }
}

/**
 * Generar lecturas para todos los lotes del usuario
 * POST /api/v1/simulation/generate-all
 */
async function generateReadingsForAllUserLotes(req: CustomRequest, res: Response): Promise<void> {
  const idUsuario = req.usuario?.id_usuario;

  try {
    const totalReadings = await SimulationService.generateReadingsForAllUserLotes(idUsuario!);

    res.status(200).json({
      success: true,
      message: 'Lecturas simuladas generadas para todos los lotes',
      user_id: idUsuario,
      total_readings: totalReadings
    });

    logger.info(`Lecturas simuladas generadas para todos los lotes del usuario ${idUsuario}`);
  } catch (error) {
    logger.error('Error generando lecturas globales:', error);
    res.status(500).json({
      error: 'Error generando datos simulados globales'
    });
  }
}

export default {
  generateReadingForLote,
  generateHistoryForLote,
  generateReadingsForAllUserLotes
};
