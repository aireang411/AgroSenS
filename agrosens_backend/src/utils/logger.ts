// ============================================================
// CONFIGURACIÓN DE LOGGING
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'agrosens-backend' },
    transports: [
        // Archivo de errores
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error'
        }),
        // Archivo combinado
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log')
        })
    ]
});

// Agregar console en desarrollo
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
        )
    }));
}

// Stream para Morgan (logging de HTTP)
logger.stream = {
    write: (message: string) => logger.info(message.trim())
} as any;

export default logger;
