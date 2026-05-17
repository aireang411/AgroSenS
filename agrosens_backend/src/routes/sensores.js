// ============================================================
// RUTAS DE SENSORES
// ============================================================

const express = require('express');
const { verificarToken } = require('../middlewares/auth');
const sensoresController = require('../controllers/sensoresController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * POST /api/v1/sensores
 * Crear nuevo sensor
 */
router.post('/', sensoresController.crearSensor);

/**
 * GET /api/v1/sensores
 * Obtener todos los sensores del usuario
 */
router.get('/', sensoresController.obtenerSensores);

/**
 * GET /api/v1/sensores/:id
 * Obtener sensor específico
 */
router.get('/:id', sensoresController.obtenerSensor);

/**
 * PUT /api/v1/sensores/:id
 * Actualizar sensor
 */
router.put('/:id', sensoresController.actualizarSensor);

/**
 * POST /api/v1/sensores/simulacion/evento
 * Simular lectura de sensor desde un evento operativo
 */
router.post('/simulacion/evento', sensoresController.simularLecturaDesdeEvento);

/**
 * POST /api/v1/sensores/:id/lecturas
 * Ingresar lectura de sensor
 */
router.post('/:id/lecturas', sensoresController.ingresarLectura);

/**
 * GET /api/v1/sensores/:id/lecturas
 * Obtener lecturas del sensor
 */
router.get('/:id/lecturas', sensoresController.obtenerLecturas);

/**
 * DELETE /api/v1/sensores/:id
 * Eliminar sensor
 */
router.delete('/:id', sensoresController.eliminarSensor);

module.exports = router;
