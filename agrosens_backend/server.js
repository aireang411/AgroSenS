// ============================================================
// AGROSENS BACKEND - SERVIDOR PRINCIPAL
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Importar configuración
const logger = require('./src/utils/logger');
const db = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const sensoresRoutes = require('./src/routes/sensores');
const lotesRoutes = require('./src/routes/lotes');
const alertasRoutes = require('./src/routes/alertas');
const recomendacionesRoutes = require('./src/routes/recomendaciones');
const invernadesRoutes = require('./src/routes/invernaderos');
const metricsRoutes = require('./src/routes/metrics');

// Inicializar aplicación Express
const app = express();

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
app.get('/health', (req, res) => {
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

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method
    });
});

// ============================================================
// MANEJO DE ERRORES
// ============================================================

app.use((err, req, res, next) => {
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

// ============================================================
// MANEJO DE SEÑALES PARA CIERRE ELEGANTE
// ============================================================

process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT recibido, cerrando servidor...');
    server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
    });
});

// ============================================================
// MANEJO DE EXCEPCIONES NO CAPTURADAS
// ============================================================

process.on('uncaughtException', (err) => {
    logger.error('Excepción no capturada:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesa rechazada no manejada:', reason);
    process.exit(1);
});

module.exports = app;
