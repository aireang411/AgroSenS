// ============================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================

const express = require('express');
const { verificarToken } = require('../middlewares/auth');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', authController.registrar);

/**
 * POST /api/v1/auth/login
 * Login de usuario
 */
router.post('/login', authController.login);

/**
 * POST /api/v1/auth/refresh
 * Refrescar token JWT
 */
router.post('/refresh', authController.refrescarToken);

/**
 * POST /api/v1/auth/cambiar-password
 * Cambiar contraseña (requiere autenticación)
 */
router.post('/cambiar-password', verificarToken, authController.cambiarPassword);

module.exports = router;
