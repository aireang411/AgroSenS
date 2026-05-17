// ============================================================
// CONTROLADOR DE AUTENTICACIÓN
// Cumple con: RF-SEC-01
// ============================================================

import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { db } from '../config/database';
import logger from '../utils/logger';
import { generarToken, generarRefreshToken } from '../middlewares/auth';
import * as jwt from 'jsonwebtoken';
import { CustomRequest } from '../types';

/**
 * Registrar nuevo usuario
 * POST /api/v1/auth/register
 */
export async function registrar(req: CustomRequest, res: Response): Promise<any> {
    const { email, password, nombre_completo, rol, telefono } = req.body;

    try {
        // Validar entrada
        if (!email || !password || !nombre_completo) {
            return res.status(400).json({
                error: 'Email, contraseña y nombre son requeridos'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Formato de email inválido'
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await db.oneOrNone(
            'SELECT id_usuario FROM usuarios WHERE email = $1',
            [email]
        );

        if (usuarioExistente) {
            return res.status(409).json({
                error: 'El email ya está registrado',
                code: 'EMAIL_EXISTS'
            });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario
        const usuario = await db.one(
            `INSERT INTO usuarios (email, password_hash, nombre_completo, rol, telefono)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id_usuario, email, nombre_completo, rol`,
            [email, passwordHash, nombre_completo, rol || 'agricultor', telefono || null]
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, entidad_afectada, id_entidad)
             VALUES ($1, $2, $3, $4, $5)`,
            [usuario.id_usuario, 'login', 'Registro de nuevo usuario', 'usuarios', usuario.id_usuario]
        );

        // Generar tokens
        const token = generarToken(usuario);
        const refreshToken = generarRefreshToken(usuario);

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            usuario: {
                id_usuario: usuario.id_usuario,
                email: usuario.email,
                nombre_completo: usuario.nombre_completo,
                rol: usuario.rol
            },
            token,
            refreshToken
        });

        logger.info(`Nuevo usuario registrado: ${email}`);
    } catch (error) {
        logger.error('Error en registro:', error);
        res.status(500).json({
            error: 'Error al registrar usuario',
            code: 'REGISTER_ERROR'
        });
    }
}

/**
 * Login de usuario
 * POST /api/v1/auth/login
 */
export async function login(req: CustomRequest, res: Response): Promise<any> {
    const { email, password } = req.body;

    try {
        // Validar entrada
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const usuario = await db.oneOrNone(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (!usuario) {
            // Registrar intento fallido en logs
            logger.warn(`Intento de login fallido para email: ${email} - usuario no existe`);
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verificar si el usuario está bloqueado
        if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
            return res.status(403).json({
                error: 'Usuario bloqueado temporalmente. Intente más tarde.',
                code: 'USER_BLOCKED',
                bloqueado_hasta: usuario.bloqueado_hasta
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            // Incrementar intentos fallidos
            const intentosFallidos = (usuario.intentos_fallidos || 0) + 1;
            const bloqueoTemporal = intentosFallidos >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

            await db.query(
                `UPDATE usuarios 
                 SET intentos_fallidos = $1, bloqueado_hasta = $2
                 WHERE id_usuario = $3`,
                [intentosFallidos, bloqueoTemporal, usuario.id_usuario]
            );

            logger.warn(`Intento de login fallido para: ${email} - Intento ${intentosFallidos}`);

            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos',
                code: 'INVALID_CREDENTIALS',
                intentos_restantes: Math.max(0, 5 - intentosFallidos)
            });
        }

        // Verificar si el usuario está activo
        if (!usuario.estado) {
            return res.status(403).json({
                error: 'Usuario inactivo',
                code: 'USER_INACTIVE'
            });
        }

        // Resetear intentos fallidos
        await db.query(
            `UPDATE usuarios 
             SET intentos_fallidos = 0, bloqueado_hasta = NULL
             WHERE id_usuario = $1`,
            [usuario.id_usuario]
        );

        // Generar tokens
        const token = generarToken(usuario);
        const refreshToken = generarRefreshToken(usuario);

        // Registrar login en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion, direccion_ip)
             VALUES ($1, $2, $3, $4)`,
            [usuario.id_usuario, 'login', 'Login exitoso', req.ip || req.connection.remoteAddress]
        );

        res.status(200).json({
            success: true,
            mensaje: 'Login exitoso',
            usuario: {
                id_usuario: usuario.id_usuario,
                email: usuario.email,
                nombre_completo: usuario.nombre_completo,
                rol: usuario.rol
            },
            token,
            refreshToken
        });

        logger.info(`Login exitoso: ${email}`);
    } catch (error) {
        logger.error('Error en login:', error);
        res.status(500).json({
            error: 'Error al iniciar sesión',
            code: 'LOGIN_ERROR'
        });
    }
}

/**
 * Refrescar token
 * POST /api/v1/auth/refresh
 */
export async function refrescarToken(req: CustomRequest, res: Response): Promise<any> {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Refresh token requerido'
            });
        }

        // Verificar refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || '') as any;

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }

        // Obtener usuario
        const usuario = await db.oneOrNone(
            'SELECT id_usuario, email, nombre_completo, rol FROM usuarios WHERE id_usuario = $1',
            [decoded.id_usuario]
        );

        if (!usuario) {
            return res.status(401).json({
                error: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        // Generar nuevo token
        const token = generarToken(usuario);
        const nuevoRefreshToken = generarRefreshToken(usuario);

        res.status(200).json({
            success: true,
            token,
            refreshToken: nuevoRefreshToken
        });
    } catch (error) {
        logger.error('Error al refrescar token:', error);
        res.status(401).json({
            error: 'Token inválido o expirado',
            code: 'TOKEN_ERROR'
        });
    }
}

/**
 * Cambiar contraseña
 * POST /api/v1/auth/cambiar-password
 */
export async function cambiarPassword(req: CustomRequest, res: Response): Promise<any> {
    try {
        const { password_actual, password_nueva } = req.body;
        const idUsuario = req.usuario?.id_usuario;

        if (!password_actual || !password_nueva) {
            return res.status(400).json({
                error: 'Contraseña actual y nueva son requeridas'
            });
        }

        if (password_nueva.length < 8) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener al menos 8 caracteres'
            });
        }

        // Obtener usuario
        const usuario = await db.oneOrNone(
            'SELECT password_hash FROM usuarios WHERE id_usuario = $1',
            [idUsuario]
        );

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({
                error: 'Contraseña actual incorrecta'
            });
        }

        // Hash de la nueva contraseña
        const passwordHash = await bcrypt.hash(password_nueva, 10);

        // Actualizar contraseña
        await db.query(
            'UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2',
            [passwordHash, idUsuario]
        );

        // Registrar en auditoría
        await db.query(
            `INSERT INTO logs_auditoria (id_usuario, tipo_evento, descripcion)
             VALUES ($1, $2, $3)`,
            [idUsuario, 'cambio_contraseña', 'Cambio de contraseña exitoso']
        );

        res.status(200).json({
            success: true,
            mensaje: 'Contraseña cambiada exitosamente'
        });

        logger.info(`Contraseña cambiada: Usuario ${idUsuario}`);
    } catch (error) {
        logger.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            error: 'Error al cambiar contraseña'
        });
    }
}

export default {
    registrar,
    login,
    refrescarToken,
    cambiarPassword
};
