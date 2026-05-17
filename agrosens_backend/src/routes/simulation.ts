// ============================================================
// RUTAS DE SIMULACIÓN
// Endpoints para generar datos de prueba simulados
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/auth';
import simulationController from '../controllers/simulationController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * POST /api/v1/simulation/lotes/:id/generate-reading
 * Generar una lectura simulada actual para todos los sensores del lote
 */
router.post('/:id/generate-reading', simulationController.generateReadingForLote);

/**
 * POST /api/v1/simulation/lotes/:id/generate-history
 * Generar histórico de lecturas simuladas (últimas 24 horas por defecto)
 */
router.post('/:id/generate-history', simulationController.generateHistoryForLote);

/**
 * POST /api/v1/simulation/generate-all
 * Generar lecturas simuladas para todos los lotes del usuario
 */
router.post('/generate-all', simulationController.generateReadingsForAllUserLotes);

export default router;
