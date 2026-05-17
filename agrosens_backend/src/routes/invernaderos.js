// ============================================================
// RUTAS DE INVERNADEROS
// ============================================================

const express = require('express');
const { verificarToken } = require('../middlewares/auth');
const invernadesController = require('../controllers/invernadesController');

const router = express.Router();
router.use(verificarToken);

/**
 * POST /api/v1/invernaderos
 * Crear nuevo invernadero
 */
router.post('/', invernadesController.crearInvernadero);

/**
 * GET /api/v1/invernaderos
 * Obtener todos los invernaderos
 */
router.get('/', invernadesController.obtenerInvernaderos);

/**
 * GET /api/v1/invernaderos/:id
 * Obtener invernadero con sus lotes
 */
router.get('/:id', invernadesController.obtenerInvernadero);

/**
 * PUT /api/v1/invernaderos/:id
 * Actualizar invernadero
 */
router.put('/:id', invernadesController.actualizarInvernadero);

/**
 * DELETE /api/v1/invernaderos/:id
 * Eliminar invernadero
 */
router.delete('/:id', invernadesController.eliminarInvernadero);

module.exports = router;
