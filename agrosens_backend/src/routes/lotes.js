// ============================================================
// RUTAS DE LOTES
// ============================================================

const express = require('express');
const { verificarToken } = require('../middlewares/auth');
const lotesController = require('../controllers/lotesController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * POST /api/v1/lotes
 * Crear nuevo lote
 */
router.post('/', lotesController.crearLote);

/**
 * GET /api/v1/lotes
 * Obtener lotes del usuario
 */
router.get('/', lotesController.obtenerLotes);

/**
 * GET /api/v1/lotes/:id
 * Obtener lote específico
 */
router.get('/:id', lotesController.obtenerLote);

/**
 * PUT /api/v1/lotes/:id
 * Actualizar lote
 */
router.put('/:id', lotesController.actualizarLote);

/**
 * DELETE /api/v1/lotes/:id
 * Eliminar lote
 */
router.delete('/:id', lotesController.eliminarLote);

module.exports = router;
