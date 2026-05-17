// ============================================================
// AGROSENS BACKEND - SERVIDOR PRINCIPAL
// ============================================================

import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Importar configuración
import { logger } from './src/utils/logger';
import db from './src/config/database';

// Importar rutas
import authRoutes from './src/routes/auth';
import sensoresRoutes from './src/routes/sensores';
import lotesRoutes from './src/routes/lotes';
import alertasRoutes from './src/routes/alertas';
import recomendacionesRoutes from './src/routes/recomendaciones';
import invernadoresRoutes from './src/routes/invernaderos';
import metricsRoutes from './src/routes/metrics';

// Inicializar aplicación Express
const app: Express = express();

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================

// Seguridad
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
}));

// Parser JSON
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '50mb' }));
app.use(express.urlencoded({ limit: process.env.MAX_REQUEST_SIZE || '50mb', extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
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
app.use('/api/v1/invernaderos', invernadoresRoutes);
app.use('/api/v1/metrics', metricsRoutes);

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
    } catch (err) {
        logger.error('✗ Error al conectar con la base de datos:', err);
        process.exit(1);
    }

    logger.info(`🚀 Servidor AgroSenS ejecutándose en puerto ${PORT}`);
    logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
