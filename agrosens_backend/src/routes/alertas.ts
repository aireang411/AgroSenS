// ============================================================
// RUTAS DE ALERTAS
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/auth';
import alertasController from '../controllers/alertasController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * POST /api/v1/alertas/generar
 * Generar nueva alerta
 */
router.post('/generar', alertasController.generarAlerta);

/**
 * GET /api/v1/alertas
 * Obtener alertas del usuario
 */
router.get('/', alertasController.obtenerAlertas);

/**
 * GET /api/v1/alertas/cultivo/:id_lote
 * Obtener y generar alertas/recomendaciones por cultivo
 */
router.get('/cultivo/:id_lote', alertasController.obtenerAlertasPorCultivo);

/**
 * GET /api/v1/alertas/:id
 * Obtener alerta específica
 */
router.get('/:id', alertasController.obtenerAlerta);

/**
 * PUT /api/v1/alertas/:id
 * Actualizar alerta
 */
router.put('/:id', alertasController.actualizarAlerta);

/**
 * POST /api/v1/alertas/:id/marcar-vista
 * Marcar alerta como vista (registra tiempo de reacción)
 */
router.post('/:id/marcar-vista', alertasController.marcarAlertaVista);

export default router;
