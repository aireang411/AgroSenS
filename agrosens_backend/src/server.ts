// ============================================================
// AGROSENS BACKEND - SERVIDOR PRINCIPAL
// ============================================================

import * as dotenv from 'dotenv';
import express, { Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as path from 'path';

// Importar configuración
import logger from './utils/logger';
import { db } from './config/database';

// Importar rutas
import authRoutes from './routes/auth';
import sensoresRoutes from './routes/sensores';
import lotesRoutes from './routes/lotes';
import alertasRoutes from './routes/alertas';
import recomendacionesRoutes from './routes/recomendaciones';
import invernadesRoutes from './routes/invernaderos';
import metricsRoutes from './routes/metrics';
import simulationRoutes from './routes/simulation';
import eventosRoutes from './routes/eventos';

// Importar servicios
import SchedulerService from './services/schedulerService';

dotenv.config();

// Inicializar aplicación Express
const app: Express = express();

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================

// Seguridad
app.use(helmet());

// CORS
const corsOptions = {
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // En desarrollo, permitir localhost con cualquier puerto
        if (process.env.NODE_ENV === 'development') {
            if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                callback(null, true);
            } else {
                callback(null, true); // Permitir en desarrollo
            }
        } else {
            // En producción, validar contra lista de orígenes permitidos
            const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['https://agrosens.com'];
            if (allowedOrigins.includes(origin || '')) {
                callback(null, true);
            } else {
                callback(new Error('CORS not allowed'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parser JSON
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '50mb' }));
app.use(express.urlencoded({ limit: process.env.MAX_REQUEST_SIZE || '50mb', extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ============================================================
// RUTAS DE LA API
// ============================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rutas públicas
app.use('/api/v1/auth', authRoutes);

// Rutas protegidas (requieren autenticación JWT)
app.use('/api/v1/sensores', sensoresRoutes);
app.use('/api/v1/lotes', lotesRoutes);
app.use('/api/v1/alertas', alertasRoutes);
app.use('/api/v1/recomendaciones', recomendacionesRoutes);
app.use('/api/v1/invernaderos', invernadesRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/simulation', simulationRoutes);
app.use('/api/v1/eventos', eventosRoutes);

// Ruta no encontrada
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method
    });
});

// ============================================================
// MANEJO DE ERRORES
// ============================================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error sin manejar:', err);

    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(status).json({
        error: message,
        status,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
    try {
        // Probar conexión a la base de datos
        await db.query('SELECT NOW()');
        logger.info(`✓ Conexión a base de datos establecida`);
        
        // Iniciar scheduler automático de simulación
        SchedulerService.start();
    } catch (err) {
        logger.error('✗ Error al conectar con la base de datos:', err);
        // No hacer exit si la BD no está disponible en desarrollo
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }

    logger.info(`🚀 Servidor AgroSenS ejecutándose en puerto ${PORT}`);
    logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// ============================================================
// MANEJO DE SEÑALES PARA CIERRE ELEGANTE
// ============================================================

process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido, cerrando servidor...');
    SchedulerService.stop();
    server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT recibido, cerrando servidor...');
    SchedulerService.stop();
    server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
    });
});

// ============================================================
// MANEJO DE EXCEPCIONES NO CAPTURADAS
// ============================================================

process.on('uncaughtException', (err: Error) => {
    logger.error('Excepción no capturada:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Promesa rechazada no manejada:', reason);
    process.exit(1);
});

export default app;
