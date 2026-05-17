// ============================================================
// SCRIPT PARA CREAR BD Y TABLAS AUTOMÁTICAMENTE
// ============================================================

const pg = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión
const config = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
};

const client = new pg.Client(config);

async function setupDatabase() {
    try {
        console.log('📦 Conectando a PostgreSQL...');
        await client.connect();
        console.log('✓ Conectado a PostgreSQL');

        // 1. Crear base de datos
        console.log('\n📝 Creando base de datos agrosens_db...');
        try {
            await client.query('CREATE DATABASE agrosens_db;');
            console.log('✓ Base de datos agrosens_db creada');
        } catch (err) {
            if (err.code === '42P04') {
                console.log('⚠️  Base de datos agrosens_db ya existe');
            } else {
                throw err;
            }
        }

        // Reconectar a la nueva BD
        console.log('\n🔄 Reconectando a agrosens_db...');
        await client.end();
        
        const configDb = {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '1234',
            database: 'agrosens_db',
        };
        
        const clientDb = new pg.Client(configDb);
        await clientDb.connect();
        console.log('✓ Conectado a agrosens_db');

        // 2. Habilitar extensiones
        console.log('\n🔧 Habilitando extensiones PostgreSQL...');
        try {
            await clientDb.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            console.log('✓ Extensión uuid-ossp habilitada');
        } catch (err) {
            console.log('⚠️  Extensión uuid-ossp ya existe o no se pudo habilitar');
        }

        // 3. Crear tablas desde archivo SQL
        console.log('\n📄 Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'init_db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('\n🔨 Ejecutando script SQL...');
        
        // Dividir por `;` y ejecutar cada query
        const queries = sql.split(';').filter(q => q.trim());
        
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i].trim();
            if (query) {
                try {
                    await clientDb.query(query);
                    console.log(`✓ Query ${i + 1}/${queries.length} ejecutada`);
                } catch (err) {
                    console.log(`⚠️  Error en query ${i + 1}: ${err.message}`);
                }
            }
        }

        console.log('\n✅ Base de datos configurada correctamente');
        console.log('\n📊 Verificando tablas creadas...');
        
        const result = await clientDb.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log(`✓ Tablas creadas (${result.rows.length}):`);
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        await clientDb.end();
        console.log('\n🎉 ¡Setup completado exitosamente!\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error durante setup:', err);
        process.exit(1);
    }
}

setupDatabase();
