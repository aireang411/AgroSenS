// ============================================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// Cumple con: RF-SEC-01
// ============================================================

import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { db } from '../config/database';

// Extender Request para incluir usuario
declare global {
    namespace Express {
        interface Request {
            usuario?: {
                id_usuario: number;
                email: string;
                rol: string;
            };
        }
    }
}

/**
 * Middleware para verificar token JWT
 */
export async function verificarToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<any> {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token no proporcionado',
                code: 'NO_TOKEN'
            });
        }

        const token = authHeader.slice(7); // Remover "Bearer "

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;

        // Buscar usuario en BD
        const usuario = await db.oneOrNone(
            'SELECT id_usuario, email, rol, estado FROM usuarios WHERE id_usuario = $1',
            [decoded.id_usuario]
        );

        if (!usuario) {
            return res.status(401).json({
                error: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!usuario.estado) {
            return res.status(403).json({
                error: 'Usuario inactivo',
                code: 'USER_INACTIVE'
            });
        }

        // Agregar usuario al objeto de solicitud
        req.usuario = {
            id_usuario: usuario.id_usuario,
            email: usuario.email,
            rol: usuario.rol
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                error: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }

        logger.error('Error en autenticación:', error);
        res.status(500).json({
            error: 'Error en autenticación',
            code: 'AUTH_ERROR'
        });
    }
}

/**
 * Middleware para verificar rol específico
 */
export function verificarRol(...rolesPermitidos: string[]) {
    return (req: Request, res: Response, next: NextFunction): any => {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Usuario no autenticado',
                code: 'NO_AUTH'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: 'Permiso denegado',
                code: 'FORBIDDEN',
                requerido: rolesPermitidos,
                actual: req.usuario.rol
            });
        }

        next();
    };
}

/**
 * Genera token JWT
 */
export function generarToken(usuario: any, expiresIn: string = process.env.JWT_EXPIRE || '24h'): string {
    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            email: usuario.email,
            rol: usuario.rol
        },
        process.env.JWT_SECRET || '',
        { expiresIn } as any
    );
}

/**
 * Genera refresh token
 */
export function generarRefreshToken(usuario: any): string {
    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            type: 'refresh'
        },
        process.env.JWT_SECRET || '',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' } as any
    );
}

export default {
    verificarToken,
    verificarRol,
    generarToken,
    generarRefreshToken
};
