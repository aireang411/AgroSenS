// ============================================================
// CONFIGURACIÓN DE CONEXIÓN A POSTGRESQL
// ============================================================

import pgPromise, { IDatabase, IInitOptions } from 'pg-promise';
import * as dotenv from 'dotenv';

dotenv.config();

// Configurar pg-promise - opciones globales
const initOptions: IInitOptions<any> = {
    query: (e: any) => {
        // console.log('Query:', e.query);
    },
    error: (error: any) => {
        console.error('DB Error:', error);
    }
};

const pgp = pgPromise(initOptions);

// Configurar la conexión con opciones de cliente
const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'agrosens_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    ssl: process.env.DB_SSL === 'true' ? true : false,
};

export const db: IDatabase<any> = pgp(connectionConfig);

// Exportar pgp para acceder a las queries helper
export { pgp };

// Probar conexión al iniciar
db.connect()
    .then(obj => {
        obj.done();
        console.log('✓ Conexión a PostgreSQL establecida correctamente');
    })
    .catch(error => {
        console.error('✗ Error al conectar con PostgreSQL:', error);
        process.exit(1);
    });

export default db;
