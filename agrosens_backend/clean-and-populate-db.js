// ============================================================
// SCRIPT PARA LIMPIAR Y POBLAR LA BASE DE DATOS
// ============================================================

const pg = require('pg');
const bcrypt = require('bcryptjs');

const config = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'agrosens_db',
};

const client = new pg.Client(config);

async function cleanAndPopulateDatabase() {
    try {
        await client.connect();
        console.log('✓ Conectado a base de datos\n');

        // 1. Limpiar datos (mantener estructura de tablas)
        console.log('🧹 Limpiando datos anteriores...');
        await client.query('DELETE FROM lecturas_sensores CASCADE');
        await client.query('DELETE FROM recomendaciones CASCADE');
        await client.query('DELETE FROM alertas CASCADE');
        await client.query('DELETE FROM sensores CASCADE');
        await client.query('DELETE FROM lotes CASCADE');
        await client.query('DELETE FROM invernaderos CASCADE');
        await client.query('DELETE FROM usuarios WHERE email != \'admin@agrosens.com\'');
        console.log('✓ Datos limpios\n');

        // 2. Hash de contraseña
        const passwordHash = bcrypt.hashSync('test123', 10);

        // 3. Crear usuario de prueba
        console.log('📝 Creando usuario de prueba...');
        const userInsertResult = await client.query(`
            INSERT INTO usuarios (email, password_hash, nombre_completo, rol)
            VALUES ($1, $2, $3, $4)
            RETURNING id_usuario;
        `, ['agricultor@agrosens.com', passwordHash, 'Juan Pérez García', 'agricultor']);
        const userId = userInsertResult.rows[0].id_usuario;
        console.log('✓ Usuario creado\n');

        // 4. Crear invernaderos
        console.log('🏢 Creando invernaderos...');
        const invernaderoResult = await client.query(`
            INSERT INTO invernaderos (id_usuario, nombre, direccion, area_m2)
            VALUES 
            ($1, 'Invernadero Tomates', 'Sector A - Finca Los Valles', 500),
            ($1, 'Invernadero Lechugas', 'Sector B - Finca Los Valles', 300),
            ($1, 'Invernadero Pimientos', 'Sector C - Finca Los Valles', 200)
            RETURNING id_invernadero;
        `, [userId]);
        const invernaderoIds = invernaderoResult.rows.map(r => r.id_invernadero);
        console.log(`✓ ${invernaderoIds.length} invernaderos creados\n`);

        // 5. Crear lotes
        console.log('🌱 Creando lotes...');
        const loteResult = await client.query(`
            INSERT INTO lotes (id_invernadero, id_usuario, nombre_lote, especie, etapa_fenologica)
            VALUES 
            ($1, $4, 'Lote A1 - Tomates Cherry', 'Solanum lycopersicum', 'Floración'),
            ($1, $4, 'Lote A2 - Tomates Beefsteak', 'Solanum lycopersicum', 'Fructificación'),
            ($2, $4, 'Lote B1 - Lechugas Crespa', 'Lactuca sativa', 'Crecimiento vegetativo'),
            ($3, $4, 'Lote C1 - Pimientos Rojos', 'Capsicum annuum', 'Floración')
            RETURNING id_lote;
        `, [invernaderoIds[0], invernaderoIds[1], invernaderoIds[2], userId]);
        const loteIds = loteResult.rows.map(r => r.id_lote);
        console.log(`✓ ${loteIds.length} lotes creados\n`);

        // 6. Crear sensores
        console.log('📊 Creando sensores...');
        const sensorResult = await client.query(`
            INSERT INTO sensores (id_lote, id_usuario, nombre_sensor, tipo_sensor, id_dispositivo)
            VALUES 
            ($1, $5, 'Sensor Temp-Hum 1', 'multiparametro', 'SENSOR_001'),
            ($2, $5, 'Sensor Temp-Hum 2', 'multiparametro', 'SENSOR_002'),
            ($3, $5, 'Sensor Temp-Hum 3', 'multiparametro', 'SENSOR_003'),
            ($4, $5, 'Sensor Temp-Hum 4', 'multiparametro', 'SENSOR_004')
            RETURNING id_sensor;
        `, [loteIds[0], loteIds[1], loteIds[2], loteIds[3], userId]);
        const sensorIds = sensorResult.rows.map(r => r.id_sensor);
        console.log(`✓ ${sensorIds.length} sensores creados\n`);

        // 7. Crear lecturas de sensores (datos históricos)
        console.log('📈 Creando lecturas históricas de sensores...');
        
        const now = new Date();
        let lecturaCount = 0;
        for (let i = 0; i < sensorIds.length; i++) {
            const sensorId = sensorIds[i];
            const loteId = loteIds[i];
            for (let h = 23; h >= 0; h--) {
                const timestamp = new Date(now.getTime() - h * 60 * 60 * 1000);
                const temp = 20 + Math.random() * 8;
                const hum = 70 + Math.random() * 20;
                const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.7));
                const ea = (hum / 100) * es;
                const dpv = es - ea;

                await client.query(`
                    INSERT INTO lecturas_sensores (id_sensor, id_lote, temperatura_celsius, humedad_relativa, dpv_calculado, presion_vapor_saturacion, presion_vapor_real, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [sensorId, loteId, temp.toFixed(2), hum.toFixed(2), dpv.toFixed(3), es.toFixed(3), ea.toFixed(3), timestamp.toISOString()]);
                lecturaCount++;
            }
        }
        console.log(`✓ ${lecturaCount} lecturas creadas\n`);

        // 8. Crear algunas alertas de ejemplo
        console.log('🚨 Creando alertas de ejemplo...');
        const alertaResult = await client.query(`
            INSERT INTO alertas (id_lote, id_usuario, tipo_riesgo, dpv_desencadenante, mensaje_texto, estado)
            VALUES 
            ($1, $2, 'critico', 1.45, 'Tendencia de estrés hídrico detectada', 'generada'),
            ($3, $2, 'pre_critico', 0.5, 'Temperatura por debajo de lo óptimo', 'resuelta'),
            ($4, $2, 'estable', 0.3, 'Humedad relativa elevada', 'resuelta')
            RETURNING id_alerta;
        `, [loteIds[0], userId, loteIds[1], loteIds[2]]);
        const alertIds = alertaResult.rows.map(r => r.id_alerta);
        console.log(`✓ ${alertaResult.rows.length} alertas creadas\n`);

        // 9. Crear recomendaciones (vinculadas a alertas)
        console.log('💡 Creando recomendaciones...');
        const recomResult = await client.query(`
            INSERT INTO recomendaciones (id_alerta, id_lote, nivel_severidad, texto_recomendacion)
            VALUES 
            ($1, $2, 'alto', 'Aumentar frecuencia de riego a cada 4 horas'),
            ($3, $4, 'medio', 'Abrir ventilaciones laterales 30 minutos'),
            ($5, $6, 'bajo', 'Reducir frecuencia de riego')
            RETURNING id_recomendacion;
        `, [alertIds[0], loteIds[0], alertIds[1], loteIds[1], alertIds[2], loteIds[2]]);
        console.log(`✓ ${recomResult.rows.length} recomendaciones creadas\n`);

        console.log('\n✅ BASE DE DATOS POBLADA EXITOSAMENTE\n');
        console.log('📊 Datos de prueba creados:');
        console.log(`  - 1 usuario: agricultor@agrosens.com`);
        console.log(`    Contraseña: test123`);
        console.log(`  - 3 invernaderos`);
        console.log(`  - 4 lotes`);
        console.log(`  - 4 sensores`);
        console.log(`  - ${lecturaCount} lecturas de sensores`);
        console.log(`  - ${alertaResult.rows.length} alertas`);
        console.log(`  - ${recomResult.rows.length} recomendaciones\n`);

        await client.end();
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

cleanAndPopulateDatabase();
