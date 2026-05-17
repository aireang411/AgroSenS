// ============================================================
// RUTAS DE RECOMENDACIONES
// ============================================================

const express = require('express');
const { verificarToken } = require('../middlewares/auth');
const recomendacionesController = require('../controllers/recomendacionesController');

const router = express.Router();
router.use(verificarToken);

/**
 * GET /api/v1/recomendaciones
 * Obtener recomendaciones activas del usuario
 */
router.get('/', recomendacionesController.obtenerRecomendaciones);

/**
 * GET /api/v1/recomendaciones/stats
 * Obtener estadísticas de recomendaciones
 */
router.get('/stats', recomendacionesController.obtenerEstadisticas);

/**
 * GET /api/v1/recomendaciones/:id_alerta
 * Obtener recomendación de una alerta
 */
router.get('/:id_alerta', recomendacionesController.obtenerRecomendacion);

/**
 * GET /api/v1/recomendaciones/lote/:id_lote
 * Obtener recomendaciones de un lote
 */
router.get('/lote/:id_lote', recomendacionesController.obtenerRecomendacionesPorLote);

module.exports = router;
