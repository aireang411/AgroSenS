// ============================================================
// RUTAS DE EVENTOS OPERATIVOS
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/auth';
import eventosController from '../controllers/eventosController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * POST /api/v1/eventos
 * Registrar nuevo evento operativo
 */
router.post('/', eventosController.registrarEvento);

/**
 * GET /api/v1/eventos/lotes/:id
 * Obtener todos los eventos de un lote
 */
router.get('/lotes/:id', eventosController.obtenerEventosPorLote);

/**
 * GET /api/v1/eventos/:id
 * Obtener evento específico
 */
router.get('/:id', eventosController.obtenerEvento);

/**
 * PUT /api/v1/eventos/:id
 * Actualizar evento
 */
router.put('/:id', eventosController.actualizarEvento);

/**
 * DELETE /api/v1/eventos/:id
 * Eliminar evento
 */
router.delete('/:id', eventosController.eliminarEvento);

export default router;
